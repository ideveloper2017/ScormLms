import api from '@/lib/api';

export interface Exam {
  id: string;
  title: string;
  course: string;
  courseId: string;
  date: string;
  duration: number;
  totalQuestions: number;
  maxScore: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  participants?: number;
  avgScore?: number;
  passRate?: number;
  type: 'test' | 'written' | 'oral' | 'practical';
  time?: string;
  location?: string;
  attendanceStatus?: string;
  resultPublished?: boolean;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  course: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  duration: number;
  rank?: number;
  grade?: string;
  attendanceStatus?: string;
}

export interface StudentExamAppeal {
  id: string; examResultId: string; studentName: string; appealDate: string; reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PARTIAL'; decision?: string; newScore?: number;
}

export interface ExamStats {
  total: number;
  upcoming: number;
  completed: number;
  avgScore: number;
  passRate: number;
}

export const examApi = {
  getExams: async (): Promise<Exam[]> => {
    const res = await api.get<Exam[]>('/students/me/exams');
    return res.data;
  },
  getResults: async (): Promise<ExamResult[]> => {
    const res = await api.get<ExamResult[]>('/students/me/exams/results');
    return res.data;
  },
  getStats: async (): Promise<ExamStats> => {
    const res = await api.get<ExamStats>('/students/me/exams/stats');
    return res.data;
  },
  getAppeals: async (): Promise<StudentExamAppeal[]> => (await api.get<StudentExamAppeal[]>('/students/me/exam-appeals')).data,
  createAppeal: async (examResultId: string, reason: string): Promise<StudentExamAppeal> =>
    (await api.post<StudentExamAppeal>('/students/me/exam-appeals', { examResultId: Number(examResultId), reason })).data,
};
