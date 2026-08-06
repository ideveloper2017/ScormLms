import api, { type ApiResponse } from '@/lib/api';

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
  contentType: 'video' | 'document' | 'link' | 'file';
  contentUrl?: string | null;
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
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message || fallback);
  }
  return response.data.data;
}

export const studyPlanApi = {
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
