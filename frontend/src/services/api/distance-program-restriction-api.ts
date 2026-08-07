import api from "@/lib/api";

export type DistanceRestrictionCatalogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type DistanceRestrictionDegreeLevel = "BACHELOR" | "MASTER";

export interface DistanceProgramRestrictionEntryInput {
  programCode: string; programName: string; degreeLevel: DistanceRestrictionDegreeLevel; reason: string;
}

export interface SaveDistanceProgramRestrictionCatalogInput {
  catalogYear: number; versionCode: string; authorityName: string; documentNumber: string;
  documentDate: string; publicationDate: string; documentReference: string; scopeNote: string;
  entries: DistanceProgramRestrictionEntryInput[];
}

export interface DistanceProgramRestrictionEntry extends DistanceProgramRestrictionEntryInput { id: number }

export interface DistanceProgramRestrictionCatalog extends Omit<SaveDistanceProgramRestrictionCatalogInput, "entries"> {
  id: number; publicationDeadline: string; deadlineCompliant: boolean; status: DistanceRestrictionCatalogStatus;
  entries: DistanceProgramRestrictionEntry[]; createdByName: string; publishedAt?: string | null;
  publishedByName?: string | null; verificationNote?: string | null; archivedAt?: string | null;
}

export const distanceRestrictionInputError = (input: SaveDistanceProgramRestrictionCatalogInput): string | null => {
  const currentYear = new Date().getFullYear();
  if (input.catalogYear < 2022 || input.catalogYear > currentYear + 1) return "Katalog yili 2022 va keyingi yil oralig'ida bo'lishi kerak";
  if (!input.versionCode.trim()) return "Versiya kodi majburiy";
  if (input.authorityName.trim().length < 3) return "Vakolatli vazirlik nomi majburiy";
  if (!input.documentNumber.trim()) return "Hujjat raqami majburiy";
  if (!input.documentDate || !input.publicationDate || input.documentDate > input.publicationDate) return "Hujjat sanasi e'lon sanasidan keyin bo'lmasligi kerak";
  if (input.documentReference.trim().length < 5) return "Rasmiy hujjat yoki e'lon rekviziti majburiy";
  if (input.scopeNote.trim().length < 10) return "Katalog qamrovi izohi kamida 10 belgi bo'lishi kerak";
  const keys = input.entries.map((entry) => `${entry.programCode.trim().toUpperCase()}|${entry.degreeLevel}`);
  if (new Set(keys).size !== keys.length) return "Dastur kodi va darajasi takrorlanmasligi kerak";
  if (input.entries.some((entry) => !entry.programCode.trim() || entry.programName.trim().length < 3 || entry.reason.trim().length < 5)) return "Har taqiqlangan yo'nalishda kod, nom va asos majburiy";
  return null;
};

export const distanceProgramRestrictionApi = {
  list: async () => (await api.get<DistanceProgramRestrictionCatalog[]>("/distance-program-restrictions")).data,
  create: async (input: SaveDistanceProgramRestrictionCatalogInput) => (await api.post<DistanceProgramRestrictionCatalog>("/distance-program-restrictions", input)).data,
  update: async (id: number, input: SaveDistanceProgramRestrictionCatalogInput) => (await api.put<DistanceProgramRestrictionCatalog>(`/distance-program-restrictions/${id}`, input)).data,
  publish: async (id: number, verificationNote: string) => (await api.post<DistanceProgramRestrictionCatalog>(`/distance-program-restrictions/${id}/publish`, { verificationNote })).data,
  archive: async (id: number) => (await api.post<DistanceProgramRestrictionCatalog>(`/distance-program-restrictions/${id}/archive`)).data,
};
