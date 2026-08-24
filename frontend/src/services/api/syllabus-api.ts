import api from "@/lib/api";

export type SyllabusLanguage = "UZ" | "EN" | "RU" | "KAA" | "UZ_CYRILLIC";
export interface SubjectSyllabus {
  id: number; subjectId: number; subjectCode?: string | null; subjectName: string;
  name: string; language: SyllabusLanguage; shortDescription: string;
  requirements?: string | null; fullDescription: string; active: boolean;
}
export interface SubjectSyllabusInput {
  subjectId: number; name: string; language: SyllabusLanguage;
  shortDescription: string; requirements?: string | null; fullDescription: string; active: boolean;
}
export const syllabusApi = {
  list: async (subjectId?: number) => (await api.get<SubjectSyllabus[]>("/syllabi", { params: subjectId ? { subjectId } : undefined })).data,
  create: async (input: SubjectSyllabusInput) => (await api.post<SubjectSyllabus>("/syllabi", input)).data,
  update: async (id: number, input: SubjectSyllabusInput) => (await api.put<SubjectSyllabus>(`/syllabi/${id}`, input)).data,
  delete: async (id: number) => { await api.delete(`/syllabi/${id}`); },
};
