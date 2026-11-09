import api from "@/lib/api";
import type { CourseContentAsset, SubjectMaterial } from "@/services/api/teacher-portal-api";

export type SyllabusLanguage = "UZ" | "EN" | "RU" | "KAA" | "UZ_CYRILLIC";
/** THEORETICAL — nazariy (ma'ruza), PRACTICAL — amaliy, LABORATORY — laboratoriya, SEMINAR — seminar mashg'ulot. */
export type SyllabusTopicType = "THEORETICAL" | "PRACTICAL" | "LABORATORY" | "SEMINAR";
export const syllabusTopicTypes: Record<SyllabusTopicType, string> = {
  THEORETICAL: "Nazariy mashg'ulotlar (ma'ruza)", PRACTICAL: "Amaliy mashg'ulotlar",
  LABORATORY: "Laboratoriya mashg'ulotlari", SEMINAR: "Seminar mashg'ulotlari",
};
/** part — ko'p semestrli fanda qism (1-qism — birinchi semestr); hours — eski ma'lumot, soatlar fan bo'yicha o'quv rejada */
export interface SyllabusTopic { id?: number | null; type: SyllabusTopicType; sortOrder: number; title: string; description?: string | null; hours?: number | null; part?: number | null; moduleId?: number | null; lessonOrder?: number | null; materialCount?: number; quizCount?: number }
/** Dastur moduli (Everest "Dasturlar"): darslari — mavzular, har birida mashg'ulot turi */
export interface SyllabusModule { id: number; sortOrder: number; name: string; description?: string | null; lessons: SyllabusTopic[] }
/** Modulni saqlash: id berilsa joyida yangilanadi; lessons — modul darslari tartibda */
export interface SyllabusModuleInput { id?: number | null; name: string; description?: string | null; lessons: SyllabusTopicInput[] }
/** id — mavjud mavzu (joyida yangilanadi, kurs bo'limlari bilan bog'lanish saqlanadi) */
export interface SyllabusTopicInput { id?: number | null; type: SyllabusTopicType; title: string; description?: string | null; part?: number | null }
export interface SubjectSyllabus {
  /** null — dastur hali o'quv reja faniga biriktirilmagan (fan taxtada 📖 orqali yoziladi) */
  id: number; subjectId: number | null; subjectCode?: string | null; subjectName: string | null;
  name: string; language: SyllabusLanguage; shortDescription: string;
  requirements?: string | null; fullDescription: string; active: boolean;
  /** Natijalar — fanni o'rganib talaba nimalarga erishadi (har biri yangi qatordan) */
  learningOutcomes?: string | null;
  coverImageAvailable?: boolean;
  updatedAt?: string;
  introVideoName?: string | null;
  introVideoUrl?: string | null;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED"; revisionNumber: number;
  topics?: SyllabusTopic[]; theoreticalHours?: number; practicalHours?: number; laboratoryHours?: number; seminarHours?: number;
  modules?: SyllabusModule[];
  /** Fan dasturi (ishchi dastur) qaysi o'quv dasturidan va qaysi davr uchun */
  modelProgramId?: number | null; academicYear?: string | null; semester?: number | null;
}
export interface SyllabusRevision { revisionNumber: number; content: SubjectSyllabus; approvedByName: string; approvedAt: string }
export interface SubjectSyllabusInput {
  /** Ixtiyoriy: fan o'quv reja taxtasida biriktiriladi; fansiz dasturda name majburiy */
  subjectId?: number | null; name?: string; language: SyllabusLanguage;
  shortDescription: string; requirements?: string | null; fullDescription: string; active: boolean;
  learningOutcomes?: string | null;
  introVideoUrl?: string | null;
  topics?: SyllabusTopicInput[];
}
/** Dasturga bog'langan kurs: qoralamasi mavzular bilan avtomatik moslanadi, nashr qilingani — kurs sahifasida */
export interface SyllabusLinkedCourse { id: number; title: string; status: string; autoSync: boolean; added: number; updated: number; removed?: number; materials?: number; quizzes?: number }
/** Dars resursi: TEST — vaqtli test (darsga bitta), QUESTION — Savol/Javob (bitta savol, urinishlar bilan) */
export type LessonQuizKind = "TEST" | "QUESTION";
export type LessonQuestionType = "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
/** correctAnswer: variantli — variant matni; to'g'ri/noto'g'ri — "true"/"false"; qisqa javob — "|" bilan bir nechta */
export interface LessonQuizQuestion { text: string; type: LessonQuestionType; options: string[]; correctAnswer: string; explanation?: string | null; points: number }
export interface LessonQuizInput { kind: LessonQuizKind; title: string; instructions?: string | null; durationMinutes?: number | null; allowedAttempts: number; passingPercentage?: number | null; questions: LessonQuizQuestion[] }
export interface LessonQuiz extends LessonQuizInput { id: number; durationMinutes: number; passingPercentage: number; version: number }
export interface LessonQuizzesResult { quizzes: LessonQuiz[]; courses: SyllabusLinkedCourse[] }
/** Dars kontenti (Everest: dars -> resurslar) — fan bankida saqlanadi, kurs darsiga nusxa bo'ladi */
export type LessonMaterialType = "TEXT" | "VIDEO" | "DOCUMENT" | "FILE" | "LINK";
export interface LessonMaterialInput { title: string; description?: string | null; contentType: LessonMaterialType; contentUrl?: string | null; contentBody?: string | null; assetId?: number | null; durationSeconds?: number | null }
export interface LessonMaterialsResult { materials: SubjectMaterial[]; courses: SyllabusLinkedCourse[] }
type Wrapped<T> = { success: boolean; data: T };
export type SyllabusMediaKind = "cover" | "video";

export const syllabusApi = {
  history: async (id: number) => (await api.get<SyllabusRevision[]>(`/syllabi/${id}/history`)).data,
  workflow: async (id: number, action: "SUBMIT" | "RETURN" | "APPROVE" | "NEW_VERSION") => (await api.post<SubjectSyllabus>(`/syllabi/${id}/workflow`, { action })).data,
  list: async (subjectId?: number, modelProgramId?: number) => (await api.get<SubjectSyllabus[]>("/syllabi", {
    params: subjectId || modelProgramId ? { subjectId, modelProgramId } : undefined,
  })).data,
  create: async (input: SubjectSyllabusInput) => (await api.post<SubjectSyllabus>("/syllabi", input)).data,
  update: async (id: number, input: SubjectSyllabusInput) => (await api.put<SubjectSyllabus>(`/syllabi/${id}`, input)).data,
  /** Muqova rasmi (cover) yoki tanishtiruv videosi (video) */
  uploadMedia: async (id: number, kind: SyllabusMediaKind, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<SubjectSyllabus>(`/syllabi/${id}/media/${kind}`, form, { headers: { "Content-Type": "multipart/form-data" }, timeout: 600_000 })).data;
  },
  removeMedia: async (id: number, kind: SyllabusMediaKind) => (await api.delete<SubjectSyllabus>(`/syllabi/${id}/media/${kind}`)).data,
  mediaFile: async (id: number, kind: SyllabusMediaKind): Promise<Blob> =>
    (await api.get(`/syllabi/${id}/media/${kind}`, { responseType: "blob", timeout: 300_000 })).data as Blob,
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
  /** Dars kontenti: ro'yxat dars ichidagi tartibda; o'zgarishlar bog'langan qoralama kurslarga ham tushadi */
  lessonMaterials: async (syllabusId: number, topicId: number) =>
    (await api.get<Wrapped<SubjectMaterial[]>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/materials`)).data.data,
  uploadLessonAsset: async (syllabusId: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<Wrapped<CourseContentAsset>>(`/syllabus-courses/${syllabusId}/assets`, form, {
      headers: { "Content-Type": "multipart/form-data" }, timeout: 180_000,
    })).data.data;
  },
  createLessonMaterial: async (syllabusId: number, topicId: number, input: LessonMaterialInput) =>
    (await api.post<Wrapped<LessonMaterialsResult>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/materials`, input)).data.data,
  updateLessonMaterial: async (syllabusId: number, topicId: number, materialId: number, input: LessonMaterialInput) =>
    (await api.put<Wrapped<LessonMaterialsResult>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/materials/${materialId}`, input)).data.data,
  reorderLessonMaterials: async (syllabusId: number, topicId: number, materialIds: number[]) =>
    (await api.put<Wrapped<LessonMaterialsResult>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/materials/order`, materialIds)).data.data,
  deleteLessonMaterial: async (syllabusId: number, topicId: number, materialId: number) =>
    (await api.delete<Wrapped<LessonMaterialsResult>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/materials/${materialId}`)).data.data,
  /** Dars testlari: Test va Savol/Javob — kursga test sifatida tushadi */
  lessonQuizzes: async (syllabusId: number, topicId: number) =>
    (await api.get<Wrapped<LessonQuiz[]>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/quizzes`)).data.data,
  createLessonQuiz: async (syllabusId: number, topicId: number, input: LessonQuizInput) =>
    (await api.post<Wrapped<LessonQuizzesResult>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/quizzes`, input)).data.data,
  updateLessonQuiz: async (syllabusId: number, topicId: number, quizId: number, input: LessonQuizInput) =>
    (await api.put<Wrapped<LessonQuizzesResult>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/quizzes/${quizId}`, input)).data.data,
  deleteLessonQuiz: async (syllabusId: number, topicId: number, quizId: number) =>
    (await api.delete<Wrapped<LessonQuizzesResult>>(`/syllabus-courses/${syllabusId}/lessons/${topicId}/quizzes/${quizId}`)).data.data,
};
