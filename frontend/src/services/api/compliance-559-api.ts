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
  violations: ComplianceViolation[];
}

export async function getDecision559Compliance(): Promise<Decision559ComplianceSummary> {
  const response = await api.get<ApiResponse<Decision559ComplianceSummary>>("/compliance/559/summary");
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message ?? "559-son qaror bo'yicha holatni yuklab bo'lmadi");
  }
  return response.data.data;
}
