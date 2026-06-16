import { z } from 'zod';

/**
 * Zod schema for Test data validation
 * Validates API responses to ensure type safety at runtime
 */
export const TestSchema = z.object({
  id: z.string().min(1, 'Test ID is required'),
  title: z.string().min(1, 'Test title is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  date: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
  duration: z.number().min(0, 'Duration must be non-negative'),
  questionCount: z.number().min(0),
  totalPoints: z.number().min(0),
  proctoring: z.boolean(),
  status: z.enum(['upcoming', 'in-progress', 'completed', 'missed']),
  score: z.number().min(0).optional(),
});

export const TestQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay']),
  text: z.string().min(1, 'Question text is required'),
  points: z.number().min(0),
  options: z.array(z.string()).optional(),
});

export const TestDetailsSchema = TestSchema.extend({
  instructions: z.string(),
  allowedAttempts: z.number().min(1),
  attemptsUsed: z.number().min(0),
  passingScore: z.number().min(0).max(100),
  questions: z.array(TestQuestionSchema).optional(),
});

export const TestSessionSchema = z.object({
  id: z.string().min(1),
  testId: z.string().min(1),
  startedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  questions: z.array(TestQuestionSchema),
});

export const TestResultSchema = z.object({
  id: z.string().min(1),
  testId: z.string().min(1),
  score: z.number().min(0),
  totalPoints: z.number().min(0),
  percentage: z.number().min(0).max(100),
  passed: z.boolean(),
  submittedAt: z.coerce.date(),
  feedback: z.string().optional(),
});

export const TestHistoryItemSchema = z.object({
  id: z.string().min(1),
  testId: z.string().min(1),
  testTitle: z.string().min(1),
  courseName: z.string().min(1),
  date: z.coerce.date(),
  score: z.number().min(0),
  totalPoints: z.number().min(0),
  percentage: z.number().min(0).max(100),
  passed: z.boolean(),
});

// Array schemas for filtering validation
export const TestsArraySchema = z.array(TestSchema);
export const TestHistoryArraySchema = z.array(TestHistoryItemSchema);
