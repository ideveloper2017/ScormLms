import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

function positiveInteger(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function nonNegativeInteger(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return value;
}

function percentile(sorted, value) {
  if (sorted.length === 0) return 0;
  const index = Math.max(0, Math.ceil((value / 100) * sorted.length) - 1);
  return Number(sorted[index].toFixed(2));
}

const baseUrl = process.env.LOAD_BASE_URL ?? "http://127.0.0.1:8080";
const path = process.env.LOAD_PATH ?? "/actuator/health";
const requestCount = positiveInteger("LOAD_REQUESTS", 1000);
const concurrency = Math.min(positiveInteger("LOAD_CONCURRENCY", 25), requestCount);
const expectedStatus = positiveInteger("LOAD_EXPECTED_STATUS", 200);
const timeoutMs = positiveInteger("LOAD_TIMEOUT_MS", 5000);
const warmupRequests = nonNegativeInteger("LOAD_WARMUP_REQUESTS", 20);
const maxP95Ms = positiveInteger("LOAD_MAX_P95_MS", 500);
const maxErrors = nonNegativeInteger("LOAD_MAX_ERRORS", 0);
const reportPath = process.env.LOAD_REPORT_PATH
  ? resolve(process.cwd(), process.env.LOAD_REPORT_PATH)
  : null;

const target = new URL(path, baseUrl);
if (!['http:', 'https:'].includes(target.protocol)) {
  throw new Error("LOAD_BASE_URL must use http or https");
}

async function requestOnce() {
  const startedAt = performance.now();
  try {
    const response = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": "scorm-lms-load-smoke/1.0" },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.arrayBuffer();
    return { latencyMs: performance.now() - startedAt, status: response.status, error: null };
  } catch (error) {
    return {
      latencyMs: performance.now() - startedAt,
      status: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

for (let index = 0; index < warmupRequests; index += 1) {
  await requestOnce();
}

const results = new Array(requestCount);
let nextIndex = 0;
const startedAt = performance.now();
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= requestCount) return;
      results[index] = await requestOnce();
    }
  }),
);
const durationMs = performance.now() - startedAt;

const latencies = results.map((result) => result.latencyMs).sort((left, right) => left - right);
const statusCounts = {};
let transportErrors = 0;
let unexpectedStatuses = 0;
for (const result of results) {
  if (result.error) transportErrors += 1;
  const key = result.status === null ? "transport-error" : String(result.status);
  statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  if (result.status !== expectedStatus) unexpectedStatuses += 1;
}

const totalErrors = transportErrors + unexpectedStatuses;
const p95Ms = percentile(latencies, 95);
const passed = totalErrors <= maxErrors && p95Ms <= maxP95Ms;
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  target: target.toString(),
  method: "GET",
  requestCount,
  warmupRequests,
  concurrency,
  expectedStatus,
  timeoutMs,
  thresholds: { maxP95Ms, maxErrors },
  durationMs: Number(durationMs.toFixed(2)),
  requestsPerSecond: Number((requestCount / (durationMs / 1000)).toFixed(2)),
  latencyMs: {
    min: Number(latencies[0].toFixed(2)),
    p50: percentile(latencies, 50),
    p95: p95Ms,
    p99: percentile(latencies, 99),
    max: Number(latencies[latencies.length - 1].toFixed(2)),
  },
  statusCounts,
  transportErrors,
  unexpectedStatuses,
  passed,
};

if (reportPath) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(report, null, 2));
if (!passed) process.exitCode = 2;
