import { z } from 'zod';
import { apiOptional } from './api-optional';

/**
 * Zod schema for Assignment data validation
 * Validates API responses to ensure type safety at runtime
 */
export const AssignmentSchema = z.object({
  id: z.string().min(1, "Topshiriq ID si ko'rsatilishi shart"),
  title: z.string().min(1, "Topshiriq sarlavhasi ko'rsatilishi shart"),
  description: z.string(),
  courseId: z.string().min(1, "Kurs ID si ko'rsatilishi shart"),
  courseName: z.string().min(1, "Kurs nomi ko'rsatilishi shart"),
  dueDate: z.coerce.date(),
  status: z.enum(['pending', 'submitted', 'graded', 'overdue']),
  priority: z.enum(['low', 'medium', 'high']),
  maxScore: z.number().min(0, "Maksimal ball manfiy bo'lishi mumkin emas"),
  submittedAt: apiOptional(z.coerce.date()),
  grade: apiOptional(z.number().min(0)),
  feedback: apiOptional(z.string()),
});

export const AttachmentFileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Fayl nomi ko'rsatilishi shart"),
  url: z.string().url("Noto'g'ri fayl URL manzili"),
  size: z.number().min(0, "Fayl hajmi manfiy bo'lishi mumkin emas"),
  uploadedAt: z.coerce.date(),
});

export const RubricItemSchema = z.object({
  criterion: z.string().min(1, "Mezon ko'rsatilishi shart"),
  points: z.number().min(0, "Ballar manfiy bo'lishi mumkin emas"),
  description: z.string(),
});

export const AssignmentDetailsSchema = AssignmentSchema.extend({
  instructions: z.string(),
  attachments: z.array(AttachmentFileSchema),
  submissionType: z.enum(['file', 'text', 'both']),
  rubric: apiOptional(z.array(RubricItemSchema)),
});

export const AssignmentSubmissionSchema = z.object({
  id: z.string().min(1),
  assignmentId: z.string().min(1),
  studentId: z.string().min(1),
  fileUrl: apiOptional(z.string().min(1)),
  fileName: apiOptional(z.string()),
  answer: apiOptional(z.string()),
  submittedAt: z.coerce.date(),
  grade: apiOptional(z.number().min(0)),
  feedback: apiOptional(z.string()),
  status: z.enum(['submitted', 'graded', 'returned']),
  attemptNumber: apiOptional(z.number().int().positive()),
  late: apiOptional(z.boolean()),
});

// Array schemas
export const AssignmentsArraySchema = z.array(AssignmentSchema);
export const AssignmentDetailsArraySchema = z.array(AssignmentDetailsSchema);
