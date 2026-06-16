import { z } from 'zod';

/**
 * Zod schema for Course data validation
 * Validates API responses to ensure type safety at runtime
 */
export const CourseSchema = z.object({
  id: z.string().min(1, 'Course ID is required'),
  title: z.string().min(1, 'Course title is required'),
  description: z.string(),
  instructor: z.string().min(1, 'Instructor name is required'),
  instructorPhoto: z.string().url('Invalid instructor photo URL').optional(),
  progress: z.number().min(0).max(100, 'Progress must be between 0 and 100'),
  grade: z.string().optional(),
  status: z.enum(['active', 'completed', 'draft']),
  imageUrl: z.string().url('Invalid image URL').optional(),
  nextLesson: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
  }).optional(),
  dueDate: z.coerce.date().optional(),
  credits: z.number().min(0, 'Credits must be non-negative'),
});

export const CourseMaterialSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['video', 'document', 'link']),
  url: z.string().url('Invalid material URL'),
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
  duration: z.number().min(0).optional(),
  type: z.enum(['video', 'document', 'quiz', 'assignment', 'scorm']),
  isCompleted: z.boolean(),
  completedAt: z.coerce.date().optional(),
});

export const CourseContentSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  courseId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  contentType: z.enum(['video', 'document', 'pdf', 'scorm', 'html', 'quiz']),
  contentUrl: z.string().url('Invalid content URL').optional(),
  duration: z.number().min(0).optional(),
  order: z.number().min(0),
  isViewed: z.boolean(),
  viewedAt: z.coerce.date().optional(),
});

// Array schemas
export const CoursesArraySchema = z.array(CourseSchema);
export const CourseModulesArraySchema = z.array(CourseModuleSchema);
export const CourseContentArraySchema = z.array(CourseContentSchema);
