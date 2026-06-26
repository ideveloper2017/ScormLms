import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { courseApi } from '@/services/api/course-api';
import type {
  Course,
  CourseDetails,
  CourseFilters,
  CourseProgress,
} from '@/types/course.types';
import type {
  CourseModule,
  CourseContent,
  MarkContentViewedPayload,
  UpdateProgressPayload,
} from '@/services/api/course-api';
import { toast } from 'sonner';

/**
 * Hook for fetching courses with optional filters
 * 
 * @param filters - Optional filters for status and search
 * @returns React Query result with courses data, loading, and error states
 * 
 * @example
 * ```typescript
 * const { data: courses, isLoading, error } = useCourses({ status: 'active' });
 * ```
 */
export const useCourses = (filters?: CourseFilters) => {
  return useQuery<Course[], Error>({
    queryKey: qk.courses.list(filters),
    queryFn: () => courseApi.fetchCourses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
};

/**
 * Hook for fetching a single course by ID
 * 
 * @param id - The course ID
 * @returns React Query result with course details data, loading, and error states
 * 
 * @example
 * ```typescript
 * const { data: course, isLoading } = useCourse('course-123');
 * ```
 */
export const useCourse = (id: string) => {
  return useQuery<CourseDetails, Error>({
    queryKey: qk.courses.detail(id),
    queryFn: () => courseApi.fetchCourseById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook for fetching all modules within a course
 * 
 * @param courseId - The course ID
 * @returns React Query result with course modules data, loading, and error states
 * 
 * @example
 * ```typescript
 * const { data: modules, isLoading } = useCourseModules('course-123');
 * ```
 */
export const useCourseModules = (courseId: string) => {
  return useQuery<CourseModule[], Error>({
    queryKey: [...qk.courses.detail(courseId), 'modules'],
    queryFn: () => courseApi.fetchCourseModules(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook for fetching content items within a module
 * 
 * @param courseId - The course ID
 * @param moduleId - The module ID
 * @returns React Query result with module content data, loading, and error states
 * 
 * @example
 * ```typescript
 * const { data: content, isLoading } = useModuleContent('course-123', 'module-456');
 * ```
 */
export const useModuleContent = (courseId: string, moduleId: string) => {
  return useQuery<CourseContent[], Error>({
    queryKey: [...qk.courses.detail(courseId), 'modules', moduleId, 'content'],
    queryFn: () => courseApi.fetchModuleContent(courseId, moduleId),
    enabled: !!courseId && !!moduleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook for fetching course progress
 * 
 * @param courseId - The course ID
 * @returns React Query result with course progress data, loading, and error states
 * 
 * @example
 * ```typescript
 * const { data: progress, isLoading } = useCourseProgress('course-123');
 * ```
 */
export const useCourseProgress = (courseId: string) => {
  return useQuery<CourseProgress, Error>({
    queryKey: qk.courses.progress(courseId),
    queryFn: () => courseApi.fetchCourseProgress(courseId),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes (progress updates more frequently)
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook for marking content as viewed
 * Automatically invalidates course progress and module content queries
 * 
 * @returns Mutation hook for marking content as viewed
 * 
 * @example
 * ```typescript
 * const markViewed = useMarkContentViewed();
 * 
 * markViewed.mutate({
 *   courseId: 'course-123',
 *   contentId: 'content-789',
 *   payload: { viewedAt: new Date(), progress: 100 }
 * });
 * ```
 */
export const useMarkContentViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      contentId,
      payload,
    }: {
      courseId: string;
      contentId: string;
      payload?: MarkContentViewedPayload;
    }) => courseApi.markContentAsViewed(courseId, contentId, payload),
    onSuccess: (_, variables) => {
      // Invalidate progress query to refetch updated progress
      queryClient.invalidateQueries({
        queryKey: qk.courses.progress(variables.courseId),
      });

      // Invalidate course modules to update completion status
      queryClient.invalidateQueries({
        queryKey: [...qk.courses.detail(variables.courseId), 'modules'],
      });

      // Invalidate module content to update viewed status
      queryClient.invalidateQueries({
        queryKey: [...qk.courses.detail(variables.courseId), 'modules'],
        exact: false,
      });

      // Show success toast
      toast.success('Kontent ko\'rildi deb belgilandi');
    },
    onError: (error: Error) => {
      toast.error('Kontentni belgilashda xatolik: ' + error.message);
    },
  });
};

/**
 * Hook for updating course progress
 * Automatically invalidates course progress and related queries
 * 
 * @returns Mutation hook for updating course progress
 * 
 * @example
 * ```typescript
 * const updateProgress = useUpdateProgress();
 * 
 * updateProgress.mutate({
 *   courseId: 'course-123',
 *   payload: {
 *     moduleId: 'module-456',
 *     progress: 75,
 *     completed: false,
 *     timeSpent: 1200
 *   }
 * });
 * ```
 */
export const useUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      courseId,
      payload,
    }: {
      courseId: string;
      payload: UpdateProgressPayload;
    }) => courseApi.updateCourseProgress(courseId, payload),
    onMutate: async ({ courseId, payload }) => {
      // Cancel any outgoing refetches to avoid optimistic update being overwritten
      await queryClient.cancelQueries({
        queryKey: qk.courses.progress(courseId),
      });

      // Snapshot the previous value
      const previousProgress = queryClient.getQueryData<CourseProgress>(
        qk.courses.progress(courseId)
      );

      // Optimistically update the progress
      if (previousProgress && payload.progress !== undefined) {
        queryClient.setQueryData<CourseProgress>(
          qk.courses.progress(courseId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              // Update based on the payload
              completedLessons: payload.completed
                ? old.completedLessons + 1
                : old.completedLessons,
            };
          }
        );
      }

      return { previousProgress };
    },
    onError: (error: Error, variables, context) => {
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(
          qk.courses.progress(variables.courseId),
          context.previousProgress
        );
      }
      toast.error('Progressni yangilashda xatolik: ' + error.message);
    },
    onSuccess: (_, variables) => {
      // Invalidate progress query to get fresh data from server
      queryClient.invalidateQueries({
        queryKey: qk.courses.progress(variables.courseId),
      });

      // Invalidate course list to update overall progress
      queryClient.invalidateQueries({
        queryKey: qk.courses.list(),
      });

      // Invalidate course details
      queryClient.invalidateQueries({
        queryKey: qk.courses.detail(variables.courseId),
      });

      // Invalidate modules if module was completed
      if (variables.payload.completed) {
        queryClient.invalidateQueries({
          queryKey: [...qk.courses.detail(variables.courseId), 'modules'],
        });
      }

      toast.success('Progress yangilandi');
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: qk.courses.progress(variables.courseId),
      });
    },
  });
};
