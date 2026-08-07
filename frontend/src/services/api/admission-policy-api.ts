import api from "@/lib/api";

export type InstitutionGovernanceType = "STATE_STANDARD" | "STATE_FINANCIALLY_AUTONOMOUS" | "NON_STATE";
export type ApprovalAuthorityType = "SUBORDINATE_MINISTRY_AGENCY" | "SUPERVISORY_BOARD" | "FOUNDER";
export type AdmissionPolicyStatus = "DRAFT" | "APPROVED" | "ARCHIVED";

export interface DistanceAdmissionPolicy {
  id: number;
  programId: number;
  programName: string;
  academicYear: string;
  versionCode: string;
  institutionGovernanceType: InstitutionGovernanceType;
  approvalAuthorityType: ApprovalAuthorityType;
  institutionName: string;
  approvingAuthorityName: string;
  admissionQuota: number;
  contractAmount: number;
  currency: "UZS";
  higherEducationMinistryAgreementReference?: string | null;
  economyMinistryAgreementReference?: string | null;
  status: AdmissionPolicyStatus;
  createdByName: string;
  approvalDocumentNumber?: string | null;
  approvalDocumentDate?: string | null;
  approvalDocumentReference?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  archivedAt?: string | null;
}

export interface SaveDistanceAdmissionPolicyInput {
  programId: number;
  academicYear: string;
  versionCode: string;
  institutionGovernanceType: InstitutionGovernanceType;
  approvalAuthorityType: ApprovalAuthorityType;
  institutionName: string;
  approvingAuthorityName: string;
  admissionQuota: number;
  contractAmount: number;
  higherEducationMinistryAgreementReference?: string | null;
  economyMinistryAgreementReference?: string | null;
}

export interface ApproveDistanceAdmissionPolicyInput {
  approvalDocumentNumber: string;
  approvalDocumentDate: string;
  approvalDocumentReference: string;
}

export const authorityForGovernance = (type: InstitutionGovernanceType): ApprovalAuthorityType => ({
  STATE_STANDARD: "SUBORDINATE_MINISTRY_AGENCY",
  STATE_FINANCIALLY_AUTONOMOUS: "SUPERVISORY_BOARD",
  NON_STATE: "FOUNDER",
}[type] as ApprovalAuthorityType);

export const admissionPolicyInputError = (input: SaveDistanceAdmissionPolicyInput): string | null => {
  const match = /^(\d{4})-(\d{4})$/.exec(input.academicYear);
  if (!input.programId || !input.versionCode.trim()) return "Dastur va versiya kodi majburiy";
  if (!match || Number(match[2]) !== Number(match[1]) + 1) return "O'quv yili YYYY-YYYY ketma-ket formatida bo'lishi kerak";
  if (!input.institutionName.trim() || !input.approvingAuthorityName.trim()) return "OTM va tasdiqlovchi organ nomi majburiy";
  if (input.approvalAuthorityType !== authorityForGovernance(input.institutionGovernanceType)) return "OTM turiga mos tasdiqlovchi vakolat tanlanishi shart";
  if (!Number.isInteger(input.admissionQuota) || input.admissionQuota < 1) return "Qabul parametri musbat butun son bo'lishi kerak";
  if (!Number.isFinite(input.contractAmount) || input.contractAmount <= 0) return "Kontrakt qiymati musbat bo'lishi kerak";
  if (input.institutionGovernanceType === "STATE_STANDARD" && (!input.higherEducationMinistryAgreementReference?.trim() || !input.economyMinistryAgreementReference?.trim())) return "Oddiy davlat OTM uchun ikki vazirlik bilan kelishuv rekvizitlari majburiy";
  if (input.institutionGovernanceType !== "STATE_STANDARD" && (input.higherEducationMinistryAgreementReference?.trim() || input.economyMinistryAgreementReference?.trim())) return "Vazirlik kelishuvlari faqat oddiy davlat OTM uchun qo'llanadi";
  return null;
};

export const admissionPolicyApi = {
  list: async () => (await api.get<DistanceAdmissionPolicy[]>("/distance-admission-policies")).data,
  get: async (id: number) => (await api.get<DistanceAdmissionPolicy>(`/distance-admission-policies/${id}`)).data,
  create: async (input: SaveDistanceAdmissionPolicyInput) => (await api.post<DistanceAdmissionPolicy>("/distance-admission-policies", input)).data,
  update: async (id: number, input: SaveDistanceAdmissionPolicyInput) => (await api.put<DistanceAdmissionPolicy>(`/distance-admission-policies/${id}`, input)).data,
  approve: async (id: number, input: ApproveDistanceAdmissionPolicyInput) => (await api.post<DistanceAdmissionPolicy>(`/distance-admission-policies/${id}/approve`, input)).data,
  archive: async (id: number) => (await api.post<DistanceAdmissionPolicy>(`/distance-admission-policies/${id}/archive`)).data,
};
