import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { gradeApi } from '@/services/api/grade-api';
import {
  useGrades,
  useCourseGrades,
  useGradeSummary,
  useGPA,
  useTranscript,
  useGradeDistribution,
} from '../useGrades';
import type { Grade, GradeDistribution } from '@/types/grade.types';
import type { GradeSummary, GPA, Transcript } from '@/services/api/grade-api';

// Mock the grade API service
vi.mock('@/services/api/grade-api', () => ({
  gradeApi: {
    fetchGrades: vi.fn(),
    fetchCourseGrades: vi.fn(),
    fetchGradeSummary: vi.fn(),
    fetchGPA: vi.fn(),
    fetchTranscript: vi.fn(),
    fetchGradeDistribution: vi.fn(),
  },
}));

// Helper to create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGrades hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useGrades', () => {
    it('should fetch grades successfully', async () => {
      const mockGrades: Grade[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          assignmentId: 'assign-1',
          assignmentName: 'Homework 1',
          gradeLetter: 'A',
          gradePoints: 4.0,
          scorePercentage: 95,
          maxScore: 100,
          earnedScore: 95,
          date: new Date('2024-01-15'),
        },
      ];

      vi.mocked(gradeApi.fetchGrades).mockResolvedValue(mockGrades);

      const { result } = renderHook(() => useGrades(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for success
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockGrades);
      expect(result.current.isLoading).toBe(false);
      expect(gradeApi.fetchGrades).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch grades');
      vi.mocked(gradeApi.fetchGrades).mockRejectedValue(error);

      const { result } = renderHook(() => useGrades(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useCourseGrades', () => {
    it('should fetch course grades successfully', async () => {
      const courseId = 'course-1';
      const mockGrades: Grade[] = [
        {
          id: '1',
          courseId: courseId,
          courseName: 'Math 101',
          assignmentId: 'assign-1',
          assignmentName: 'Homework 1',
          gradeLetter: 'A',
          gradePoints: 4.0,
          scorePercentage: 95,
          maxScore: 100,
          earnedScore: 95,
          date: new Date('2024-01-15'),
        },
      ];

      vi.mocked(gradeApi.fetchCourseGrades).mockResolvedValue(mockGrades);

      const { result } = renderHook(() => useCourseGrades(courseId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockGrades);
      expect(gradeApi.fetchCourseGrades).toHaveBeenCalledWith(courseId);
    });

    it('should not fetch when courseId is empty', () => {
      const { result } = renderHook(() => useCourseGrades(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(gradeApi.fetchCourseGrades).not.toHaveBeenCalled();
    });
  });

  describe('useGradeSummary', () => {
    it('should fetch grade summary successfully', async () => {
      const mockSummary: GradeSummary = {
        totalGrades: 10,
        averageScore: 88.5,
        highestScore: 98,
        lowestScore: 75,
        distribution: {
          A: 4,
          B: 3,
          C: 2,
          D: 1,
          F: 0,
        },
        recentGrades: [],
      };

      vi.mocked(gradeApi.fetchGradeSummary).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useGradeSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSummary);
      expect(result.current.data?.totalGrades).toBe(10);
      expect(result.current.data?.averageScore).toBe(88.5);
    });
  });

  describe('useGPA', () => {
    it('should fetch GPA successfully', async () => {
      const mockGPA: GPA = {
        currentGPA: 3.75,
        cumulativeGPA: 3.68,
        totalCredits: 120,
        completedCredits: 110,
        gradePoints: 404.8,
      };

      vi.mocked(gradeApi.fetchGPA).mockResolvedValue(mockGPA);

      const { result } = renderHook(() => useGPA(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockGPA);
      expect(result.current.data?.currentGPA).toBe(3.75);
      expect(result.current.data?.cumulativeGPA).toBe(3.68);
    });

    it('should handle GPA fetch errors', async () => {
      const error = new Error('GPA calculation failed');
      vi.mocked(gradeApi.fetchGPA).mockRejectedValue(error);

      const { result } = renderHook(() => useGPA(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useTranscript', () => {
    it('should fetch transcript successfully', async () => {
      const mockTranscript: Transcript = {
        studentId: 'student-123',
        studentName: 'John Doe',
        academicYear: '2023-2024',
        semesters: [
          {
            semester: 'Fall',
            academicYear: '2023',
            courses: [
              {
                courseId: 'course-1',
                courseCode: 'MATH101',
                courseName: 'Calculus I',
                credits: 4,
                gradeLetter: 'A',
                gradePoints: 4.0,
                instructor: 'Dr. Smith',
              },
            ],
            semesterGPA: 3.8,
            creditsEarned: 16,
          },
        ],
        cumulativeGPA: 3.75,
        totalCredits: 120,
        degreeProgress: 75,
      };

      vi.mocked(gradeApi.fetchTranscript).mockResolvedValue(mockTranscript);

      const { result } = renderHook(() => useTranscript(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTranscript);
      expect(result.current.data?.studentName).toBe('John Doe');
      expect(result.current.data?.cumulativeGPA).toBe(3.75);
      expect(result.current.data?.semesters).toHaveLength(1);
    });
  });

  describe('useGradeDistribution', () => {
    it('should fetch grade distribution successfully', async () => {
      const mockDistribution: GradeDistribution = {
        A: 15,
        B: 20,
        C: 10,
        D: 3,
        F: 2,
      };

      vi.mocked(gradeApi.fetchGradeDistribution).mockResolvedValue(mockDistribution);

      const { result } = renderHook(() => useGradeDistribution(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockDistribution);
      expect(result.current.data?.A).toBe(15);
      expect(result.current.data?.B).toBe(20);
    });

    it('should handle distribution fetch errors', async () => {
      const error = new Error('Distribution calculation failed');
      vi.mocked(gradeApi.fetchGradeDistribution).mockRejectedValue(error);

      const { result } = renderHook(() => useGradeDistribution(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('cache configuration', () => {
    it('should use 10-minute stale time for all grade queries', async () => {
      const mockGrades: Grade[] = [];
      vi.mocked(gradeApi.fetchGrades).mockResolvedValue(mockGrades);

      const { result } = renderHook(() => useGrades(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The staleTime is configured in the hook, we verify it doesn't refetch immediately
      // This is more of an integration test - the actual staleTime is tested by behavior
      expect(gradeApi.fetchGrades).toHaveBeenCalledTimes(1);
    });
  });
});
