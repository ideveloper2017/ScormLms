import api from "@/lib/api";

export type DistanceReadinessStatus = "DRAFT" | "VERIFIED" | "REJECTED" | "ARCHIVED";
export type ServerOwnershipType = "OWNED" | "LEASED";

export interface SaveDistanceReadinessInput {
  versionCode: string;
  title: string;
  internetProvider: string;
  internetCapacityMbps: number;
  internetEvidenceReference: string;
  computerFacilityAddress: string;
  sanitationDocumentNumber: string;
  sanitationDocumentDate: string;
  sanitationEvidenceReference: string;
  technicalStaffCount: number;
  technicalStaffQualificationReference: string;
  plannedDistanceStudents: number;
  serverCapacityStudents: number;
  serverOwnershipType: ServerOwnershipType;
  serverCountryCode: string;
  serverLocationAddress: string;
  serverDocumentNumber: string;
  serverDocumentDate: string;
  serverEvidenceReference: string;
  leaseStartDate?: string | null;
  leaseEndDate?: string | null;
  officialWebsiteUrl: string;
  websiteHasCharter: boolean;
  websiteHasCurricula: boolean;
  websiteHasStaffInformation: boolean;
  websiteHasAcademicCalendar: boolean;
  websiteReviewedAt: string;
}

export interface DistanceReadinessProfile extends SaveDistanceReadinessInput {
  id: number;
  minimumFiveYearLease: boolean;
  status: DistanceReadinessStatus;
  createdByName: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  reviewNote?: string | null;
  archivedAt?: string | null;
}

export const distanceReadinessInputError = (input: SaveDistanceReadinessInput): string | null => {
  if (!input.versionCode.trim() || input.title.trim().length < 5) return "Versiya va profil nomi majburiy";
  if (!input.internetProvider.trim() || input.internetCapacityMbps <= 0 || input.internetEvidenceReference.trim().length < 5) return "Internet provayderi, sig'imi va dalili majburiy";
  if (input.computerFacilityAddress.trim().length < 5 || !input.sanitationDocumentNumber.trim() || !input.sanitationDocumentDate || input.sanitationEvidenceReference.trim().length < 5) return "Kompyuter xonasi va sanitariya hujjati to'liq kiritilishi kerak";
  if (input.technicalStaffCount < 1 || input.technicalStaffQualificationReference.trim().length < 5) return "Kamida bitta malakali muhandis-texnik xodim dalili kerak";
  if (input.plannedDistanceStudents < 1 || input.serverCapacityStudents < input.plannedDistanceStudents) return "Server quvvati rejalashtirilgan talabalar sonidan kam bo'lmasligi kerak";
  if (input.serverCountryCode.trim().toUpperCase() !== "UZ") return "Server O'zbekiston hududida joylashishi kerak";
  if (input.serverLocationAddress.trim().length < 5 || !input.serverDocumentNumber.trim() || !input.serverDocumentDate || input.serverEvidenceReference.trim().length < 5) return "Server manzili va egalik/ijara hujjati to'liq kiritilishi kerak";
  if (input.serverOwnershipType === "LEASED") {
    if (!input.leaseStartDate || !input.leaseEndDate) return "Ijara boshlanish va tugash sanalari majburiy";
    const minimumEnd = new Date(`${input.leaseStartDate}T00:00:00Z`);
    minimumEnd.setUTCFullYear(minimumEnd.getUTCFullYear() + 5);
    if (new Date(`${input.leaseEndDate}T00:00:00Z`) < minimumEnd) return "Server ijara muddati kamida 5 yil bo'lishi kerak";
  }
  try {
    const website = new URL(input.officialWebsiteUrl);
    if (website.protocol !== "https:" || !website.hostname || website.username || website.password) return "Rasmiy sayt aniq HTTPS URL bo'lishi kerak";
  } catch { return "Rasmiy sayt aniq HTTPS URL bo'lishi kerak"; }
  if (!input.websiteReviewedAt) return "Rasmiy sayt tekshiruv vaqti majburiy";
  return null;
};

export const distanceReadinessApi = {
  list: async () => (await api.get<DistanceReadinessProfile[]>("/distance-readiness")).data,
  create: async (input: SaveDistanceReadinessInput) => (await api.post<DistanceReadinessProfile>("/distance-readiness", input)).data,
  update: async (id: number, input: SaveDistanceReadinessInput) => (await api.put<DistanceReadinessProfile>(`/distance-readiness/${id}`, input)).data,
  verify: async (id: number, note: string) => (await api.post<DistanceReadinessProfile>(`/distance-readiness/${id}/verify`, { note })).data,
  reject: async (id: number, note: string) => (await api.post<DistanceReadinessProfile>(`/distance-readiness/${id}/reject`, { note })).data,
  archive: async (id: number) => (await api.post<DistanceReadinessProfile>(`/distance-readiness/${id}/archive`)).data,
};

