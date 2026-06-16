import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosResponse } from 'axios';
import api from '@/lib/api';
import {
  fetchGrades,
  fetchCourseGrades,
  fetchGradeSummary,
  fetchGPA,
  fetchTranscript,
  fetchGradeDistribution,
  gradeApi,
} from '../grade-api';
import { handleApiError } from '@/utils/error-handler';
import { Grade, GradeDistribution } from '@/types/grade.types';
import type { GradeSummary, GPA, Transcript } from '../grade-api';

// Mock the api module
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock the error handler
vi.mock('@/utils/error-handler', () => ({
  handleApiError: vi.fn((error) => {
    throw error;
  }),
}));

describe('grade-api service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchGrades', () => {
    it('should fetch all grades successfully', async () => {
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
          date: '2024-01-15T10:00:00Z' as any,
        },
        {
          id: '2',
          courseId: 'course-2',
          courseName: 'Physics 201',
          testId: 'test-1',
          testName: 'Midterm Exam',
          gradeLetter: 'B+',
          gradePoints: 3.3,
          scorePercentage: 87,
          maxScore: 100,
          earnedScore: 87,
          date: '2024-01-20T14:00:00Z' as any,
        },
      ];

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockGrades,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchGrades();

      expect(api.get).toHaveBeenCalledWith('/students/me/grades', {
        params: undefined,
      });
      expect(result).toHaveLength(2);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[0].courseName).toBe('Math 101');
      expect(result[1].courseName).toBe('Physics 201');
    });

    it('should fetch grades with filters', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: [],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const filters = {
        courseId: 'course-1',
        semester: 'Fall',
        academicYear: '2024',
      };

      await fetchGrades(filters);

      expect(api.get).toHaveBeenCalledWith('/students/me/grades', {
        params: filters,
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchGrades()).rejects.toThrow('Network error');
      expect(handleApiError).toHaveBeenCalledWith(error, {
        showToast: true,
        logToConsole: true,
      });
    });

    it('should throw error when response is not successful', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: false,
          message: 'Failed to fetch grades',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      await expect(fetchGrades()).rejects.toThrow('Failed to fetch grades');
    });
  });

  describe('fetchCourseGrades', () => {
    it('should fetch course grades successfully', async () => {
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
          date: '2024-01-15T10:00:00Z' as any,
        },
      ];

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockGrades,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchCourseGrades('course-1');

      expect(api.get).toHaveBeenCalledWith('/students/me/courses/course-1/grades');
      expect(result).toHaveLength(1);
      expect(result[0].courseId).toBe('course-1');
      expect(result[0].date).toBeInstanceOf(Date);
    });

    it('should throw error when courseId is not provided', async () => {
      await expect(fetchCourseGrades('')).rejects.toThrow('Course ID is required');
    });

    it('should handle API errors', async () => {
      const error = new Error('Not found');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchCourseGrades('course-1')).rejects.toThrow('Not found');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchGradeSummary', () => {
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
        recentGrades: [
          {
            id: '1',
            courseId: 'course-1',
            courseName: 'Math 101',
            gradeLetter: 'A',
            gradePoints: 4.0,
            scorePercentage: 95,
            maxScore: 100,
            earnedScore: 95,
            date: '2024-01-15T10:00:00Z' as any,
          },
        ],
      };

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockSummary,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchGradeSummary();

      expect(api.get).toHaveBeenCalledWith('/students/me/grades/summary');
      expect(result.totalGrades).toBe(10);
      expect(result.averageScore).toBe(88.5);
      expect(result.distribution.A).toBe(4);
      expect(result.recentGrades[0].date).toBeInstanceOf(Date);
    });

    it('should handle API errors', async () => {
      const error = new Error('Server error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchGradeSummary()).rejects.toThrow('Server error');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchGPA', () => {
    it('should fetch GPA successfully', async () => {
      const mockGPA: GPA = {
        currentGPA: 3.75,
        cumulativeGPA: 3.68,
        totalCredits: 120,
        completedCredits: 110,
        gradePoints: 404.8,
        semesterGPA: 3.85,
      };

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockGPA,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchGPA();

      expect(api.get).toHaveBeenCalledWith('/students/me/gpa');
      expect(result.currentGPA).toBe(3.75);
      expect(result.cumulativeGPA).toBe(3.68);
      expect(result.totalCredits).toBe(120);
    });

    it('should handle API errors', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchGPA()).rejects.toThrow('Unauthorized');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchTranscript', () => {
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

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockTranscript,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchTranscript();

      expect(api.get).toHaveBeenCalledWith('/students/me/transcript');
      expect(result.studentId).toBe('student-123');
      expect(result.studentName).toBe('John Doe');
      expect(result.cumulativeGPA).toBe(3.75);
      expect(result.semesters).toHaveLength(1);
      expect(result.semesters[0].courses).toHaveLength(1);
    });

    it('should handle API errors', async () => {
      const error = new Error('Not found');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchTranscript()).rejects.toThrow('Not found');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchGradeDistribution', () => {
    it('should fetch grade distribution successfully', async () => {
      const mockDistribution: GradeDistribution = {
        A: 15,
        B: 20,
        C: 10,
        D: 3,
        F: 2,
      };

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockDistribution,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchGradeDistribution();

      expect(api.get).toHaveBeenCalledWith('/students/me/grades/distribution');
      expect(result.A).toBe(15);
      expect(result.B).toBe(20);
      expect(result.C).toBe(10);
      expect(result.D).toBe(3);
      expect(result.F).toBe(2);
    });

    it('should handle API errors', async () => {
      const error = new Error('Server error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchGradeDistribution()).rejects.toThrow('Server error');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('gradeApi object', () => {
    it('should export all functions in gradeApi object', () => {
      expect(gradeApi).toHaveProperty('fetchGrades');
      expect(gradeApi).toHaveProperty('fetchCourseGrades');
      expect(gradeApi).toHaveProperty('fetchGradeSummary');
      expect(gradeApi).toHaveProperty('fetchGPA');
      expect(gradeApi).toHaveProperty('fetchTranscript');
      expect(gradeApi).toHaveProperty('fetchGradeDistribution');
      
      expect(typeof gradeApi.fetchGrades).toBe('function');
      expect(typeof gradeApi.fetchCourseGrades).toBe('function');
      expect(typeof gradeApi.fetchGradeSummary).toBe('function');
      expect(typeof gradeApi.fetchGPA).toBe('function');
      expect(typeof gradeApi.fetchTranscript).toBe('function');
      expect(typeof gradeApi.fetchGradeDistribution).toBe('function');
    });
  });
});
