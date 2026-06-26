// Dashboard data type definitions

export interface StudentProfile {
  id: string;
  studentId: string;
  name: string;
  email: string;
  photo?: string;
  gpa: number;
  totalCredits: number;
  learningStreak: number;
  roles: string[];
}

export interface DashboardStats {
  activeCourses: number;
  completedCourses?: number;
  pendingAssignments: number;
  upcomingTests: number;
  averageGrade: number;
  attendancePercentage: number;
  gpa: number;
  totalCredits: number;
  learningStreak: number;
}

export interface ActivityItem {
  id: string;
  type: 'course' | 'assignment' | 'test' | 'grade';
  title: string;
  description: string;
  timestamp: Date;
}

export interface DashboardData {
  profile: StudentProfile;
  stats: DashboardStats;
  recentActivity: ActivityItem[];
}
