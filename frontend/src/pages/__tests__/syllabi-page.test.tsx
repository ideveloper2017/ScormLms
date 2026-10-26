import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { AdminSyllabi } from "../admin/syllabi";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";
import { modelProgramApi, type ModelProgram } from "@/services/api/model-program-api";
import { listSubjects } from "@/lib/academic-api";

vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({ ...await importOriginal<object>(), syllabusApi: { list: vi.fn(), delete: vi.fn() } }));
vi.mock("@/services/api/model-program-api", () => ({ modelProgramApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() } }));
vi.mock("@/services/api/academic-period-api", () => ({ academicPeriodApi: { listYears: vi.fn(async () => []), listSemesters: vi.fn(async () => []) } }));
vi.mock("@/lib/academic-api", async (importOriginal) => ({ ...await importOriginal<object>(), listSubjects: vi.fn() }));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ user: { id: 1, role: { name: "admin" }, roles: [], permissions: ["ACADEMIC_WRITE"] } }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const model = (id: number, subjectName: string, count: number): ModelProgram => ({
  id, subjectId: id, subjectName, subjectCode: `S${id}`, subjectCredits: 4, language: "UZ", name: subjectName,
  shortDescription: "Qisqa", fullDescription: "To'liq", active: true, workProgramCount: count,
});
const work = (id: number, modelProgramId: number, academicYear: string, semester: number): SubjectSyllabus => ({
  id, subjectId: modelProgramId, subjectName: "x", name: `x ${academicYear}`, language: "UZ", shortDescription: "q", fullDescription: "t",
  active: true, status: "DRAFT", revisionNumber: 1, modelProgramId, academicYear, semester, topics: [],
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listSubjects).mockResolvedValue([]);
  vi.mocked(modelProgramApi.list).mockResolvedValue([model(1, "Matematika", 2), model(2, "Fizika", 0)]);
  vi.mocked(syllabusApi.list).mockResolvedValue([work(10, 1, "2025-2026", 1), work(11, 1, "2026-2027", 1), work(12, 2, "2026-2027", 2)]);
});

it("avval o'quv dasturlari, tanlanganda uning fan dasturlari ko'rinadi va fan dasturi formasi ochiladi", async () => {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><AdminSyllabi /></MemoryRouter></QueryClientProvider>);

  expect(await screen.findByText("Matematika")).toBeInTheDocument();
  expect(screen.getByText(/"Fan dasturlari" tugmasini bosing/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "2 ta" }));
  const section = await screen.findByRole("region", { name: "Fan dasturlari" });
  expect(within(section).getByText("2025-2026 · 1-semestr")).toBeInTheDocument();
  expect(within(section).getByText("2026-2027 · 1-semestr")).toBeInTheDocument();
  expect(within(section).queryByText("2026-2027 · 2-semestr")).not.toBeInTheDocument();

  fireEvent.click(within(section).getByRole("button", { name: /Fan dasturi qo'shish/ }));
  expect(await screen.findByRole("dialog", { name: /Fan dasturi — Matematika/ })).toBeInTheDocument();
});
