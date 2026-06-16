import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import {
  Course,
  CourseDetails,
  CourseFilters,
  CourseProgress,
} from '@/types/course.types';
import { ApiResponse } from '@/lib/api';
import {
  CourseSchema,
  CoursesArraySchema,
  CourseDetailsSchema,
  CourseModuleSchema,
  CourseModulesArraySchema,
  CourseContentSchema,
  CourseContentArraySchema,
  CourseProgressSchema,
} from '@/types/schemas/course.schema';
import { validateArrayPartial, validateDataOrThrow } from '@/utils/validation';

/**
 * Course module content type for fetching module-specific content
 */
export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  duration?: number;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'scorm';
  isCompleted: boolean;
  completedAt?: Date;
}

/**
 * Course content item within a module
 */
export interface CourseContent {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description?: string;
  contentType: 'video' | 'document' | 'pdf' | 'scorm' | 'html' | 'quiz';
  contentUrl?: string;
  duration?: number;
  order: number;
  isViewed: boolean;
  viewedAt?: Date;
}

/**
 * Payload for marking content as viewed
 */
export interface MarkContentViewedPayload {
  viewedAt?: Date;
  progress?: number;
}

/**
 * Payload for updating course progress
 */
export interface UpdateProgressPayload {
  moduleId?: string;
  contentId?: string;
  progress: number;
  completed?: boolean;
  timeSpent?: number;
}

/**
 * Course API service for student course operations
 * Handles course enrollment, content viewing, and progress tracking
 */
export const courseApi = {
  /**
   * Fetches all courses for the authenticated student with optional filters
   * 
   * @param filters - Optional filters for status and search
   * @returns Promise resolving to array of courses
   * 
   * @example
   * ```typescript
   * const courses = await courseApi.fetchCourses({ status: 'active' });
   * ```
   */
  fetchCourses: async (filters?: CourseFilters): Promise<Course[]> => {
    try {
      const response = await api.get<ApiResponse<Course[]>>('/students/me/courses', {
        params: filters,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch courses');
      }

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedCourses = validateArrayPartial(
        CourseSchema,
        response.data.data,
        { context: 'courseApi.fetchCourses', logErrors: true }
      );

      return validatedCourses;
    } catch (error) {
      handleApiError(error, { 
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches detailed information for a specific course
   * 
   * @param id - The course ID
   * @returns Promise resolving to course details
   * 
   * @example
   * ```typescript
   * const courseDetails = await courseApi.fetchCourseById('course-123');
   * ```
   */
  fetchCourseById: async (id: string): Promise<CourseDetails> => {
    try {
      const response = await api.get<ApiResponse<CourseDetails>>(`/courses/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch course details');
      }

      // Validate response data with Zod schema
      const validatedCourseDetails = validateDataOrThrow(
        CourseDetailsSchema,
        response.data.data,
        { context: 'courseApi.fetchCourseById', logErrors: true }
      );

      return validatedCourseDetails;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches all modules for a specific course
   * 
   * @param courseId - The course ID
   * @returns Promise resolving to array of course modules
   * 
   * @example
   * ```typescript
   * const modules = await courseApi.fetchCourseModules('course-123');
   * ```
   */
  fetchCourseModules: async (courseId: string): Promise<CourseModule[]> => {
    try {
      const response = await api.get<ApiResponse<CourseModule[]>>(
        `/courses/${courseId}/modules`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch course modules');
      }

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedModules = validateArrayPartial(
        CourseModuleSchema,
        response.data.data,
        { context: 'courseApi.fetchCourseModules', logErrors: true }
      );

      return validatedModules;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches content items within a specific module
   * 
   * @param courseId - The course ID
   * @param moduleId - The module ID
   * @returns Promise resolving to array of course content items
   * 
   * @example
   * ```typescript
   * const content = await courseApi.fetchModuleContent('course-123', 'module-456');
   * ```
   */
  fetchModuleContent: async (
    courseId: string,
    moduleId: string
  ): Promise<CourseContent[]> => {
    try {
      const response = await api.get<ApiResponse<CourseContent[]>>(
        `/courses/${courseId}/modules/${moduleId}/content`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch module content');
      }

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedContent = validateArrayPartial(
        CourseContentSchema,
        response.data.data,
        { context: 'courseApi.fetchModuleContent', logErrors: true }
      );

      return validatedContent;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Marks a content item as viewed by the student
   * 
   * @param courseId - The course ID
   * @param contentId - The content ID
   * @param payload - Optional viewing metadata (timestamp, progress)
   * @returns Promise resolving when the operation completes
   * 
   * @example
   * ```typescript
   * await courseApi.markContentAsViewed('course-123', 'content-789', {
   *   viewedAt: new Date(),
   *   progress: 100
   * });
   * ```
   */
  markContentAsViewed: async (
    courseId: string,
    contentId: string,
    payload: MarkContentViewedPayload = {}
  ): Promise<void> => {
    try {
      const response = await api.post<ApiResponse<void>>(
        `/courses/${courseId}/content/${contentId}/view`,
        {
          viewedAt: payload.viewedAt || new Date(),
          progress: payload.progress,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to mark content as viewed');
      }
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches progress information for a specific course
   * 
   * @param courseId - The course ID
   * @returns Promise resolving to course progress data
   * 
   * @example
   * ```typescript
   * const progress = await courseApi.fetchCourseProgress('course-123');
   * console.log(`Completed ${progress.completedLessons}/${progress.totalLessons} lessons`);
   * ```
   */
  fetchCourseProgress: async (courseId: string): Promise<CourseProgress> => {
    try {
      const response = await api.get<ApiResponse<CourseProgress>>(
        `/courses/${courseId}/progress`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch course progress');
      }

      // Validate response data with Zod schema
      const validatedProgress = validateDataOrThrow(
        CourseProgressSchema,
        response.data.data,
        { context: 'courseApi.fetchCourseProgress', logErrors: true }
      );

      return validatedProgress;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Updates the progress for a course
   * Tracks module completion, content viewing, and time spent
   * 
   * @param courseId - The course ID
   * @param payload - Progress update data
   * @returns Promise resolving when the operation completes
   * 
   * @example
   * ```typescript
   * await courseApi.updateCourseProgress('course-123', {
   *   moduleId: 'module-456',
   *   contentId: 'content-789',
   *   progress: 75,
   *   completed: false,
   *   timeSpent: 1200
   * });
   * ```
   */
  updateCourseProgress: async (
    courseId: string,
    payload: UpdateProgressPayload
  ): Promise<void> => {
    try {
      const response = await api.post<ApiResponse<void>>(
        `/courses/${courseId}/progress`,
        payload
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update course progress');
      }
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },
};
