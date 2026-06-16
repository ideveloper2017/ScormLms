import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/lib/api';
import {
  fetchTests,
  fetchTestById,
  startTest,
  submitAnswer,
  submitTest,
  fetchTestResults,
  fetchTestHistory,
} from '../test-api';
import { Test, TestDetails, TestSession, TestResult } from '@/types/test.types';
import * as errorHandler from '@/utils/error-handler';

// Mock the api module
vi.mock('@/lib/api');

// Mock the error handler
vi.mock('@/utils/error-handler', () => ({
  handleApiError: vi.fn(),
}));

describe('Test API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchTests', () => {
    it('should fetch tests successfully', async () => {
      const mockTests: Test[] = [
        {
          id: '1',
          title: 'Midterm Exam',
          courseId: 'course-1',
          courseName: 'Mathematics',
          date: new Date('2024-06-15'),
          startTime: '09:00',
          endTime: '11:00',
          duration: 120,
          questionCount: 50,
          totalPoints: 100,
          proctoring: true,
          status: 'upcoming',
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockTests },
      });

      const result = await fetchTests();

      expect(api.get).toHaveBeenCalledWith('/students/me/tests', { params: undefined });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Midterm Exam');
      expect(result[0].date).toBeInstanceOf(Date);
    });

    it('should fetch tests with filters', async () => {
      const mockTests: Test[] = [];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockTests },
      });

      await fetchTests({ status: 'upcoming', courseId: 'course-1' });

      expect(api.get).toHaveBeenCalledWith('/students/me/tests', {
        params: { status: 'upcoming', courseId: 'course-1' },
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchTests()).rejects.toThrow('Network error');
      expect(errorHandler.handleApiError).toHaveBeenCalledWith(error, {
        showToast: true,
        logToConsole: true,
      });
    });
  });

  describe('fetchTestById', () => {
    it('should fetch test details successfully', async () => {
      const mockTestDetails: TestDetails = {
        id: '1',
        title: 'Midterm Exam',
        courseId: 'course-1',
        courseName: 'Mathematics',
        date: new Date('2024-06-15'),
        startTime: '09:00',
        endTime: '11:00',
        duration: 120,
        questionCount: 50,
        totalPoints: 100,
        proctoring: true,
        status: 'upcoming',
        instructions: 'Read carefully',
        allowedAttempts: 1,
        attemptsUsed: 0,
        passingScore: 60,
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockTestDetails },
      });

      const result = await fetchTestById('1');

      expect(api.get).toHaveBeenCalledWith('/tests/1');
      expect(result.title).toBe('Midterm Exam');
      expect(result.date).toBeInstanceOf(Date);
    });
  });

  describe('startTest', () => {
    it('should start test successfully', async () => {
      const mockSession: TestSession = {
        id: 'session-1',
        testId: '1',
        startedAt: new Date('2024-06-15T09:00:00Z'),
        expiresAt: new Date('2024-06-15T11:00:00Z'),
        questions: [],
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: { session: mockSession } },
      });

      const result = await startTest('1');

      expect(api.post).toHaveBeenCalledWith('/tests/1/start');
      expect(result.id).toBe('session-1');
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle start test errors', async () => {
      const error = new Error('Test already started');
      vi.mocked(api.post).mockRejectedValue(error);

      await expect(startTest('1')).rejects.toThrow('Test already started');
      expect(errorHandler.handleApiError).toHaveBeenCalledWith(error, {
        showToast: true,
        logToConsole: true,
        customMessage: 'Testni boshlashda xatolik yuz berdi',
      });
    });
  });

  describe('submitAnswer', () => {
    it('should submit answer successfully', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, message: 'Answer submitted' },
      });

      const result = await submitAnswer('test-1', 'question-1', { answer: 'A' });

      expect(api.post).toHaveBeenCalledWith(
        '/tests/test-1/questions/question-1/answer',
        { answer: 'A' }
      );
      expect(result.success).toBe(true);
    });
  });

  describe('submitTest', () => {
    it('should submit test successfully', async () => {
      const mockResult: TestResult = {
        id: 'result-1',
        testId: 'test-1',
        score: 85,
        totalPoints: 100,
        percentage: 85,
        passed: true,
        submittedAt: new Date('2024-06-15T11:00:00Z'),
      };

      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: mockResult },
      });

      const payload = {
        answers: [{ questionId: 'q1', answer: 'A' }],
        submittedAt: new Date('2024-06-15T11:00:00Z'),
      };

      const result = await submitTest('test-1', payload);

      expect(api.post).toHaveBeenCalledWith('/tests/test-1/submit', {
        answers: payload.answers,
        submittedAt: payload.submittedAt.toISOString(),
      });
      expect(result.score).toBe(85);
      expect(result.submittedAt).toBeInstanceOf(Date);
    });
  });

  describe('fetchTestResults', () => {
    it('should fetch test results successfully', async () => {
      const mockResult: TestResult = {
        id: 'result-1',
        testId: 'test-1',
        score: 85,
        totalPoints: 100,
        percentage: 85,
        passed: true,
        submittedAt: new Date('2024-06-15T11:00:00Z'),
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockResult },
      });

      const result = await fetchTestResults('test-1');

      expect(api.get).toHaveBeenCalledWith('/tests/test-1/results');
      expect(result.score).toBe(85);
      expect(result.submittedAt).toBeInstanceOf(Date);
    });
  });

  describe('fetchTestHistory', () => {
    it('should fetch test history successfully', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          testId: 'test-1',
          testTitle: 'Midterm Exam',
          courseName: 'Mathematics',
          score: 85,
          totalPoints: 100,
          percentage: 85,
          passed: true,
          completedAt: new Date('2024-06-15T11:00:00Z'),
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockHistory },
      });

      const result = await fetchTestHistory();

      expect(api.get).toHaveBeenCalledWith('/students/me/tests/history');
      expect(result).toHaveLength(1);
      expect(result[0].testTitle).toBe('Midterm Exam');
      expect(result[0].completedAt).toBeInstanceOf(Date);
    });
  });
});
