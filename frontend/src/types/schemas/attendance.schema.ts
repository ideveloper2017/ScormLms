import { z } from 'zod';

/**
 * Zod schema for Attendance data validation
 * Validates API responses to ensure type safety at runtime
 */
export const AttendanceRecordSchema = z.object({
  id: z.string().min(1, 'Attendance ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  date: z.coerce.date(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  reason: z.string().optional(),
  checkInTime: z.coerce.date().optional(),
  checkOutTime: z.coerce.date().optional(),
});

export const CourseAttendanceSchema = z.object({
  courseId: z.string().min(1),
  courseName: z.string().min(1),
  totalClasses: z.number().min(0),
  attended: z.number().min(0),
  percentage: z.number().min(0).max(100),
});

export const AttendanceStatsSchema = z.object({
  totalClasses: z.number().min(0),
  attended: z.number().min(0),
  absent: z.number().min(0),
  late: z.number().min(0),
  excused: z.number().min(0),
  attendancePercentage: z.number().min(0).max(100),
  byCourse: z.array(CourseAttendanceSchema),
});

// Array schemas for filtering validation
export const AttendanceArraySchema = z.array(AttendanceRecordSchema);
