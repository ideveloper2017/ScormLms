import api from "@/lib/api";

export type BiometricPolicyStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface SaveBiometricPolicyInput {
  versionCode: string;
  title: string;
  purposeText: string;
  legalBasis: string;
  consentText: string;
  privacyNotice: string;
  documentNumber: string;
  documentDate: string;
  documentReference: string;
  faceTemplateRetentionDays: number;
  proctoringEvidenceRetentionDays: number;
}

export interface BiometricPolicy extends SaveBiometricPolicyInput {
  id: number;
  statementHash: string;
  status: BiometricPolicyStatus;
  createdByName: string;
  publishedAt?: string | null;
  publishedByName?: string | null;
  approvalNote?: string | null;
  archivedAt?: string | null;
}

export interface MyBiometricStatus {
  policy?: BiometricPolicy | null;
  consentGranted: boolean;
  consentedAt?: string | null;
  withdrawnAt?: string | null;
  faceRegistered: boolean;
  faceUploadedAt?: string | null;
  faceExpiresAt?: string | null;
}

export interface BiometricRetentionRun {
  faceTemplatesPurged: number;
  proctoringEvidencePurged: number;
  executedAt: string;
}

export const biometricPolicyInputError = (input: SaveBiometricPolicyInput): string | null => {
  if (!input.versionCode.trim()) return "Versiya kodi majburiy";
  if (input.title.trim().length < 5) return "Siyosat nomi kamida 5 belgi bo'lishi kerak";
  if (input.purposeText.trim().length < 20) return "Qayta ishlash maqsadi kamida 20 belgi bo'lishi kerak";
  if (input.legalBasis.trim().length < 10) return "Huquqiy asos kamida 10 belgi bo'lishi kerak";
  if (input.consentText.trim().length < 30) return "Aniq rozilik matni kamida 30 belgi bo'lishi kerak";
  if (input.privacyNotice.trim().length < 30) return "Maxfiylik xabarnomasi kamida 30 belgi bo'lishi kerak";
  if (!input.documentNumber.trim() || !input.documentDate || input.documentReference.trim().length < 5) return "Tasdiqlovchi hujjat rekvizitlari majburiy";
  if (input.faceTemplateRetentionDays < 1 || input.faceTemplateRetentionDays > 3650) return "Yuz shabloni retention muddati 1..3650 kun bo'lishi kerak";
  if (input.proctoringEvidenceRetentionDays < 1 || input.proctoringEvidenceRetentionDays > 3650) return "Proktoring dalili retention muddati 1..3650 kun bo'lishi kerak";
  return null;
};

export const biometricGovernanceApi = {
  listPolicies: async () => (await api.get<BiometricPolicy[]>("/biometric-governance/policies")).data,
  createPolicy: async (input: SaveBiometricPolicyInput) => (await api.post<BiometricPolicy>("/biometric-governance/policies", input)).data,
  updatePolicy: async (id: number, input: SaveBiometricPolicyInput) => (await api.put<BiometricPolicy>(`/biometric-governance/policies/${id}`, input)).data,
  publishPolicy: async (id: number, approvalNote: string) => (await api.post<BiometricPolicy>(`/biometric-governance/policies/${id}/publish`, { approvalNote })).data,
  archivePolicy: async (id: number) => (await api.post<BiometricPolicy>(`/biometric-governance/policies/${id}/archive`)).data,
  myStatus: async () => (await api.get<MyBiometricStatus>("/biometric-governance/me")).data,
  accept: async (policyId: number, statementHash: string) => (await api.post<MyBiometricStatus>("/biometric-governance/me/consent", { policyId, statementHash })).data,
  withdraw: async (reason: string) => (await api.post<MyBiometricStatus>("/biometric-governance/me/withdraw", { reason })).data,
  runRetention: async () => (await api.post<BiometricRetentionRun>("/biometric-governance/retention/run")).data,
};
