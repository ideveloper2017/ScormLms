import api, { type ApiResponse } from '@/lib/api';
import type { CourseContentAsset } from './teacher-portal-api';
import type { CurriculumVersion } from './curriculum-api';
import type { SubjectSyllabus } from './syllabus-api';

/** Dastur darsi materiali (kurssiz o'qish) */
export interface StudentLessonMaterial {
  id: number; topicId: number; position?: number | null; title: string; description?: string | null;
  contentType: 'video' | 'document' | 'link' | 'file' | 'text'; contentUrl?: string | null; contentBody?: string | null;
  asset?: CourseContentAsset | null; authorName: string; languageCode: string; sourceName: string; contentVersion: string;
  durationSeconds?: number | null;
}
export interface StudentLessonQuiz {
  id: number; topicId: number; kind: 'TEST' | 'QUESTION'; title: string; questionCount: number;
  durationMinutes: number; allowedAttempts: number; passingPercentage: number;
}
export interface StudentSyllabusLessons {
  syllabusId: number; materials: StudentLessonMaterial[]; quizzes: StudentLessonQuiz[]; completedMaterialIds: number[];
}

/** reason — reja topilmasa sababi; syllabi — faqat tasdiqlangan dasturlar */
export interface StudentCurriculum {
  curriculum: CurriculumVersion | null;
  currentSemester?: number | null;
  syllabi: SubjectSyllabus[];
  reason?: string | null;
}

export interface StudyPlanCourse {
  enrollmentId: number;
  courseId: number;
  title: string;
  subjectName: string;
  instructor: string;
  academicYear: string;
  semester: number;
  credits: number;
  required: boolean;
  status: 'active' | 'completed';
  progress: number;
  completedContents: number;
  totalContents: number;
  completedScormPackages: number;
  totalScormPackages: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface StudyPlan {
  studentId: number;
  studentNumber: string;
  studentName: string;
  academicYear: string;
  totalCredits: number;
  completedCredits: number;
  overallProgress: number;
  courses: StudyPlanCourse[];
}

export interface CourseProgress {
  courseId: number;
  completedContentIds?: number[];
  progress: number;
  completedContents: number;
  totalContents: number;
  completedScormPackages: number;
  totalScormPackages: number;
  status: 'active' | 'completed';
  updatedAt?: string | null;
}

export interface LearningContent {
  id: number;
  courseId: number;
  moduleId: number;
  moduleTitle: string;
  title: string;
  description?: string | null;
  contentType: 'video' | 'document' | 'link' | 'file' | 'text';
  contentUrl?: string | null;
  contentBody?: string | null;
  asset?: CourseContentAsset | null;
  durationMinutes?: number | null;
  position: number;
  languageCode: string;
  authorName: string;
  contentVersion: string;
  sourceName: string;
  sourceUrl?: string | null;
  validFrom: string;
  validUntil?: string | null;
  effective: boolean;
  metadataUpdatedAt: string;
  reviewStatus: 'approved';
  approvedRevisionNumber: number;
  /** Material darsi qaysi kurs modulida */
  unitId?: number | null;
  unitTitle?: string | null;
  /** Dars qaysi o'quv dasturi darsiga bog'langan va mashg'ulot turi (fan sahifasi lentasi) */
  syllabusTopicId?: number | null;
  topicType?: string | null;
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message || fallback);
  }
  return response.data.data;
}

export const studyPlanApi = {
  /** Fanni kurssiz o'qish: tasdiqlangan dastur darslari materiallari, testlari va bajarilganlari */
  getSyllabusLessons: async (syllabusId: number): Promise<StudentSyllabusLessons> => dataOf(
    await api.get<ApiResponse<StudentSyllabusLessons>>(`/students/me/syllabi/${syllabusId}/lessons`),
    "Dars materiallari yuklanmadi",
  ),
  completeSyllabusMaterial: async (syllabusId: number, materialId: number): Promise<number[]> => dataOf(
    await api.post<ApiResponse<number[]>>(`/students/me/syllabi/${syllabusId}/materials/${materialId}/complete`),
    "Progress saqlanmadi",
  ),
  /** Tasdiqlangan dastur muqova rasmi yoki tanishtiruv videosi */
  syllabusMedia: async (syllabusId: number, kind: 'cover' | 'video'): Promise<Blob> =>
    (await api.get(`/students/me/syllabi/${syllabusId}/media/${kind}`, { responseType: 'blob', timeout: 300_000 })).data as Blob,
  syllabusMaterialFile: async (syllabusId: number, materialId: number): Promise<Blob> =>
    (await api.get(`/students/me/syllabi/${syllabusId}/materials/${materialId}/file`, { responseType: 'blob', timeout: 180_000 })).data as Blob,
  syllabusMaterialPresentation: async (syllabusId: number, materialId: number): Promise<Blob> =>
    (await api.get(`/students/me/syllabi/${syllabusId}/materials/${materialId}/presentation`, { responseType: 'blob', timeout: 180_000 })).data as Blob,
  syllabusMaterialLegacyWord: async (syllabusId: number, materialId: number): Promise<string> => dataOf(
    await api.get<ApiResponse<string>>(`/students/me/syllabi/${syllabusId}/materials/${materialId}/legacy-word`),
    "Word hujjati ochilmadi",
  ),
  /** Talabaning o'quv rejasi va fanlarning tasdiqlangan o'quv dasturlari */
  getMyCurriculum: async (): Promise<StudentCurriculum> => dataOf(
    await api.get<ApiResponse<StudentCurriculum>>('/students/me/curriculum'),
    "O'quv reja yuklanmadi",
  ),
  getMyPlan: async (academicYear?: string): Promise<StudyPlan> => dataOf(
    await api.get<ApiResponse<StudyPlan>>('/students/me/study-plan', {
      params: academicYear ? { academicYear } : undefined,
    }),
    "O'quv reja yuklanmadi",
  ),
  getCourseProgress: async (courseId: number): Promise<CourseProgress> => dataOf(
    await api.get<ApiResponse<CourseProgress>>(`/students/me/courses/${courseId}/progress`),
    'Kurs progressi yuklanmadi',
  ),
  getCourseContents: async (courseId: number): Promise<LearningContent[]> => dataOf(
    await api.get<ApiResponse<LearningContent[]>>(`/courses/${courseId}/contents`),
    'Kurs kontenti yuklanmadi',
  ),
  recordContentProgress: async (courseId: number, contentId: number, progress = 100): Promise<CourseProgress> => dataOf(
    await api.post<ApiResponse<CourseProgress>>(
      `/students/me/courses/${courseId}/contents/${contentId}/progress`,
      { progress },
    ),
    'Kontent progressi saqlanmadi',
  ),
};
