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
  dayOfWeek: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
  type: z.enum(['lecture', 'lab', 'seminar', 'tutorial']),
  color: z.string().optional(),
  isOnline: z.boolean(),
  meetingLink: z.string().url('Invalid meeting link').optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  format: z.enum(['synchronous', 'asynchronous']).optional(),
  status: z.enum(['published', 'completed']).optional(),
  recordingUrl: z.string().url().optional(),
  resourceUrl: z.string().url().optional(),
  hasRecording: z.boolean().optional(),
  hasResource: z.boolean().optional(),
  canJoin: z.boolean().optional(),
  canOpenResources: z.boolean().optional(),
  accessed: z.boolean().optional(),
});

export const WeeklyScheduleSchema = z.object({
  weekNumber: z.number().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  items: z.array(ScheduleItemSchema),
});

// Array schemas for filtering validation
export const ScheduleArraySchema = z.array(ScheduleItemSchema);
