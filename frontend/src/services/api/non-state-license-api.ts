import api from "@/lib/api";

export type NonStateLicenseStatus = "DRAFT" | "VERIFIED" | "REVOKED";

export interface LicenseProgramScope {
  id: number;
  programId: number;
  programCode: string;
  programName: string;
  degreeLevel: "BACHELOR" | "MASTER";
  distanceEducationCovered: boolean;
}

export interface NonStateEducationLicense {
  id: number;
  institutionName: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  validFrom: string;
  validUntil?: string | null;
  officialRegistryReference: string;
  status: NonStateLicenseStatus;
  effective: boolean;
  createdByName: string;
  verificationEvidence?: string | null;
  verifiedByName?: string | null;
  verifiedAt?: string | null;
  revocationReason?: string | null;
  revocationDocumentReference?: string | null;
  revokedAt?: string | null;
  scopes: LicenseProgramScope[];
}

export interface SaveNonStateLicenseInput {
  institutionName: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: string;
  validFrom: string;
  validUntil?: string | null;
  officialRegistryReference: string;
}

export const nonStateLicenseInputError = (input: SaveNonStateLicenseInput): string | null => {
  if (!input.institutionName.trim() || !input.licenseNumber.trim() || !input.issuingAuthority.trim()) return "OTM, litsenziya raqami va vakolatli organ majburiy";
  if (!input.issueDate || !input.validFrom) return "Berilgan va amal qilish boshlanish sanalari majburiy";
  if (input.validFrom < input.issueDate) return "Amal qilish boshlanishi litsenziya berilgan sanadan oldin bo'lmaydi";
  if (input.validUntil && input.validUntil < input.validFrom) return "Amal qilish tugash sanasi boshlanish sanasidan oldin bo'lmaydi";
  if (!input.officialRegistryReference.trim()) return "Rasmiy litsenziya reestri rekviziti majburiy";
  return null;
};

export const nonStateLicenseApi = {
  list: async () => (await api.get<NonStateEducationLicense[]>("/non-state-licenses")).data,
  create: async (input: SaveNonStateLicenseInput) => (await api.post<NonStateEducationLicense>("/non-state-licenses", input)).data,
  update: async (id: number, input: SaveNonStateLicenseInput) => (await api.put<NonStateEducationLicense>(`/non-state-licenses/${id}`, input)).data,
  addScope: async (id: number, programId: number) => (await api.post<NonStateEducationLicense>(`/non-state-licenses/${id}/scopes`, { programId })).data,
  removeScope: async (id: number, scopeId: number) => (await api.delete<NonStateEducationLicense>(`/non-state-licenses/${id}/scopes/${scopeId}`)).data,
  verify: async (id: number, verificationEvidence: string) => (await api.post<NonStateEducationLicense>(`/non-state-licenses/${id}/verify`, { verificationEvidence })).data,
  revoke: async (id: number, reason: string, documentReference: string) => (await api.post<NonStateEducationLicense>(`/non-state-licenses/${id}/revoke`, { reason, documentReference })).data,
};
