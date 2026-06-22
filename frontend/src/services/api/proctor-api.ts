import api from '@/lib/api';

export interface ProctorStats {
  activeExams: number;
  totalStudents: number;
  violations: number;
  flaggedStudents: number;
  completedToday: number;
  avgScore: number;
}

export interface ActiveExam {
  id: string;
  title: string;
  course: string;
  startTime: string;
  duration: number;
  totalStudents: number;
  activeStudents: number;
  violations: number;
  status: 'active' | 'paused' | 'completed';
}

export interface ViolationRecord {
  id: string;
  studentName: string;
  examTitle: string;
  type: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export const proctorApi = {
  getStats: async (): Promise<ProctorStats> => {
    const res = await api.get<ProctorStats>('/proctors/me/stats');
    return res.data;
  },
  getActiveExams: async (): Promise<ActiveExam[]> => {
    const res = await api.get<ActiveExam[]>('/proctors/me/active-exams');
    return res.data;
  },
  getViolations: async (): Promise<ViolationRecord[]> => {
    const res = await api.get<ViolationRecord[]>('/proctors/me/violations');
    return res.data;
  },
};
