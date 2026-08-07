import api, { type ApiResponse } from "@/lib/api";

export type AccountabilityReferralStatus = "DRAFT" | "REFERRED" | "DECIDED";
export type AccountabilityDecisionOutcome = "RESPONSIBILITY_ESTABLISHED" | "NO_RESPONSIBILITY_FOUND" | "PROCEEDING_TERMINATED";

export interface AccountabilityReferral {
  id: number; complianceIssueId: number; issueTitle: string; issueClause: string;
  reviewSubjectReference: string; competentAuthority: string; legalBasis: string;
  referralNumber: string; referralDate: string; evidencePackageReference: string;
  status: AccountabilityReferralStatus; createdByName: string;
  referredAt?: string | null; referredByName?: string | null; referralNote?: string | null;
  decisionOutcome?: AccountabilityDecisionOutcome | null; responsibilityEstablished: boolean;
  decisionAuthority?: string | null; decisionNumber?: string | null; decisionDate?: string | null;
  decisionEvidenceReference?: string | null; decisionSummary?: string | null;
  decidedAt?: string | null; decidedByName?: string | null;
}

export interface SaveAccountabilityReferralInput {
  complianceIssueId: number; reviewSubjectReference: string; competentAuthority: string;
  legalBasis: string; referralNumber: string; referralDate: string; evidencePackageReference: string;
}

export interface AccountabilityDecisionInput {
  outcome: AccountabilityDecisionOutcome; decisionAuthority: string; decisionNumber: string;
  decisionDate: string; decisionEvidenceReference: string; decisionSummary: string;
}

const unwrap = <T>(response: ApiResponse<T>, fallback: string): T => {
  if (!response.success || response.data == null) throw new Error(response.message ?? fallback);
  return response.data;
};

export const accountabilityReferralInputError = (input: SaveAccountabilityReferralInput, today: string): string | null => {
  if (!input.complianceIssueId) return "Compliance vazifasi majburiy";
  if (input.reviewSubjectReference.trim().length < 5) return "Tekshiruv subyekti rekviziti kamida 5 belgi bo'lishi kerak";
  if (input.competentAuthority.trim().length < 3) return "Vakolatli organ majburiy";
  if (input.legalBasis.trim().length < 5) return "Huquqiy asos majburiy";
  if (!input.referralNumber.trim()) return "Yo'llanma raqami majburiy";
  if (!input.referralDate || input.referralDate > today) return "Yo'llanma sanasi kelajakda bo'lmasligi kerak";
  if (input.evidencePackageReference.trim().length < 5) return "Dalil paketi rekviziti majburiy";
  return null;
};

export const accountabilityDecisionInputError = (input: AccountabilityDecisionInput, referralDate: string, today: string): string | null => {
  if (input.decisionAuthority.trim().length < 3) return "Qaror chiqargan vakolatli organ majburiy";
  if (!input.decisionNumber.trim()) return "Qaror raqami majburiy";
  if (!input.decisionDate || input.decisionDate < referralDate || input.decisionDate > today) return "Qaror sanasi yo'llanma sanasidan oldin yoki kelajakda bo'lmasligi kerak";
  if (input.decisionEvidenceReference.trim().length < 5) return "Qaror dalili rekviziti majburiy";
  if (input.decisionSummary.trim().length < 20) return "Qaror mazmuni kamida 20 belgi bo'lishi kerak";
  return null;
};

export const accountabilityReferralApi = {
  list: async () => unwrap((await api.get<ApiResponse<AccountabilityReferral[]>>("/compliance/559/accountability-referrals")).data, "Yo'llanmalarni yuklab bo'lmadi"),
  create: async (input: SaveAccountabilityReferralInput) => unwrap((await api.post<ApiResponse<AccountabilityReferral>>("/compliance/559/accountability-referrals", input)).data, "Yo'llanmani yaratib bo'lmadi"),
  update: async (id: number, input: SaveAccountabilityReferralInput) => unwrap((await api.put<ApiResponse<AccountabilityReferral>>(`/compliance/559/accountability-referrals/${id}`, input)).data, "Yo'llanmani yangilab bo'lmadi"),
  refer: async (id: number, referralNote: string) => unwrap((await api.post<ApiResponse<AccountabilityReferral>>(`/compliance/559/accountability-referrals/${id}/refer`, { referralNote })).data, "Yo'llanmani yuborib bo'lmadi"),
  recordDecision: async (id: number, input: AccountabilityDecisionInput) => unwrap((await api.post<ApiResponse<AccountabilityReferral>>(`/compliance/559/accountability-referrals/${id}/decision`, input)).data, "Tashqi qarorni qayd etib bo'lmadi"),
};
