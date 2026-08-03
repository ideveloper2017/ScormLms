import api, { type ApiResponse } from '@/lib/api';

export interface TeacherProfile {
  id: string;
  fullName: string;
  username: string;
  email?: string;
  phone?: string;
  position?: string;
  academicDegree?: string;
  academicRank?: string;
  departmentName?: string;
  photoUrl?: string;
}

export interface TeacherDashboardStats {
  activeCourses: number;
  totalStudents: number;
  pendingSubmissions: number;
  todayLessons: number;
  avgTestScore: number;
  newSubmissions: number;
  unreadMessages: number;
}

export interface TeacherCourse {
  id: string;
  title: string;
  description?: string;
  subjectName?: string | null;
  groupName?: string | null;
  students: number;
  progress: number;
  status: 'published' | 'draft' | 'archived';
  startDate?: string;
  endDate?: string;
  avgScore?: number;
}

export interface CourseCreatePayload {
  title: string;
  description?: string;
  subjectName?: string;
  groupName?: string;
  startDate?: string;
  endDate?: string;
  language?: string;
  level?: string;
}

export interface CourseEnrollment {
  id: number;
  courseId: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  status: 'active' | 'completed' | 'withdrawn';
  progress: number;
  academicYear: string;
  semester: number;
  credits: number;
  required: boolean;
  enrolledAt: string;
  completedAt?: string | null;
}

export interface EnrollmentPlanOptions {
  academicYear?: string;
  semester: number;
  credits: number;
  required: boolean;
}

export interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  description?: string | null;
  position: number;
  status: 'draft' | 'published';
  contentCount: number;
  publishedAt?: string | null;
}

export interface CourseContent {
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
  status: 'draft' | 'published';
  publishedAt?: string | null;
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data === undefined) {
    throw new Error(response.data.message ?? fallback);
  }
  return response.data.data;
}

export interface TeacherStudent {
  id: string;
  fullName: string;
  studentNumber?: string;
  groupName?: string;
  attendance: number;
  avgScore: number;
  status: 'active' | 'at-risk' | 'excellent';
}

export interface TeacherAssignment {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  dueDate: string;
  totalSubmissions: number;
  pendingGrade: number;
  status: 'active' | 'closed' | 'draft';
  description: string;
  maxScore: number;
  priority: 'low' | 'medium' | 'high';
  submissionType: 'file' | 'text' | 'both';
}

export interface TeacherAssignmentPayload {
  courseId: number;
  title: string;
  description: string;
  instructions: string;
  dueDate: string;
  maxScore: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  submissionType: 'FILE' | 'TEXT' | 'BOTH';
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
}

export interface TeacherSubmission {
  id: string;
  studentName: string;
  assignmentTitle: string;
  courseTitle: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'late';
  score?: number;
  maxScore: number;
  feedback?: string;
  answer?: string;
  fileName?: string;
  fileUrl?: string;
  attemptNumber: number;
}

export interface TeacherTest {
  id: string;
  title: string;
  courseTitle: string;
  courseId: string;
  date: string;
  duration: number;
  questions: number;
  status: 'upcoming' | 'active' | 'completed' | 'draft';
  avgScore?: number;
  participants?: number;
}

export interface TeacherAttendance {
  id: number;
  courseId: number;
  date: string;
  courseTitle: string;
  group: string;
  sessionTitle: string;
  opensAt: string;
  closesAt: string;
  lateAfter?: string | null;
  minimumActivitySeconds: number;
  status: 'scheduled' | 'open' | 'closed';
  present: number;
  late: number;
  absent: number;
  pending: number;
  total: number;
}

export interface AttendanceSessionPayload {
  courseId: number;
  title: string;
  opensAt: string;
  closesAt: string;
  lateAfter?: string;
  minimumActivitySeconds: number;
}

export interface GradebookEntry {
  studentId: string;
  studentName: string;
  assignments: number;
  tests: number;
  attendance: number;
  finalGrade: number;
  letterGrade: string;
}

export interface TodaySchedule {
  id: string;
  startTime: string;
  endTime: string;
  subject: string;
  group: string;
  room: string;
  type: string;
  students: number;
}

export const teacherPortalApi = {
  getProfile: async (): Promise<TeacherProfile> => {
    const res = await api.get<TeacherProfile>('/teachers/me');
    return res.data;
  },
  getDashboardStats: async (): Promise<TeacherDashboardStats> => {
    const res = await api.get<TeacherDashboardStats>('/teachers/me/stats');
    return res.data;
  },
  getCourses: async (): Promise<TeacherCourse[]> => {
    const items = dataOf(await api.get<ApiResponse<Array<Omit<TeacherCourse, 'id'> & { id: number }>>>('/courses/owned'), 'Kurslar yuklanmadi');
    return items.map(item => ({ ...item, id: String(item.id) }));
  },
  getCourse: async (courseId: string): Promise<TeacherCourse> => {
    const item = dataOf(await api.get<ApiResponse<Omit<TeacherCourse, 'id'> & { id: number }>>(`/courses/${courseId}`), 'Kurs topilmadi');
    return { ...item, id: String(item.id) };
  },
  createCourse: async (payload: CourseCreatePayload): Promise<TeacherCourse> => {
    const item = dataOf(await api.post<ApiResponse<Omit<TeacherCourse, 'id'> & { id: number }>>('/courses', payload), 'Kurs yaratilmadi');
    return { ...item, id: String(item.id) };
  },
  updateCourse: async (courseId: string, payload: Partial<CourseCreatePayload>): Promise<TeacherCourse> => {
    const item = dataOf(await api.put<ApiResponse<Omit<TeacherCourse, 'id'> & { id: number }>>(`/courses/${courseId}`, payload), 'Kurs yangilanmadi');
    return { ...item, id: String(item.id) };
  },
  updateCourseStatus: async (courseId: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'): Promise<TeacherCourse> => {
    const item = dataOf(await api.patch<ApiResponse<Omit<TeacherCourse, 'id'> & { id: number }>>(`/courses/${courseId}/status`, { status }), 'Kurs holati o\'zgarmadi');
    return { ...item, id: String(item.id) };
  },
  deleteCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}`);
  },
  getEnrollments: async (courseId: string): Promise<CourseEnrollment[]> => {
    return dataOf(await api.get<ApiResponse<CourseEnrollment[]>>(`/courses/${courseId}/enrollments`), 'Kontingent yuklanmadi');
  },
  enrollStudents: async (courseId: string, studentIds: number[], plan: EnrollmentPlanOptions): Promise<CourseEnrollment[]> => {
    return dataOf(await api.post<ApiResponse<CourseEnrollment[]>>(`/courses/${courseId}/enrollments`, { studentIds, ...plan }), 'Talabalar biriktirilmadi');
  },
  withdrawStudent: async (courseId: string, studentId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/enrollments/${studentId}`);
  },
  getModules: async (courseId: string): Promise<CourseModule[]> => {
    return dataOf(await api.get<ApiResponse<CourseModule[]>>(`/courses/${courseId}/modules`), 'Modullar yuklanmadi');
  },
  createModule: async (courseId: string, payload: { title: string; description?: string }): Promise<CourseModule> => {
    return dataOf(await api.post<ApiResponse<CourseModule>>(`/courses/${courseId}/modules`, payload), 'Modul yaratilmadi');
  },
  updateModule: async (courseId: string, moduleId: number, payload: { title: string; description?: string }): Promise<CourseModule> => {
    return dataOf(await api.put<ApiResponse<CourseModule>>(`/courses/${courseId}/modules/${moduleId}`, payload), 'Modul yangilanmadi');
  },
  updateModuleStatus: async (courseId: string, moduleId: number, status: 'DRAFT' | 'PUBLISHED'): Promise<CourseModule> => {
    return dataOf(await api.patch<ApiResponse<CourseModule>>(`/courses/${courseId}/modules/${moduleId}/status`, { status }), 'Modul holati o\'zgarmadi');
  },
  deleteModule: async (courseId: string, moduleId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/modules/${moduleId}`);
  },
  getContents: async (courseId: string): Promise<CourseContent[]> => {
    return dataOf(await api.get<ApiResponse<CourseContent[]>>(`/courses/${courseId}/contents`), 'Kontentlar yuklanmadi');
  },
  createContent: async (courseId: string, moduleId: number, payload: {
    title: string;
    contentType: 'VIDEO' | 'DOCUMENT' | 'LINK' | 'FILE';
    contentUrl?: string;
    durationMinutes?: number;
  }): Promise<CourseContent> => {
    return dataOf(await api.post<ApiResponse<CourseContent>>(`/courses/${courseId}/modules/${moduleId}/contents`, payload), 'Kontent yaratilmadi');
  },
  updateContent: async (courseId: string, contentId: number, payload: {
    title: string;
    contentType: 'VIDEO' | 'DOCUMENT' | 'LINK' | 'FILE';
    contentUrl?: string;
    durationMinutes?: number;
  }): Promise<CourseContent> => {
    return dataOf(await api.put<ApiResponse<CourseContent>>(`/courses/${courseId}/contents/${contentId}`, payload), 'Kontent yangilanmadi');
  },
  updateContentStatus: async (courseId: string, contentId: number, status: 'DRAFT' | 'PUBLISHED'): Promise<CourseContent> => {
    return dataOf(await api.patch<ApiResponse<CourseContent>>(`/courses/${courseId}/contents/${contentId}/status`, { status }), 'Kontent holati o\'zgarmadi');
  },
  deleteContent: async (courseId: string, contentId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/contents/${contentId}`);
  },
  getStudents: async (courseId?: string): Promise<TeacherStudent[]> => {
    const res = await api.get<TeacherStudent[]>('/teachers/me/students', {
      params: courseId ? { courseId } : undefined,
    });
    return res.data;
  },
  getAssignments: async (): Promise<TeacherAssignment[]> => {
    const res = await api.get<TeacherAssignment[]>('/teachers/me/assignments');
    return res.data;
  },
  createAssignment: async (payload: TeacherAssignmentPayload): Promise<TeacherAssignment> => {
    const res = await api.post<TeacherAssignment>('/teachers/me/assignments', payload);
    return res.data;
  },
  updateAssignmentStatus: async (assignmentId: string, status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'): Promise<TeacherAssignment> => {
    const res = await api.patch<TeacherAssignment>(`/teachers/me/assignments/${assignmentId}/status`, { status });
    return res.data;
  },
  deleteAssignment: async (assignmentId: string): Promise<void> => {
    await api.delete(`/teachers/me/assignments/${assignmentId}`);
  },
  getSubmissions: async (assignmentId?: string): Promise<TeacherSubmission[]> => {
    const res = await api.get<TeacherSubmission[]>('/teachers/me/submissions', {
      params: assignmentId ? { assignmentId } : undefined,
    });
    return res.data;
  },
  gradeSubmission: async (submissionId: string, score: number, feedback?: string): Promise<TeacherSubmission> => {
    const res = await api.post<TeacherSubmission>(`/teachers/me/submissions/${submissionId}/grade`, { score, feedback });
    return res.data;
  },
  downloadSubmissionFile: async (submissionId: string, fileName: string): Promise<void> => {
    const res = await api.get<Blob>(`/submissions/${submissionId}/file`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  },
  getTests: async (): Promise<TeacherTest[]> => {
    const res = await api.get<TeacherTest[]>('/teachers/me/tests');
    return res.data;
  },
  getAttendance: async (): Promise<TeacherAttendance[]> => {
    const res = await api.get<TeacherAttendance[]>('/teachers/me/attendance');
    return res.data;
  },
  createAttendanceSession: async (payload: AttendanceSessionPayload): Promise<TeacherAttendance> => {
    const res = await api.post<TeacherAttendance>('/teachers/me/attendance/sessions', payload);
    return res.data;
  },
  deleteAttendanceSession: async (sessionId: number): Promise<void> => {
    await api.delete(`/teachers/me/attendance/sessions/${sessionId}`);
  },
  getGradebook: async (courseId: string): Promise<GradebookEntry[]> => {
    const res = await api.get<GradebookEntry[]>(`/teachers/me/courses/${courseId}/gradebook`);
    return res.data;
  },
  getTodaySchedule: async (): Promise<TodaySchedule[]> => {
    const res = await api.get<TodaySchedule[]>('/teachers/me/schedule/today');
    return res.data;
  },
};
