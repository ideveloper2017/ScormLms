import { z } from 'zod';

/**
 * Zod schema for Grade data validation
 * Validates API responses to ensure type safety at runtime
 */
export const GradeSchema = z.object({
  id: z.string().min(1, 'Grade ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  courseName: z.string().min(1, 'Course name is required'),
  assignmentId: z.string().optional(),
  assignmentName: z.string().optional(),
  testId: z.string().optional(),
  testName: z.string().optional(),
  gradeLetter: z.string().min(1, 'Grade letter is required'),
  gradePoints: z.number().min(0).max(4, 'Grade points must be 0-4'),
  scorePercentage: z.number().min(0).max(100, 'Score percentage must be 0-100'),
  maxScore: z.number().min(0),
  earnedScore: z.number().min(0),
  date: z.coerce.date(),
  feedback: z.string().optional(),
});

export const GradeDistributionSchema = z.object({
  A: z.number().min(0),
  B: z.number().min(0),
  C: z.number().min(0),
  D: z.number().min(0),
  F: z.number().min(0),
});

export const GPADataSchema = z.object({
  currentGPA: z.number().min(0).max(4, 'GPA must be 0-4'),
  cumulativeGPA: z.number().min(0).max(4, 'Cumulative GPA must be 0-4'),
  totalCredits: z.number().min(0),
  gradePoints: z.number().min(0),
});

// Array schemas for filtering validation
export const GradesArraySchema = z.array(GradeSchema);
