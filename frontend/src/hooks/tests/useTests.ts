import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import {
  fetchTests,
  fetchTestById,
  startTest,
  submitAnswer,
  submitTest,
  fetchTestResults,
  fetchTestHistory,
  TestFilters,
  SubmitAnswerPayload,
} from '@/services/test-api';
import { SubmitTestPayload } from '@/types/test.types';
import { toast } from 'sonner';

/**
 * Hook to fetch all tests with optional filters
 * @param filters - Optional filter parameters (status, courseId)
 * @returns Query result with tests data, loading, and error states
 */
export const useTests = (filters?: TestFilters) => {
  return useQuery({
    queryKey: qk.tests.list(),
    queryFn: () => fetchTests(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single test by ID
 * @param testId - The test ID
 * @returns Query result with test details, loading, and error states
 */
export const useTest = (testId: string) => {
  return useQuery({
    queryKey: qk.tests.detail(testId),
    queryFn: () => fetchTestById(testId),
    enabled: !!testId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to start a test session
 * Mutation hook that starts a test and manages test session state
 * @returns Mutation result with mutate function, loading, and error states
 */
export const useStartTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (testId: string) => startTest(testId),
    onSuccess: (data, testId) => {
      // Update the test status to in-progress optimistically
      queryClient.setQueryData(qk.tests.detail(testId), (old: any) => {
        if (old) {
          return { ...old, status: 'in-progress' };
        }
        return old;
      });

      // Invalidate test list to refetch with updated status
      queryClient.invalidateQueries({ queryKey: qk.tests.list() });

      toast.success('Test boshlandi', {
        description: 'Omad tilaymiz!',
      });
    },
    onError: (error: any) => {
      toast.error('Testni boshlashda xatolik', {
        description: error.message || 'Qayta urinib ko\'ring',
      });
    },
  });
};

/**
 * Hook to submit an answer for a specific question
 * Used during test taking to submit individual answers
 * @returns Mutation result with mutate function for submitting answers
 */
export const useSubmitAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      testId,
      questionId,
      payload,
    }: {
      testId: string;
      questionId: string;
      payload: SubmitAnswerPayload;
    }) => submitAnswer(testId, questionId, payload),
    onSuccess: (data, variables) => {
      // Optionally update local state or cache
      // This is a silent operation, no toast needed for each answer
    },
    onError: (error: any) => {
      toast.error('Javobni saqlashda xatolik', {
        description: error.message || 'Javobingiz saqlanmadi',
      });
    },
  });
};

/**
 * Hook to submit the entire test with all answers
 * Finalizes test session and calculates results
 * @returns Mutation result with mutate function, loading, and error states
 */
export const useSubmitTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, payload }: { testId: string; payload: SubmitTestPayload }) =>
      submitTest(testId, payload),
    onMutate: async ({ testId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: qk.tests.detail(testId) });

      // Snapshot the previous value
      const previousTest = queryClient.getQueryData(qk.tests.detail(testId));

      // Optimistically update to completed status
      queryClient.setQueryData(qk.tests.detail(testId), (old: any) => {
        if (old) {
          return { ...old, status: 'completed' };
        }
        return old;
      });

      return { previousTest };
    },
    onSuccess: (result, { testId }) => {
      // Invalidate and refetch test data
      queryClient.invalidateQueries({ queryKey: qk.tests.detail(testId) });
      queryClient.invalidateQueries({ queryKey: qk.tests.list() });

      // Show success message with score
      toast.success('Test topshirildi!', {
        description: `Natija: ${result.percentage.toFixed(1)}% (${result.score}/${result.totalPoints})`,
      });
    },
    onError: (error: any, { testId }, context) => {
      // Rollback optimistic update on error
      if (context?.previousTest) {
        queryClient.setQueryData(qk.tests.detail(testId), context.previousTest);
      }

      toast.error('Test topshirishda xatolik', {
        description: error.message || 'Qayta urinib ko\'ring',
      });
    },
    onSettled: (data, error, { testId }) => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: qk.tests.detail(testId) });
      queryClient.invalidateQueries({ queryKey: qk.tests.list() });
    },
  });
};

/**
 * Hook to fetch test results by test ID
 * @param testId - The test ID
 * @returns Query result with test results, loading, and error states
 */
export const useTestResults = (testId: string) => {
  return useQuery({
    queryKey: [...qk.tests.detail(testId), 'results'],
    queryFn: () => fetchTestResults(testId),
    enabled: !!testId,
    staleTime: 5 * 60 * 1000, // 5 minutes - results don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch test history for the current student
 * Returns all completed tests with scores and dates
 * @returns Query result with test history, loading, and error states
 */
export const useTestHistory = () => {
  return useQuery({
    queryKey: [...qk.tests.list(), 'history'],
    queryFn: fetchTestHistory,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
