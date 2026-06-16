import { z } from 'zod';

/**
 * Zod schema for Dashboard data validation
 * Validates API responses to ensure type safety at runtime
 */
export const StudentProfileSchema = z.object({
  id: z.string().min(1, 'Student ID is required'),
  studentId: z.string().min(1, 'Student ID number is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  photo: z.string().url('Invalid photo URL').optional(),
  gpa: z.number().min(0).max(4, 'GPA must be 0-4'),
  totalCredits: z.number().min(0),
  learningStreak: z.number().min(0),
  roles: z.array(z.string()),
});

export const DashboardStatsSchema = z.object({
  activeCourses: z.number().min(0),
  pendingAssignments: z.number().min(0),
  upcomingTests: z.number().min(0),
  averageGrade: z.number().min(0).max(100),
  attendancePercentage: z.number().min(0).max(100),
});

export const ActivityItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['course', 'assignment', 'test', 'grade']),
  title: z.string().min(1),
  description: z.string(),
  timestamp: z.coerce.date(),
});

export const DashboardDataSchema = z.object({
  profile: StudentProfileSchema,
  stats: DashboardStatsSchema,
  recentActivity: z.array(ActivityItemSchema),
});

// Array schemas for filtering validation
export const ActivityArraySchema = z.array(ActivityItemSchema);
