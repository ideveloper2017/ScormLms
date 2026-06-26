/**
 * Grade API Service
 * 
 * Handles all grade-related API endpoints for the Student Portal.
 * Provides functions to fetch grades, GPA, grade summaries, and transcripts.
 */

import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import { ApiResponse } from '@/types/api.types';
import { Grade, GPAData, GradeDistribution } from '@/types/grade.types';
import {
  GradeSchema,
  GradeDistributionSchema,
  GPADataSchema,
} from '@/types/schemas/grade.schema';
import { validateArrayPartial, validateDataOrThrow, validateDataOrFallback } from '@/utils/validation';

/**
 * Filter parameters for grade queries
 */
export interface GradeFilters {
  courseId?: string;
  semester?: string;
  academicYear?: string;
  assignmentId?: string;
  testId?: string;
}

/**
 * Grade summary containing aggregated grade statistics
 */
export interface GradeSummary {
  totalGrades: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  distribution: GradeDistribution;
  recentGrades: Grade[];
}

/**
 * GPA calculation result with additional context
 */
export interface GPA {
  currentGPA: number;
  cumulativeGPA: number;
  totalCredits: number;
  completedCredits: number;
  gradePoints: number;
  semesterGPA?: number;
}

/**
 * Academic transcript containing complete grade history
 */
export interface Transcript {
  studentId: string;
  studentName: string;
  academicYear: string;
  semesters: TranscriptSemester[];
  cumulativeGPA: number;
  totalCredits: number;
  degreeProgress: number;
}

/**
 * Semester data within transcript
 */
export interface TranscriptSemester {
  semester: string;
  academicYear: string;
  courses: TranscriptCourse[];
  semesterGPA: number;
  creditsEarned: number;
}

/**
 * Course data within transcript
 */
export interface TranscriptCourse {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  gradeLetter: string;
  gradePoints: number;
  instructor: string;
}

/**
 * Fetches all grades for the authenticated student with optional filters
 * 
 * @param filters - Optional filters to narrow down grade results
 * @returns Promise resolving to array of Grade objects
 * 
 * @example
 * ```typescript
 * // Fetch all grades
 * const grades = await fetchGrades();
 * 
 * // Fetch grades for specific course
 * const courseGrades = await fetchGrades({ courseId: '123' });
 * 
 * // Fetch grades for specific semester
 * const semesterGrades = await fetchGrades({ semester: 'Fall', academicYear: '2024' });
 * ```
 */
export const fetchGrades = async (filters?: GradeFilters): Promise<Grade[]> => {
  try {
    const response = await api.get<ApiResponse<Grade[]>>('/students/me/grades', {
      params: filters,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch grades');
    }

    // Transform date strings to Date objects
    const parsedData = response.data.data.map(grade => ({
      ...grade,
      date: new Date(grade.date),
    }));

    // Validate array with element-level filtering (Requirement 14.4)
    const validatedGrades = validateArrayPartial(
      GradeSchema,
      parsedData,
      { context: 'gradeApi.fetchGrades', logErrors: true }
    );

    return validatedGrades;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Fetches grades for a specific course
 * 
 * @param courseId - The ID of the course
 * @returns Promise resolving to array of Grade objects for the course
 * 
 * @example
 * ```typescript
 * const courseGrades = await fetchCourseGrades('course-123');
 * ```
 */
export const fetchCourseGrades = async (courseId: string): Promise<Grade[]> => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const response = await api.get<ApiResponse<Grade[]>>(`/students/me/courses/${courseId}/grades`);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch course grades');
    }

    // Transform date strings to Date objects
    return response.data.data.map(grade => ({
      ...grade,
      date: new Date(grade.date),
    }));
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Fetches grade summary statistics for the authenticated student
 * 
 * @returns Promise resolving to GradeSummary object with aggregated statistics
 * 
 * @example
 * ```typescript
 * const summary = await fetchGradeSummary();
 * console.log(`Average: ${summary.averageScore}%`);
 * console.log(`Total grades: ${summary.totalGrades}`);
 * ```
 */
export const fetchGradeSummary = async (): Promise<GradeSummary> => {
  try {
    const response = await api.get<ApiResponse<GradeSummary>>('/students/me/grades/summary');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch grade summary');
    }

    // Transform date strings in recent grades
    const summary = response.data.data;
    return {
      ...summary,
      recentGrades: summary.recentGrades.map(grade => ({
        ...grade,
        date: new Date(grade.date),
      })),
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
 * Fetches GPA (Grade Point Average) for the authenticated student
 * 
 * @returns Promise resolving to GPA object with current and cumulative GPA
 * 
 * @example
 * ```typescript
 * const gpa = await fetchGPA();
 * console.log(`Current GPA: ${gpa.currentGPA.toFixed(2)}`);
 * console.log(`Cumulative GPA: ${gpa.cumulativeGPA.toFixed(2)}`);
 * ```
 */
export const fetchGPA = async (): Promise<GPA> => {
  try {
    const response = await api.get<ApiResponse<GPA>>('/students/me/gpa');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch GPA');
    }

    return response.data.data;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Fetches the complete academic transcript for the authenticated student
 * 
 * @returns Promise resolving to Transcript object with complete grade history
 * 
 * @example
 * ```typescript
 * const transcript = await fetchTranscript();
 * console.log(`Student: ${transcript.studentName}`);
 * console.log(`Cumulative GPA: ${transcript.cumulativeGPA.toFixed(2)}`);
 * console.log(`Total Credits: ${transcript.totalCredits}`);
 * ```
 */
export const fetchTranscript = async (): Promise<Transcript> => {
  try {
    const response = await api.get<ApiResponse<Transcript>>('/students/me/transcript');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch transcript');
    }

    return response.data.data;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Fetches grade distribution statistics
 * 
 * @returns Promise resolving to GradeDistribution object with counts per grade letter
 * 
 * @example
 * ```typescript
 * const distribution = await fetchGradeDistribution();
 * console.log(`A grades: ${distribution.A}`);
 * console.log(`B grades: ${distribution.B}`);
 * ```
 */
export const fetchGradeDistribution = async (): Promise<GradeDistribution> => {
  try {
    const response = await api.get<ApiResponse<GradeDistribution>>('/students/me/grades/distribution');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch grade distribution');
    }

    // Validate with Zod schema
    const validatedDistribution = validateDataOrFallback(
      GradeDistributionSchema,
      response.data.data,
      { A: 0, B: 0, C: 0, D: 0, F: 0 },
      { context: 'gradeApi.fetchGradeDistribution', logErrors: true }
    );

    return validatedDistribution;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Grade API service object containing all grade-related functions
 */
export const gradeApi = {
  fetchGrades,
  fetchCourseGrades,
  fetchGradeSummary,
  fetchGPA,
  fetchTranscript,
  fetchGradeDistribution,
};

export default gradeApi;
