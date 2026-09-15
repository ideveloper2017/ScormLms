import { z } from 'zod';
import { apiOptional } from './api-optional';

/**
 * Zod schema for Course data validation
 * Validates API responses to ensure type safety at runtime
 */
export const CourseSchema = z.object({
  id: z.string().min(1, "Kurs ID si ko'rsatilishi shart"),
  title: z.string().min(1, "Kurs nomi ko'rsatilishi shart"),
  description: z.string(),
  instructor: z.string().min(1, "O'qituvchi nomi ko'rsatilishi shart"),
  instructorPhoto: apiOptional(z.string().url("Noto'g'ri o'qituvchi rasmi manzili")),
  progress: z.number().min(0).max(100, "Jarayon 0 va 100 oralig'ida bo'lishi kerak"),
  grade: apiOptional(z.string()),
  status: z.enum(['active', 'completed', 'draft']),
  imageUrl: apiOptional(z.string().url("Noto'g'ri rasm manzili")),
  nextLesson: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
  }).optional(),
  dueDate: apiOptional(z.coerce.date()),
  credits: z.number().min(0, "Kreditlar manfiy bo'lishi mumkin emas"),
});

export const CourseMaterialSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['video', 'document', 'link']),
  url: z.string().url("Noto'g'ri material manzili"),
  uploadedAt: z.coerce.date(),
});

export const AnnouncementSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string(),
  createdAt: z.coerce.date(),
});

export const CourseDetailsSchema = CourseSchema.extend({
  syllabus: z.string(),
  objectives: z.array(z.string()),
  materials: z.array(CourseMaterialSchema),
  announcements: z.array(AnnouncementSchema),
});

export const CourseProgressSchema = z.object({
  completedLessons: z.number().min(0),
  totalLessons: z.number().min(0),
  completedAssignments: z.number().min(0),
  totalAssignments: z.number().min(0),
  averageScore: z.number().min(0).max(100),
});

export const CourseModuleSchema = z.object({
  id: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  order: z.number().min(0),
  duration: apiOptional(z.number().min(0)),
  type: z.enum(['video', 'document', 'quiz', 'assignment', 'scorm']),
  isCompleted: z.boolean(),
  completedAt: apiOptional(z.coerce.date()),
});

export const CourseContentSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: apiOptional(z.string()),
  contentType: z.enum(['video', 'document', 'pdf', 'scorm', 'html', 'quiz']),
  contentUrl: apiOptional(z.string().url("Noto'g'ri kontent manzili")),
  duration: apiOptional(z.number().min(0)),
  order: z.number().min(0),
  isViewed: z.boolean(),
  viewedAt: apiOptional(z.coerce.date()),
});

// Array schemas
export const CoursesArraySchema = z.array(CourseSchema);
export const CourseModulesArraySchema = z.array(CourseModuleSchema);
export const CourseContentArraySchema = z.array(CourseContentSchema);
