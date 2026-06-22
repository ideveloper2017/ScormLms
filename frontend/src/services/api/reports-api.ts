import api from '@/lib/api';

export interface ReportSummary {
  id: string;
  title: string;
  type: 'academic' | 'attendance' | 'performance' | 'financial';
  generatedAt: string;
  period: string;
  status: 'ready' | 'generating' | 'failed';
  downloadUrl?: string;
}

export interface AcademicStats {
  gpa: number;
  totalCredits: number;
  completedCredits: number;
  coursesCompleted: number;
  coursesActive: number;
  avgScore: number;
}

export interface MonthlyData {
  month: string;
  avgScore: number;
  attendance: number;
  completedCourses: number;
}

export interface CourseCompletion {
  courseTitle: string;
  completion: number;
  avgScore: number;
  students: number;
}

export const reportsApi = {
  getReports: async (): Promise<ReportSummary[]> => {
    const res = await api.get<ReportSummary[]>('/students/me/reports');
    return res.data;
  },
  getAcademicStats: async (): Promise<AcademicStats> => {
    const res = await api.get<AcademicStats>('/students/me/reports/academic');
    return res.data;
  },
  getMonthlyData: async (): Promise<MonthlyData[]> => {
    const res = await api.get<MonthlyData[]>('/students/me/reports/monthly');
    return res.data;
  },
  getCourseCompletion: async (): Promise<CourseCompletion[]> => {
    const res = await api.get<CourseCompletion[]>('/students/me/reports/courses');
    return res.data;
  },
};
