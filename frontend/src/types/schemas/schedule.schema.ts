import { z } from 'zod';

/**
 * Zod schema for Schedule data validation
 * Validates API responses to ensure type safety at runtime
 */
export const ScheduleItemSchema = z.object({
  id: z.string().min(1, 'Schedule ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  instructor: z.string().min(1, 'Instructor name is required'),
  room: z.string().min(1, 'Room is required'),
  building: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6, 'Day of week must be 0-6'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
  type: z.enum(['lecture', 'lab', 'seminar', 'tutorial']),
  color: z.string().optional(),
  isOnline: z.boolean(),
  meetingLink: z.string().url('Invalid meeting link').optional(),
});

export const WeeklyScheduleSchema = z.object({
  weekNumber: z.number().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  items: z.array(ScheduleItemSchema),
});

// Array schemas for filtering validation
export const ScheduleArraySchema = z.array(ScheduleItemSchema);
