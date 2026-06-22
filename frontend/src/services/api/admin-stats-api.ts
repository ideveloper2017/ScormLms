import api from '@/lib/api';

export interface AdminSystemStats {
  totalUsers: number;
  activeUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeCourses: number;
  totalExams: number;
  activeExams: number;
  scormPackages: number;
  systemUptime: number;
  serverLoad: number;
  contentCompletion: number;
  avgAchievement: number;
  passRate: number;
}

export interface AdminActivity {
  id: number | string;
  username: string;
  action: string;
  details?: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

export interface AdminMonthlyMetric {
  name: string;
  users: number;
  courses: number;
  exams: number;
}

export interface AdminTopInstructor {
  id: string;
  fullName: string;
  departmentName?: string;
  totalStudents?: number;
  totalCourses?: number;
  rating?: number;
}

export const adminStatsApi = {
  getSystemStats: async (): Promise<AdminSystemStats> => {
    const res = await api.get<AdminSystemStats>('/admin/stats');
    return res.data;
  },
  getRecentActivities: async (): Promise<AdminActivity[]> => {
    const res = await api.get<AdminActivity[]>('/admin/activities/recent');
    return res.data;
  },
  getMonthlyMetrics: async (): Promise<AdminMonthlyMetric[]> => {
    const res = await api.get<AdminMonthlyMetric[]>('/admin/stats/monthly');
    return res.data;
  },
  getTopInstructors: async (): Promise<AdminTopInstructor[]> => {
    const res = await api.get<AdminTopInstructor[]>('/admin/instructors/top');
    return res.data;
  },
};
