import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useTests,
  useTest,
  useStartTest,
  useSubmitAnswer,
  useSubmitTest,
  useTestResults,
  useTestHistory,
} from '../useTests';
import * as testApi from '@/services/test-api';
import { Test, TestDetails, TestSession, TestResult } from '@/types/test.types';

// Mock the test API
vi.mock('@/services/test-api');

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Test Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useTests', () => {
    it('should fetch tests successfully', async () => {
      const mockTests: Test[] = [
        {
          id: '1',
          title: 'Math Test',
          courseId: 'course-1',
          courseName: 'Mathematics',
          date: new Date('2024-01-15'),
          startTime: '09:00',
          endTime: '10:30',
          duration: 90,
          questionCount: 20,
          totalPoints: 100,
          proctoring: false,
          status: 'upcoming',
        },
      ];

      vi.mocked(testApi.fetchTests).mockResolvedValue(mockTests);

      const { result } = renderHook(() => useTests(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTests);
      expect(testApi.fetchTests).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching tests', async () => {
      const error = new Error('Network error');
      vi.mocked(testApi.fetchTests).mockRejectedValue(error);

      const { result } = renderHook(() => useTests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useTest', () => {
    it('should fetch test details by ID', async () => {
      const mockTestDetails: TestDetails = {
        id: '1',
        title: 'Math Test',
        courseId: 'course-1',
        courseName: 'Mathematics',
        date: new Date('2024-01-15'),
        startTime: '09:00',
        endTime: '10:30',
        duration: 90,
        questionCount: 20,
        totalPoints: 100,
        proctoring: false,
        status: 'upcoming',
        instructions: 'Complete all questions',
        allowedAttempts: 1,
        attemptsUsed: 0,
        passingScore: 60,
      };

      vi.mocked(testApi.fetchTestById).mockResolvedValue(mockTestDetails);

      const { result } = renderHook(() => useTest('1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockTestDetails);
      expect(testApi.fetchTestById).toHaveBeenCalledWith('1');
    });

    it('should not fetch when testId is empty', () => {
      const { result } = renderHook(() => useTest(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(testApi.fetchTestById).not.toHaveBeenCalled();
    });
  });

  describe('useStartTest', () => {
    it('should start a test successfully', async () => {
      const mockSession: TestSession = {
        id: 'session-1',
        testId: 'test-1',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 60 * 1000),
        questions: [],
      };

      vi.mocked(testApi.startTest).mockResolvedValue(mockSession);

      const { result } = renderHook(() => useStartTest(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('test-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSession);
      expect(testApi.startTest).toHaveBeenCalledWith('test-1');
    });
  });

  describe('useSubmitAnswer', () => {
    it('should submit an answer successfully', async () => {
      const mockResponse = { success: true, message: 'Answer saved' };

      vi.mocked(testApi.submitAnswer).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSubmitAnswer(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        testId: 'test-1',
        questionId: 'q-1',
        payload: { answer: 'A' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(testApi.submitAnswer).toHaveBeenCalledWith('test-1', 'q-1', {
        answer: 'A',
      });
    });
  });

  describe('useSubmitTest', () => {
    it('should submit test successfully', async () => {
      const mockResult: TestResult = {
        id: 'result-1',
        testId: 'test-1',
        score: 85,
        totalPoints: 100,
        percentage: 85,
        passed: true,
        submittedAt: new Date(),
      };

      vi.mocked(testApi.submitTest).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useSubmitTest(), {
        wrapper: createWrapper(),
      });

      const payload = {
        answers: [{ questionId: 'q-1', answer: 'A' }],
        submittedAt: new Date(),
      };

      result.current.mutate({ testId: 'test-1', payload });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResult);
      expect(testApi.submitTest).toHaveBeenCalledWith('test-1', payload);
    });
  });

  describe('useTestResults', () => {
    it('should fetch test results', async () => {
      const mockResult: TestResult = {
        id: 'result-1',
        testId: 'test-1',
        score: 85,
        totalPoints: 100,
        percentage: 85,
        passed: true,
        submittedAt: new Date(),
        feedback: 'Good job!',
      };

      vi.mocked(testApi.fetchTestResults).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useTestResults('test-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResult);
      expect(testApi.fetchTestResults).toHaveBeenCalledWith('test-1');
    });
  });

  describe('useTestHistory', () => {
    it('should fetch test history', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          testId: 'test-1',
          testTitle: 'Math Test',
          courseName: 'Mathematics',
          score: 85,
          totalPoints: 100,
          percentage: 85,
          passed: true,
          completedAt: new Date(),
        },
      ];

      vi.mocked(testApi.fetchTestHistory).mockResolvedValue(mockHistory);

      const { result } = renderHook(() => useTestHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockHistory);
      expect(testApi.fetchTestHistory).toHaveBeenCalled();
    });
  });
});
