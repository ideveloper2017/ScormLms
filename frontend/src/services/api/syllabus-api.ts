import api from "@/lib/api";

export type SyllabusLanguage = "UZ" | "EN" | "RU" | "KAA" | "UZ_CYRILLIC";
/** THEORETICAL — nazariy (ma'ruza), PRACTICAL — amaliy mashg'ulot. */
export type SyllabusTopicType = "THEORETICAL" | "PRACTICAL";
export const syllabusTopicTypes: Record<SyllabusTopicType, string> = { THEORETICAL: "Nazariy mashg'ulotlar", PRACTICAL: "Amaliy mashg'ulotlar" };
export interface SyllabusTopic { id?: number | null; type: SyllabusTopicType; sortOrder: number; title: string; description?: string | null; hours: number }
/** id — mavjud mavzu (joyida yangilanadi, kurs bo'limlari bilan bog'lanish saqlanadi) */
export interface SyllabusTopicInput { id?: number | null; type: SyllabusTopicType; title: string; description?: string | null; hours: number }
export interface SubjectSyllabus {
  id: number; subjectId: number; subjectCode?: string | null; subjectName: string;
  name: string; language: SyllabusLanguage; shortDescription: string;
  requirements?: string | null; fullDescription: string; active: boolean;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED"; revisionNumber: number;
  topics?: SyllabusTopic[]; theoreticalHours?: number; practicalHours?: number;
}
export interface SyllabusRevision { revisionNumber: number; content: SubjectSyllabus; approvedByName: string; approvedAt: string }
export interface SubjectSyllabusInput {
  /** name berilmasa backend fan nomini oladi */
  subjectId: number; name?: string; language: SyllabusLanguage;
  shortDescription: string; requirements?: string | null; fullDescription: string; active: boolean;
  topics?: SyllabusTopicInput[];
}
/** Dasturga bog'langan kurs: qoralamasi mavzular bilan avtomatik moslanadi, nashr qilingani — kurs sahifasida */
export interface SyllabusLinkedCourse { id: number; title: string; status: string; autoSync: boolean; added: number; updated: number }
export interface SyllabusWithCourseInput {
  syllabus: SubjectSyllabusInput;
  /** null — faqat dastur yaratiladi */
  course: { title: string; shortDescription?: string | null; level?: string; language?: string } | null;
}
export const syllabusApi = {
  history: async (id: number) => (await api.get<SyllabusRevision[]>(`/syllabi/${id}/history`)).data,
  workflow: async (id: number, action: "SUBMIT" | "RETURN" | "APPROVE" | "NEW_VERSION") => (await api.post<SubjectSyllabus>(`/syllabi/${id}/workflow`, { action })).data,
  list: async (subjectId?: number) => (await api.get<SubjectSyllabus[]>("/syllabi", { params: subjectId ? { subjectId } : undefined })).data,
  create: async (input: SubjectSyllabusInput) => (await api.post<SubjectSyllabus>("/syllabi", input)).data,
  update: async (id: number, input: SubjectSyllabusInput) => (await api.put<SubjectSyllabus>(`/syllabi/${id}`, input)).data,
  delete: async (id: number) => { await api.delete(`/syllabi/${id}`); },
  /** "Fan dasturi va kurs": dastur, mavzular va (ixtiyoriy) shu dastur asosidagi kurs birga yaratiladi */
  createWithCourse: async (input: SyllabusWithCourseInput) =>
    (await api.post<{ success: boolean; data: { syllabus: SubjectSyllabus; course?: { id: number | string; title: string } | null } }>("/syllabus-courses", input)).data.data,
  linkedCourses: async (syllabusId: number) =>
    (await api.get<{ success: boolean; data: SyllabusLinkedCourse[] }>(`/syllabus-courses/${syllabusId}/courses`)).data.data,
  /** Mavzularni saqlaydi va bog'langan qoralama kurslar bo'limlarini moslaydi */
  updateTopicsWithCourses: async (syllabusId: number, topics: SyllabusTopicInput[]) =>
    (await api.put<{ success: boolean; data: { syllabus: SubjectSyllabus; courses: SyllabusLinkedCourse[] } }>(`/syllabus-courses/${syllabusId}/topics`, topics)).data.data,
  /** Mavzular dastur yaratilgandan keyin alohida saqlanadi (ro'yxat to'liq almashtiriladi, faqat qoralamada). */
  updateTopics: async (id: number, topics: SyllabusTopicInput[]) => (await api.put<SubjectSyllabus>(`/syllabi/${id}/topics`, topics)).data,
};
