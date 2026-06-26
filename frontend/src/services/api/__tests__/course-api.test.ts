import { describe, it, expect, vi, beforeEach } from 'vitest';
import { courseApi } from '../course-api';
import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import { Course, CourseDetails, CourseProgress } from '@/types/course.types';
import { CourseModule, CourseContent } from '../course-api';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/utils/error-handler');

describe('courseApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCourses', () => {
    it('should fetch courses with filters successfully', async () => {
      const mockCourses: Course[] = [
        {
          id: '1',
          title: 'Math 101',
          description: 'Introduction to Mathematics',
          instructor: 'John Doe',
          progress: 75,
          status: 'active',
          credits: 3,
        },
        {
          id: '2',
          title: 'Physics 201',
          description: 'Advanced Physics',
          instructor: 'Jane Smith',
          progress: 50,
          status: 'active',
          credits: 4,
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockCourses },
      });

      const result = await courseApi.fetchCourses({ status: 'active' });

      expect(api.get).toHaveBeenCalledWith('/students/me/courses', {
        params: { status: 'active' },
      });
      expect(result).toEqual(mockCourses);
    });

    it('should fetch courses without filters', async () => {
      const mockCourses: Course[] = [];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockCourses },
      });

      await courseApi.fetchCourses();

      expect(api.get).toHaveBeenCalledWith('/students/me/courses', {
        params: undefined,
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(courseApi.fetchCourses()).rejects.toThrow('Network error');
      expect(handleApiError).toHaveBeenCalledWith(error, {
        showToast: true,
        logToConsole: true,
      });
    });

    it('should handle unsuccessful response', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false, message: 'Failed to load courses' },
      });

      await expect(courseApi.fetchCourses()).rejects.toThrow('Failed to load courses');
    });
  });

  describe('fetchCourseById', () => {
    it('should fetch course details by id successfully', async () => {
      const mockCourseDetails: CourseDetails = {
        id: '1',
        title: 'Math 101',
        description: 'Introduction to Mathematics',
        instructor: 'John Doe',
        progress: 75,
        status: 'active',
        credits: 3,
        syllabus: 'Course syllabus',
        objectives: ['Learn algebra', 'Learn calculus'],
        materials: [],
        announcements: [],
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockCourseDetails },
      });

      const result = await courseApi.fetchCourseById('1');

      expect(api.get).toHaveBeenCalledWith('/courses/1');
      expect(result).toEqual(mockCourseDetails);
    });

    it('should handle API errors', async () => {
      const error = new Error('Course not found');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(courseApi.fetchCourseById('999')).rejects.toThrow('Course not found');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchCourseModules', () => {
    it('should fetch course modules successfully', async () => {
      const mockModules: CourseModule[] = [
        {
          id: 'module-1',
          courseId: 'course-1',
          title: 'Introduction',
          description: 'Getting started',
          order: 1,
          type: 'video',
          isCompleted: true,
        },
        {
          id: 'module-2',
          courseId: 'course-1',
          title: 'Advanced Topics',
          description: 'Deep dive',
          order: 2,
          type: 'document',
          isCompleted: false,
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockModules },
      });

      const result = await courseApi.fetchCourseModules('course-1');

      expect(api.get).toHaveBeenCalledWith('/courses/course-1/modules');
      expect(result).toEqual(mockModules);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch modules');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(courseApi.fetchCourseModules('course-1')).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchModuleContent', () => {
    it('should fetch module content successfully', async () => {
      const mockContent: CourseContent[] = [
        {
          id: 'content-1',
          moduleId: 'module-1',
          courseId: 'course-1',
          title: 'Video Lecture',
          contentType: 'video',
          order: 1,
          isViewed: true,
        },
        {
          id: 'content-2',
          moduleId: 'module-1',
          courseId: 'course-1',
          title: 'Reading Material',
          contentType: 'pdf',
          order: 2,
          isViewed: false,
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockContent },
      });

      const result = await courseApi.fetchModuleContent('course-1', 'module-1');

      expect(api.get).toHaveBeenCalledWith('/courses/course-1/modules/module-1/content');
      expect(result).toEqual(mockContent);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch content');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(
        courseApi.fetchModuleContent('course-1', 'module-1')
      ).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('markContentAsViewed', () => {
    it('should mark content as viewed successfully', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true },
      });

      await courseApi.markContentAsViewed('course-1', 'content-1');

      expect(api.post).toHaveBeenCalledWith(
        '/courses/course-1/content/content-1/view',
        expect.objectContaining({
          viewedAt: expect.any(Date),
        })
      );
    });

    it('should mark content as viewed with custom payload', async () => {
      const customDate = new Date('2024-01-01');
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true },
      });

      await courseApi.markContentAsViewed('course-1', 'content-1', {
        viewedAt: customDate,
        progress: 100,
      });

      expect(api.post).toHaveBeenCalledWith(
        '/courses/course-1/content/content-1/view',
        {
          viewedAt: customDate,
          progress: 100,
        }
      );
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to mark as viewed');
      vi.mocked(api.post).mockRejectedValue(error);

      await expect(
        courseApi.markContentAsViewed('course-1', 'content-1')
      ).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchCourseProgress', () => {
    it('should fetch course progress successfully', async () => {
      const mockProgress: CourseProgress = {
        completedLessons: 5,
        totalLessons: 10,
        completedAssignments: 3,
        totalAssignments: 5,
        averageScore: 85.5,
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockProgress },
      });

      const result = await courseApi.fetchCourseProgress('course-1');

      expect(api.get).toHaveBeenCalledWith('/courses/course-1/progress');
      expect(result).toEqual(mockProgress);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch progress');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(courseApi.fetchCourseProgress('course-1')).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('updateCourseProgress', () => {
    it('should update course progress successfully', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true },
      });

      const payload = {
        moduleId: 'module-1',
        contentId: 'content-1',
        progress: 75,
        completed: false,
        timeSpent: 1200,
      };

      await courseApi.updateCourseProgress('course-1', payload);

      expect(api.post).toHaveBeenCalledWith('/courses/course-1/progress', payload);
    });

    it('should update course progress with minimal payload', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true },
      });

      const payload = {
        progress: 100,
      };

      await courseApi.updateCourseProgress('course-1', payload);

      expect(api.post).toHaveBeenCalledWith('/courses/course-1/progress', payload);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to update progress');
      vi.mocked(api.post).mockRejectedValue(error);

      await expect(
        courseApi.updateCourseProgress('course-1', { progress: 50 })
      ).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });

    it('should handle unsuccessful response', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: false, message: 'Update failed' },
      });

      await expect(
        courseApi.updateCourseProgress('course-1', { progress: 50 })
      ).rejects.toThrow('Update failed');
    });
  });
});
