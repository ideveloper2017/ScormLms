import api, { type ApiResponse } from "@/lib/api";

export type ComplianceStatus = "COMPLIANT" | "WARNING" | "NON_COMPLIANT";
export type RequirementImplementation = "IMPLEMENTED" | "PARTIAL" | "NOT_IMPLEMENTED";

export interface ComplianceMetric {
  code: string;
  label: string;
  currentValue: number;
  limitValue?: number | null;
  unit: string;
  status: ComplianceStatus;
}

export interface ProgramCompliance {
  programId: number;
  programName: string;
  degreeLevel?: string | null;
  informationTechnologyProgram: boolean;
  localDistanceStudents: number;
  admissionLimit?: number | null;
  status: ComplianceStatus;
}

export interface Decision559Requirement {
  code: string;
  clause: string;
  component: string;
  requirement: string;
  implementation: RequirementImplementation;
  route?: string | null;
  evidenceCodes: string[];
}

export interface ComplianceEvidence {
  code: string;
  label: string;
  recordCount: number;
  unit: string;
  source: string;
  route?: string | null;
  status: ComplianceStatus;
  measuredAt: string;
}

export interface ComplianceViolation {
  code: string;
  clause: string;
  severity: "CRITICAL" | "WARNING" | string;
  message: string;
  recommendation: string;
}

export interface Decision559ComplianceSummary {
  decisionNumber: string;
  decisionDate: string;
  generatedAt: string;
  overallStatus: ComplianceStatus;
  metrics: ComplianceMetric[];
  programs: ProgramCompliance[];
  requirements: Decision559Requirement[];
  evidence: ComplianceEvidence[];
  violations: ComplianceViolation[];
}

export type ComplianceIssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface ComplianceIssue {
  id: number;
  violationCode: string;
  clause: string;
  severity: "CRITICAL" | "WARNING";
  title: string;
  recommendation: string;
  remediationPlan: string;
  ownerId: number;
  ownerName: string;
  dueDate: string;
  overdue: boolean;
  status: ComplianceIssueStatus;
  resolutionEvidence?: string | null;
  resolvedAt?: string | null;
  resolvedByName?: string | null;
  closedAt?: string | null;
  closedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ComplianceOwner { id: number; name: string; username: string }
export interface ComplianceIssueInput { violationCode: string; ownerId: number; dueDate: string; remediationPlan: string }
export interface ComplianceIssueUpdate { ownerId: number; dueDate: string; remediationPlan: string }

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message ?? fallback);
  return response.data;
}

export async function getDecision559Compliance(): Promise<Decision559ComplianceSummary> {
  const response = await api.get<ApiResponse<Decision559ComplianceSummary>>("/compliance/559/summary");
  return unwrap(response.data, "559-son qaror bo'yicha holatni yuklab bo'lmadi");
}

export async function getComplianceIssues(): Promise<ComplianceIssue[]> {
  const response = await api.get<ApiResponse<ComplianceIssue[]>>("/compliance/559/issues");
  return unwrap(response.data, "Tuzatish vazifalarini yuklab bo'lmadi");
}

export async function getComplianceOwners(): Promise<ComplianceOwner[]> {
  const response = await api.get<ApiResponse<ComplianceOwner[]>>("/compliance/559/owners");
  return unwrap(response.data, "Mas'ullarni yuklab bo'lmadi");
}

export async function createComplianceIssue(input: ComplianceIssueInput): Promise<ComplianceIssue> {
  const response = await api.post<ApiResponse<ComplianceIssue>>("/compliance/559/issues", input);
  return unwrap(response.data, "Tuzatish vazifasini yaratib bo'lmadi");
}

export async function updateComplianceIssue(id: number, input: ComplianceIssueUpdate): Promise<ComplianceIssue> {
  const response = await api.put<ApiResponse<ComplianceIssue>>(`/compliance/559/issues/${id}`, input);
  return unwrap(response.data, "Tuzatish vazifasini yangilab bo'lmadi");
}

export async function changeComplianceIssueStatus(id: number, status: ComplianceIssueStatus, resolutionEvidence?: string): Promise<ComplianceIssue> {
  const response = await api.post<ApiResponse<ComplianceIssue>>(`/compliance/559/issues/${id}/status`, { status, resolutionEvidence });
  return unwrap(response.data, "Vazifa holatini o'zgartirib bo'lmadi");
}
