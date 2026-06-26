import api from '@/lib/api';

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
  groupName: string;
  students: number;
  progress: number;
  status: 'active' | 'draft' | 'completed';
  startDate?: string;
  endDate?: string;
  avgScore?: number;
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
}

export interface TeacherSubmission {
  id: string;
  studentName: string;
  assignmentTitle: string;
  courseTitle: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'late';
  score?: number;
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
  date: string;
  courseTitle: string;
  group: string;
  present: number;
  absent: number;
  total: number;
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
    const res = await api.get<TeacherCourse[]>('/teachers/me/courses');
    return res.data;
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
  getSubmissions: async (): Promise<TeacherSubmission[]> => {
    const res = await api.get<TeacherSubmission[]>('/teachers/me/submissions');
    return res.data;
  },
  getTests: async (): Promise<TeacherTest[]> => {
    const res = await api.get<TeacherTest[]>('/teachers/me/tests');
    return res.data;
  },
  getAttendance: async (): Promise<TeacherAttendance[]> => {
    const res = await api.get<TeacherAttendance[]>('/teachers/me/attendance');
    return res.data;
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
