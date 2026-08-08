import api, { type ApiResponse } from "@/lib/api";

export const DECISION_559_SOURCE_SHA256 = "A1E6CF0E05640B962550A7B9B95851404F7B50DF590BBA943846E1CEA5FCC2D3";
export const DECISION_559_REQUIRED_BANDS = [3, ...Array.from({ length: 26 }, (_, index) => index + 8)];

export type UatRunStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";
export type UatOutcome = "AUTOMATED_PASS" | "MANUAL_PASS" | "NOT_APPLICABLE" | "PARTIAL" | "BLOCKED_EXTERNAL";
export type UatReviewStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type UatManualEvidenceStatus = "PENDING" | "COLLECTED" | "ACCEPTED";

export interface Decision559UatRequirementGuidance {
  id: string;
  band: number;
  title: string;
  baselineStatus: "AUTOMATED_PASS" | "PARTIAL";
  owner: string;
  evidence: string[];
  blockedBy: string[];
  manualEvidence: string[];
  note: string;
}

export interface Decision559UatRun {
  id: number;
  title: string;
  sourceSha256: string;
  manifestSchemaVersion: number;
  status: UatRunStatus;
  evidenceCount: number;
  acceptedCount: number;
  blockingCount: number;
  manualEvidenceRequiredCount: number;
  manualEvidenceCoveredCount: number;
  manualEvidenceAcceptedCount: number;
  protocolNumber?: string | null;
  protocolSignedDate?: string | null;
  protocolSignatories?: string | null;
  protocolOriginalName?: string | null;
  protocolSha256?: string | null;
  protocolEvidenceSetSha256?: string | null;
  protocolUploadedAt?: string | null;
  evidenceSetSha256: string;
  readyToSubmit: boolean;
  submittedByName?: string | null;
  submittedAt?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Decision559UatEvidence {
  id: number;
  runId: number;
  requirementId: string;
  band: number;
  outcome: UatOutcome;
  ownerName: string;
  summary: string;
  evidenceReference?: string | null;
  manualEvidenceCoverage: string[];
  originalName?: string | null;
  contentType?: string | null;
  sizeBytes?: number | null;
  sha256?: string | null;
  files: Decision559UatEvidenceFile[];
  submittedByName: string;
  submittedAt: string;
  reviewStatus: UatReviewStatus;
  reviewNotes?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
}
export interface Decision559UatEvidenceFile {
  id: number;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  uploadedByName: string;
  uploadedAt: string;
}

export interface Decision559UatManualEvidenceProgress {
  runId: number;
  requiredCount: number;
  pendingCount: number;
  collectedCount: number;
  acceptedCount: number;
  coordinatedCount: number;
  uncoordinatedCount: number;
  overdueCount: number;
  items: Decision559UatManualEvidenceProgressItem[];
}

export interface Decision559UatManualEvidenceProgressItem {
  requirementId: string;
  band: number;
  itemIndex: number;
  description: string;
  recommendedOwner: string;
  actualOwnerName?: string | null;
  blockedBy: string[];
  status: UatManualEvidenceStatus;
  outcome?: UatOutcome | null;
  reviewStatus?: UatReviewStatus | null;
  evidenceId?: number | null;
  fileCount: number;
  submittedAt?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  coordinationAssigneeName?: string | null;
  coordinationDueDate?: string | null;
  coordinationNote?: string | null;
  coordinationOverdue: boolean;
  coordinatedByName?: string | null;
  coordinationUpdatedAt?: string | null;
}

export interface Decision559UatDetail { run: Decision559UatRun; evidence: Decision559UatEvidence[] }
export interface UatEvidenceInput {
  band: number;
  outcome: UatOutcome;
  ownerName: string;
  summary: string;
  evidenceReference?: string;
  file?: File | null;
  files?: File[];
  manualEvidenceIndexes?: number[];
}
export interface UatProtocolInput {
  protocolNumber: string;
  signedDate: string;
  signatories: string;
  evidenceSetSha256: string;
  file: File;
}
export interface DownloadedUatFile { blob: Blob; originalName: string; sha256?: string }

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message ?? fallback);
  return response.data;
}

function responseFileName(disposition: unknown, fallback: string): string {
  const value = typeof disposition === "string" ? disposition : "";
  const utf8 = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8);
  return value.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

export const decision559UatApi = {
  requirements: async () => {
    const response = await api.get<ApiResponse<Decision559UatRequirementGuidance[]>>("/compliance/559/uat/requirements");
    return unwrap(response.data, "UAT talablar yo'riqnomasini yuklab bo'lmadi");
  },
  manualEvidencePack: async (): Promise<DownloadedUatFile> => {
    const response = await api.get<Blob>("/compliance/559/uat/requirements/manual-evidence-pack", { responseType: "blob" });
    return {
      blob: response.data,
      originalName: responseFileName(
        response.headers["content-disposition"],
        "decision-559-manual-evidence-intake-pack.html",
      ),
      sha256: response.headers["x-content-sha256"],
    };
  },
  list: async () => {
    const response = await api.get<ApiResponse<Decision559UatRun[]>>("/compliance/559/uat/runs");
    return unwrap(response.data, "UAT runlarini yuklab bo'lmadi");
  },
  detail: async (id: number) => {
    const response = await api.get<ApiResponse<Decision559UatDetail>>(`/compliance/559/uat/runs/${id}`);
    return unwrap(response.data, "UAT runini yuklab bo'lmadi");
  },
  manualEvidenceProgress: async (runId: number) => {
    const response = await api.get<ApiResponse<Decision559UatManualEvidenceProgress>>(
      `/compliance/559/uat/runs/${runId}/manual-evidence-progress`,
    );
    return unwrap(response.data, "Manual dalil progressini yuklab bo'lmadi");
  },
  manualEvidenceProgressCsv: async (runId: number): Promise<DownloadedUatFile> => {
    const response = await api.get<Blob>(
      `/compliance/559/uat/runs/${runId}/manual-evidence-progress.csv`,
      { responseType: "blob" },
    );
    return {
      blob: response.data,
      originalName: responseFileName(
        response.headers["content-disposition"],
        `decision-559-uat-run-${runId}-manual-evidence-progress.csv`,
      ),
      sha256: response.headers["x-content-sha256"],
    };
  },
  updateManualTaskCoordination: async (
    runId: number,
    requirementId: string,
    itemIndex: number,
    input: { assigneeName: string; dueDate: string; note: string },
  ) => {
    const response = await api.post<ApiResponse<Decision559UatManualEvidenceProgress>>(
      `/compliance/559/uat/runs/${runId}/manual-evidence-progress/${requirementId}/${itemIndex}/coordination`,
      input,
    );
    return unwrap(response.data, "Manual topshiriq koordinatsiyasini saqlab bo'lmadi");
  },
  bulkCoordinateManualTasks: async (runId: number, input: { dueDate: string; note: string }) => {
    const response = await api.post<ApiResponse<Decision559UatManualEvidenceProgress>>(
      `/compliance/559/uat/runs/${runId}/manual-evidence-progress/coordination/bulk`,
      input,
    );
    return unwrap(response.data, "Manual topshiriqlarni ommaviy taqsimlab bo'lmadi");
  },
  create: async (title: string) => {
    const response = await api.post<ApiResponse<Decision559UatRun>>("/compliance/559/uat/runs", {
      title,
      sourceSha256: DECISION_559_SOURCE_SHA256,
    });
    return unwrap(response.data, "UAT runini yaratib bo'lmadi");
  },
  saveEvidence: async (runId: number, input: UatEvidenceInput) => {
    const form = new FormData();
    form.set("band", String(input.band));
    form.set("requirementId", `UAT-559-${String(input.band).padStart(2, "0")}`);
    form.set("outcome", input.outcome);
    form.set("ownerName", input.ownerName);
    form.set("summary", input.summary);
    if (input.evidenceReference?.trim()) form.set("evidenceReference", input.evidenceReference.trim());
    input.manualEvidenceIndexes?.forEach(index => form.append("manualEvidenceIndexes", String(index)));
    if (input.file) form.set("file", input.file);
    input.files?.forEach(file => form.append("files", file));
    const response = await api.post<ApiResponse<Decision559UatEvidence>>(
      `/compliance/559/uat/runs/${runId}/evidence`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap(response.data, "UAT dalilini saqlab bo'lmadi");
  },
  reviewEvidence: async (id: number, status: "ACCEPTED" | "REJECTED", notes: string) => {
    const response = await api.post<ApiResponse<Decision559UatEvidence>>(
      `/compliance/559/uat/evidence/${id}/review`,
      { status, notes },
    );
    return unwrap(response.data, "UAT dalil reviewini saqlab bo'lmadi");
  },
  uploadProtocol: async (runId: number, input: UatProtocolInput) => {
    const form = new FormData();
    form.set("protocolNumber", input.protocolNumber);
    form.set("signedDate", input.signedDate);
    form.set("signatories", input.signatories);
    form.set("evidenceSetSha256", input.evidenceSetSha256);
    form.set("file", input.file);
    const response = await api.post<ApiResponse<Decision559UatRun>>(
      `/compliance/559/uat/runs/${runId}/protocol`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap(response.data, "Imzolangan UAT protokolini yuklab bo'lmadi");
  },
  submit: async (runId: number) => {
    const response = await api.post<ApiResponse<Decision559UatRun>>(`/compliance/559/uat/runs/${runId}/submit`);
    return unwrap(response.data, "UAT runini reviewga yuborib bo'lmadi");
  },
  approve: async (runId: number) => {
    const response = await api.post<ApiResponse<Decision559UatRun>>(`/compliance/559/uat/runs/${runId}/approve`);
    return unwrap(response.data, "UAT runini tasdiqlab bo'lmadi");
  },
  reject: async (runId: number, reason: string) => {
    const response = await api.post<ApiResponse<Decision559UatRun>>(`/compliance/559/uat/runs/${runId}/reject`, { reason });
    return unwrap(response.data, "UAT runini rad etib bo'lmadi");
  },
  evidenceFile: async (id: number): Promise<DownloadedUatFile> => {
    const response = await api.get<Blob>(`/compliance/559/uat/evidence/${id}/file`, { responseType: "blob" });
    return {
      blob: response.data,
      originalName: responseFileName(response.headers["content-disposition"], `uat-evidence-${id}`),
      sha256: response.headers["x-content-sha256"],
    };
  },
  evidenceAttachmentFile: async (id: number): Promise<DownloadedUatFile> => {
    const response = await api.get<Blob>(`/compliance/559/uat/evidence/files/${id}`, { responseType: "blob" });
    return {
      blob: response.data,
      originalName: responseFileName(response.headers["content-disposition"], `uat-attachment-${id}`),
      sha256: response.headers["x-content-sha256"],
    };
  },
  deleteEvidenceAttachment: async (id: number) => {
    const response = await api.delete<ApiResponse<Decision559UatEvidence>>(`/compliance/559/uat/evidence/files/${id}`);
    return unwrap(response.data, "UAT attachmentni o'chirib bo'lmadi");
  },
  protocolFile: async (runId: number): Promise<DownloadedUatFile> => {
    const response = await api.get<Blob>(`/compliance/559/uat/runs/${runId}/protocol/file`, { responseType: "blob" });
    return {
      blob: response.data,
      originalName: responseFileName(response.headers["content-disposition"], `uat-protocol-${runId}.pdf`),
      sha256: response.headers["x-content-sha256"],
    };
  },
  protocolDraft: async (runId: number): Promise<DownloadedUatFile> => {
    const response = await api.get<Blob>(`/compliance/559/uat/runs/${runId}/protocol/draft`, { responseType: "blob" });
    return {
      blob: response.data,
      originalName: responseFileName(
        response.headers["content-disposition"],
        `decision-559-uat-run-${runId}-protocol-draft.html`,
      ),
      sha256: response.headers["x-content-sha256"],
    };
  },
  manifestFile: async (runId: number): Promise<DownloadedUatFile> => {
    const response = await api.get<Blob>(`/compliance/559/uat/runs/${runId}/manifest`, { responseType: "blob" });
    return {
      blob: response.data,
      originalName: responseFileName(response.headers["content-disposition"], `decision-559-uat-run-${runId}-manifest.json`),
      sha256: response.headers["x-content-sha256"],
    };
  },
  acceptanceBundle: async (runId: number): Promise<DownloadedUatFile> => {
    const response = await api.get<Blob>(`/compliance/559/uat/runs/${runId}/bundle`, { responseType: "blob" });
    return {
      blob: response.data,
      originalName: responseFileName(
        response.headers["content-disposition"],
        `decision-559-uat-run-${runId}-acceptance-bundle.zip`,
      ),
      sha256: response.headers["x-content-sha256"],
    };
  },
};
