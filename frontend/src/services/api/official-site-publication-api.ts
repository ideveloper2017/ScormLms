import api, { API_BASE_URL } from "@/lib/api";

export type OfficialSitePublicationCategory = "CHARTER_OR_STATUTE" | "CURRICULA_AND_PROGRAMS" | "TEACHING_STAFF" | "ACADEMIC_CALENDAR";
export type OfficialSitePublicationStatus = "DRAFT" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

export interface SaveOfficialSitePublicationInput {
  category: OfficialSitePublicationCategory;
  slug: string;
  versionCode: string;
  title: string;
  summary: string;
  sourceDocumentNumber: string;
  sourceDocumentDate: string;
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface OfficialSitePublication extends SaveOfficialSitePublicationInput {
  id: number;
  status: OfficialSitePublicationStatus;
  currentlyVisible: boolean;
  createdByName: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  reviewNote?: string | null;
  archivedAt?: string | null;
}

export interface PublicOfficialSitePublication {
  category: OfficialSitePublicationCategory;
  slug: string;
  versionCode: string;
  title: string;
  summary: string;
  sourceDocumentNumber: string;
  sourceDocumentDate: string;
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  publishedAt: string;
}

export interface PublicInstitutionDisclosure {
  generatedAt: string;
  complete: boolean;
  coveredCategories: OfficialSitePublicationCategory[];
  missingCategories: OfficialSitePublicationCategory[];
  publications: PublicOfficialSitePublication[];
}

export const categoryLabels: Record<OfficialSitePublicationCategory, string> = {
  CHARTER_OR_STATUTE: "Tashkilot nizomi yoki ustavi",
  CURRICULA_AND_PROGRAMS: "O'quv reja va dasturlari",
  TEACHING_STAFF: "Pedagog kadrlar haqida ma'lumot",
  ACADEMIC_CALENDAR: "Akademik kalendar",
};

export const officialSitePublicationInputError = (input: SaveOfficialSitePublicationInput): string | null => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length < 3 || input.slug.length > 100) return "Slug kichik lotin harfi, raqam va defisdan iborat bo'lishi kerak";
  if (!input.versionCode.trim() || input.versionCode.trim().length > 100) return "Versiya kodi majburiy";
  if (input.title.trim().length < 5 || input.title.trim().length > 500) return "Sarlavha 5..500 belgidan iborat bo'lishi kerak";
  if (input.summary.trim().length < 20 || input.summary.trim().length > 10_000) return "Ommaviy mazmun 20..10000 belgidan iborat bo'lishi kerak";
  if (!input.sourceDocumentNumber.trim() || !input.sourceDocumentDate || input.sourceReference.trim().length < 5) return "Manba hujjat rekvizitlari to'liq kiritilishi kerak";
  if (!input.effectiveFrom) return "Amal boshlanish sanasi majburiy";
  if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) return "Amal tugash sanasi boshlanish sanasidan oldin bo'lmasligi kerak";
  return null;
};

const publicDisclosureUrl = `${API_BASE_URL.replace(/\/api\/v1\/?$/, "")}/public/api/institution-disclosures`;

export const officialSitePublicationApi = {
  list: async () => (await api.get<OfficialSitePublication[]>("/official-site-publications")).data,
  create: async (input: SaveOfficialSitePublicationInput) => (await api.post<OfficialSitePublication>("/official-site-publications", input)).data,
  update: async (id: number, input: SaveOfficialSitePublicationInput) => (await api.put<OfficialSitePublication>(`/official-site-publications/${id}`, input)).data,
  publish: async (id: number, note: string) => (await api.post<OfficialSitePublication>(`/official-site-publications/${id}/publish`, { note })).data,
  reject: async (id: number, note: string) => (await api.post<OfficialSitePublication>(`/official-site-publications/${id}/reject`, { note })).data,
  archive: async (id: number) => (await api.post<OfficialSitePublication>(`/official-site-publications/${id}/archive`)).data,
  publicDisclosure: async (): Promise<PublicInstitutionDisclosure> => {
    const response = await fetch(publicDisclosureUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Rasmiy ommaviy axborotni yuklab bo'lmadi");
    return response.json() as Promise<PublicInstitutionDisclosure>;
  },
};

