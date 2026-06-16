import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import {
  Test,
  TestDetails,
  TestSession,
  TestResult,
  TestQuestion,
  SubmitTestPayload,
} from '@/types/test.types';
import {
  TestSchema,
  TestDetailsSchema,
  TestSessionSchema,
  TestResultSchema,
  TestHistoryItemSchema,
} from '@/types/schemas/test.schema';
import { validateArrayPartial, validateDataOrThrow } from '@/utils/validation';

/**
 * Filter options for fetching tests
 */
export interface TestFilters {
  status?: 'upcoming' | 'in-progress' | 'completed' | 'missed';
  courseId?: string;
}

/**
 * Payload for starting a test
 */
export interface StartTestResponse {
  session: TestSession;
}

/**
 * Payload for submitting an answer to a specific question
 */
export interface SubmitAnswerPayload {
  answer: string;
}

/**
 * Response for submitting an answer
 */
export interface SubmitAnswerResponse {
  success: boolean;
  message?: string;
}

/**
 * Test history item
 */
export interface TestHistoryItem {
  id: string;
  testId: string;
  testTitle: string;
  courseName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  completedAt: Date;
}

/**
 * Fetch all tests for the current student with optional filters
 * GET /students/me/tests
 */
export const fetchTests = async (filters?: TestFilters): Promise<Test[]> => {
  try {
    const response = await api.get<{ success: boolean; data: Test[] }>(
      '/students/me/tests',
      { params: filters }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch tests');
    }

    // Transform date strings to Date objects
    const parsedData = response.data.data.map((test) => ({
      ...test,
      date: new Date(test.date),
    }));

    // Validate array with element-level filtering (Requirement 14.4)
    const validatedTests = validateArrayPartial(
      TestSchema,
      parsedData,
      { context: 'testApi.fetchTests', logErrors: true }
    );

    return validatedTests;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Fetch test details by ID
 * GET /tests/{id}
 */
export const fetchTestById = async (testId: string): Promise<TestDetails> => {
  try {
    const response = await api.get<{ success: boolean; data: TestDetails }>(
      `/tests/${testId}`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch test details');
    }

    // Transform date strings to Date objects
    const parsedData = {
      ...response.data.data,
      date: new Date(response.data.data.date),
    };

    // Validate with Zod schema
    const validatedTestDetails = validateDataOrThrow(
      TestDetailsSchema,
      parsedData,
      { context: 'testApi.fetchTestById', logErrors: true }
    );

    return validatedTestDetails;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Start a test session
 * POST /tests/{id}/start
 */
export const startTest = async (testId: string): Promise<TestSession> => {
  try {
    const response = await api.post<{ success: boolean; data: StartTestResponse }>(
      `/tests/${testId}/start`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to start test');
    }

    const session = response.data.data.session;

    // Transform date strings to Date objects
    const parsedSession = {
      ...session,
      startedAt: new Date(session.startedAt),
      expiresAt: new Date(session.expiresAt),
    };

    // Validate with Zod schema
    const validatedSession = validateDataOrThrow(
      TestSessionSchema,
      parsedSession,
      { context: 'testApi.startTest', logErrors: true }
    );

    return validatedSession;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
      customMessage: 'Testni boshlashda xatolik yuz berdi',
    });
    throw error;
  }
};

/**
 * Submit an answer for a specific question in a test
 * POST /tests/{testId}/questions/{questionId}/answer
 */
export const submitAnswer = async (
  testId: string,
  questionId: string,
  payload: SubmitAnswerPayload
): Promise<SubmitAnswerResponse> => {
  try {
    const response = await api.post<SubmitAnswerResponse>(
      `/tests/${testId}/questions/${questionId}/answer`,
      payload
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to submit answer');
    }

    return response.data;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
      customMessage: 'Javobni yuborishda xatolik yuz berdi',
    });
    throw error;
  }
};

/**
 * Submit the entire test with all answers
 * POST /tests/{id}/submit
 */
export const submitTest = async (
  testId: string,
  payload: SubmitTestPayload
): Promise<TestResult> => {
  try {
    const response = await api.post<{ success: boolean; data: TestResult }>(
      `/tests/${testId}/submit`,
      {
        ...payload,
        submittedAt: payload.submittedAt.toISOString(),
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to submit test');
    }

    // Transform date strings to Date objects
    const parsedResult = {
      ...response.data.data,
      submittedAt: new Date(response.data.data.submittedAt),
    };

    // Validate with Zod schema
    const validatedResult = validateDataOrThrow(
      TestResultSchema,
      parsedResult,
      { context: 'testApi.submitTest', logErrors: true }
    );

    return validatedResult;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
      customMessage: 'Testni topshirishda xatolik yuz berdi',
    });
    throw error;
  }
};

/**
 * Fetch test results by test ID
 * GET /tests/{id}/results
 */
export const fetchTestResults = async (testId: string): Promise<TestResult> => {
  try {
    const response = await api.get<{ success: boolean; data: TestResult }>(
      `/tests/${testId}/results`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch test results');
    }

    // Transform date strings to Date objects
    return {
      ...response.data.data,
      submittedAt: new Date(response.data.data.submittedAt),
    };
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Fetch test history for the current student
 * GET /students/me/tests/history
 */
export const fetchTestHistory = async (): Promise<TestHistoryItem[]> => {
  try {
    const response = await api.get<{ success: boolean; data: TestHistoryItem[] }>(
      '/students/me/tests/history'
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch test history');
    }

    // Transform date strings to Date objects
    const parsedData = response.data.data.map((item) => ({
      ...item,
      completedAt: new Date(item.completedAt),
    }));

    // Validate array with element-level filtering (Requirement 14.4)
    const validatedHistory = validateArrayPartial(
      TestHistoryItemSchema,
      parsedData,
      { context: 'testApi.fetchTestHistory', logErrors: true }
    );

    return validatedHistory;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};
