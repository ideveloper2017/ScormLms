import api from '@/lib/api';

export interface InstructorStats {
  totalStudents: number;
  activeCourses: number;
  completedCourses: number;
  pendingAssignments: number;
  newSubmissions: number;
  avgRating: number;
  todayLessons: number;
  unreadMessages: number;
}

export interface InstructorCourse {
  id: string;
  title: string;
  description?: string;
  students: number;
  progress: number;
  status: 'active' | 'draft' | 'completed';
  startDate: string;
  endDate: string;
  avgGrade: number;
  completionRate: number;
}

export interface RecentSubmission {
  id: string;
  studentName: string;
  assignmentTitle: string;
  courseTitle: string;
  submittedAt: string;
  status: 'pending' | 'graded' | 'late';
}

export interface TodayLesson {
  id: string;
  time: string;
  subject: string;
  room: string;
  group: string;
  students: number;
  type: string;
}

export interface WeeklyActivity {
  day: string;
  submissions: number;
  tests: number;
}

export const instructorApi = {
  getStats: async (): Promise<InstructorStats> => {
    const res = await api.get<InstructorStats>('/instructors/me/stats');
    return res.data;
  },
  getCourses: async (): Promise<InstructorCourse[]> => {
    const res = await api.get<InstructorCourse[]>('/instructors/me/courses');
    return res.data;
  },
  getRecentSubmissions: async (): Promise<RecentSubmission[]> => {
    const res = await api.get<RecentSubmission[]>('/instructors/me/submissions/recent');
    return res.data;
  },
  getTodayLessons: async (): Promise<TodayLesson[]> => {
    const res = await api.get<TodayLesson[]>('/instructors/me/schedule/today');
    return res.data;
  },
  getWeeklyActivity: async (): Promise<WeeklyActivity[]> => {
    const res = await api.get<WeeklyActivity[]>('/instructors/me/activity/weekly');
    return res.data;
  },
};
