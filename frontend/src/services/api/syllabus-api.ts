import api from "@/lib/api";

export type SyllabusLanguage = "UZ" | "EN" | "RU" | "KAA" | "UZ_CYRILLIC";
/** THEORETICAL — nazariy (ma'ruza), PRACTICAL — amaliy, LABORATORY — laboratoriya, SEMINAR — seminar mashg'ulot. */
export type SyllabusTopicType = "THEORETICAL" | "PRACTICAL" | "LABORATORY" | "SEMINAR";
export const syllabusTopicTypes: Record<SyllabusTopicType, string> = {
  THEORETICAL: "Nazariy mashg'ulotlar (ma'ruza)", PRACTICAL: "Amaliy mashg'ulotlar",
  LABORATORY: "Laboratoriya mashg'ulotlari", SEMINAR: "Seminar mashg'ulotlari",
};
/** part — ko'p semestrli fanda qism (1-qism — birinchi semestr); hours — eski ma'lumot, soatlar fan bo'yicha o'quv rejada */
export interface SyllabusTopic { id?: number | null; type: SyllabusTopicType; sortOrder: number; title: string; description?: string | null; hours?: number | null; part?: number | null; moduleId?: number | null; lessonOrder?: number | null }
/** Dastur moduli (Everest "Dasturlar"): darslari — mavzular, har birida mashg'ulot turi */
export interface SyllabusModule { id: number; sortOrder: number; name: string; description?: string | null; lessons: SyllabusTopic[] }
/** Modulni saqlash: id berilsa joyida yangilanadi; lessons — modul darslari tartibda */
export interface SyllabusModuleInput { id?: number | null; name: string; description?: string | null; lessons: SyllabusTopicInput[] }
/** id — mavjud mavzu (joyida yangilanadi, kurs bo'limlari bilan bog'lanish saqlanadi) */
export interface SyllabusTopicInput { id?: number | null; type: SyllabusTopicType; title: string; description?: string | null; part?: number | null }
export interface SubjectSyllabus {
  id: number; subjectId: number; subjectCode?: string | null; subjectName: string;
  name: string; language: SyllabusLanguage; shortDescription: string;
  requirements?: string | null; fullDescription: string; active: boolean;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED"; revisionNumber: number;
  topics?: SyllabusTopic[]; theoreticalHours?: number; practicalHours?: number; laboratoryHours?: number; seminarHours?: number;
  modules?: SyllabusModule[];
  /** Fan dasturi (ishchi dastur) qaysi o'quv dasturidan va qaysi davr uchun */
  modelProgramId?: number | null; academicYear?: string | null; semester?: number | null;
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
export const syllabusApi = {
  history: async (id: number) => (await api.get<SyllabusRevision[]>(`/syllabi/${id}/history`)).data,
  workflow: async (id: number, action: "SUBMIT" | "RETURN" | "APPROVE" | "NEW_VERSION") => (await api.post<SubjectSyllabus>(`/syllabi/${id}/workflow`, { action })).data,
  list: async (subjectId?: number, modelProgramId?: number) => (await api.get<SubjectSyllabus[]>("/syllabi", {
    params: subjectId || modelProgramId ? { subjectId, modelProgramId } : undefined,
  })).data,
  create: async (input: SubjectSyllabusInput) => (await api.post<SubjectSyllabus>("/syllabi", input)).data,
  update: async (id: number, input: SubjectSyllabusInput) => (await api.put<SubjectSyllabus>(`/syllabi/${id}`, input)).data,
  delete: async (id: number) => { await api.delete(`/syllabi/${id}`); },
  linkedCourses: async (syllabusId: number) =>
    (await api.get<{ success: boolean; data: SyllabusLinkedCourse[] }>(`/syllabus-courses/${syllabusId}/courses`)).data.data,
  /** Mavzularni saqlaydi va bog'langan qoralama kurslar bo'limlarini moslaydi */
  updateTopicsWithCourses: async (syllabusId: number, topics: SyllabusTopicInput[]) =>
    (await api.put<{ success: boolean; data: { syllabus: SubjectSyllabus; courses: SyllabusLinkedCourse[] } }>(`/syllabus-courses/${syllabusId}/topics`, topics)).data.data,
  /** Modullar va darslarni saqlaydi (to'liq almashtiriladi, faqat qoralamada) va bog'langan qoralama kurslarni moslaydi */
  updateModulesWithCourses: async (syllabusId: number, modules: SyllabusModuleInput[]) =>
    (await api.put<{ success: boolean; data: { syllabus: SubjectSyllabus; courses: SyllabusLinkedCourse[] } }>(`/syllabus-courses/${syllabusId}/modules`, modules)).data.data,
  /** Mavzular dastur yaratilgandan keyin alohida saqlanadi (ro'yxat to'liq almashtiriladi, faqat qoralamada). */
  updateTopics: async (id: number, topics: SyllabusTopicInput[]) => (await api.put<SubjectSyllabus>(`/syllabi/${id}/topics`, topics)).data,
};
