/**
 * Attendance API Service
 * 
 * Handles all attendance-related API endpoints for the Student Portal.
 * Provides functions to fetch attendance records, course-specific attendance, and summary statistics.
 */

import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import { ApiResponse } from '@/types/api.types';
import { AttendanceRecord, AttendanceStats, CourseAttendance } from '@/types/attendance.types';
import {
  AttendanceRecordSchema,
  AttendanceStatsSchema,
} from '@/types/schemas/attendance.schema';
import { validateArrayPartial, validateDataOrFallback } from '@/utils/validation';

/**
 * Filter parameters for attendance queries
 */
export interface AttendanceFilters {
  courseId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'present' | 'absent' | 'late' | 'excused';
}

/**
 * Attendance summary containing aggregated statistics
 */
export interface AttendanceSummary {
  totalClasses: number;
  attended: number;
  absent: number;
  late: number;
  excused: number;
  attendancePercentage: number;
  byCourse: CourseAttendance[];
  recentRecords: AttendanceRecord[];
}

/**
 * Fetches all attendance records for the authenticated student with optional filters
 * 
 * @param filters - Optional filters to narrow down attendance results (date range, course, status)
 * @returns Promise resolving to array of AttendanceRecord objects
 * 
 * @example
 * ```typescript
 * // Fetch all attendance records
 * const records = await fetchAttendance();
 * 
 * // Fetch attendance for specific course
 * const courseAttendance = await fetchAttendance({ courseId: '123' });
 * 
 * // Fetch attendance for date range
 * const dateRangeAttendance = await fetchAttendance({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31'
 * });
 * ```
 */
export const fetchAttendance = async (filters?: AttendanceFilters): Promise<AttendanceRecord[]> => {
  try {
    const response = await api.get<ApiResponse<AttendanceRecord[]>>('/students/me/attendance', {
      params: filters,
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch attendance records');
    }

    // Transform date strings to Date objects
    const parsedData = response.data.data.map(record => ({
      ...record,
      date: new Date(record.date),
      checkInTime: record.checkInTime ? new Date(record.checkInTime) : undefined,
      checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined,
    }));

    // Validate array with element-level filtering (Requirement 14.4)
    const validatedRecords = validateArrayPartial(
      AttendanceRecordSchema,
      parsedData,
      { context: 'attendanceApi.fetchAttendance', logErrors: true }
    );

    return validatedRecords;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Fetches attendance records for a specific course
 * 
 * @param courseId - The ID of the course
 * @returns Promise resolving to array of AttendanceRecord objects for the course
 * 
 * @example
 * ```typescript
 * const courseAttendance = await fetchCourseAttendance('course-123');
 * ```
 */
export const fetchCourseAttendance = async (courseId: string): Promise<AttendanceRecord[]> => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const response = await api.get<ApiResponse<AttendanceRecord[]>>(
      `/students/me/courses/${courseId}/attendance`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch course attendance');
    }

    // Transform date strings to Date objects and validate array (Requirement 14.4)
    const parsedData = response.data.data.map(record => ({
      ...record,
      date: new Date(record.date),
      checkInTime: record.checkInTime ? new Date(record.checkInTime) : undefined,
      checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined,
    }));

    const validatedRecords = validateArrayPartial(
      AttendanceRecordSchema,
      parsedData,
      { context: 'attendanceApi.fetchCourseAttendance', logErrors: true }
    );

    return validatedRecords;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Fetches attendance summary statistics for the authenticated student
 * 
 * @returns Promise resolving to AttendanceSummary object with aggregated statistics
 * 
 * @example
 * ```typescript
 * const summary = await fetchAttendanceSummary();
 * console.log(`Attendance: ${summary.attendancePercentage}%`);
 * console.log(`Present: ${summary.attended}/${summary.totalClasses}`);
 * ```
 */
export const fetchAttendanceSummary = async (): Promise<AttendanceSummary> => {
  try {
    const response = await api.get<ApiResponse<AttendanceSummary>>('/students/me/attendance/summary');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch attendance summary');
    }

    // Transform date strings in recent records
    const summary = response.data.data;
    return {
      ...summary,
      recentRecords: summary.recentRecords.map(record => ({
        ...record,
        date: new Date(record.date),
        checkInTime: record.checkInTime ? new Date(record.checkInTime) : undefined,
        checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined,
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
 * Fetches attendance statistics for the authenticated student
 * 
 * @returns Promise resolving to AttendanceStats object with detailed statistics
 * 
 * @example
 * ```typescript
 * const stats = await fetchAttendanceStats();
 * console.log(`Total classes: ${stats.totalClasses}`);
 * console.log(`Attendance percentage: ${stats.attendancePercentage}%`);
 * ```
 */
export const fetchAttendanceStats = async (): Promise<AttendanceStats> => {
  try {
    const response = await api.get<ApiResponse<AttendanceStats>>('/students/me/attendance/stats');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch attendance statistics');
    }

    // Validate with Zod schema
    const validatedStats = validateDataOrFallback(
      AttendanceStatsSchema,
      response.data.data,
      {
        totalClasses: 0,
        attended: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendancePercentage: 0,
        byCourse: [],
      },
      { context: 'attendanceApi.fetchAttendanceStats', logErrors: true }
    );

    return validatedStats;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Calculates attendance percentage for overall or specific course
 * 
 * @param courseId - Optional course ID to calculate percentage for specific course
 * @returns Promise resolving to attendance percentage number (0-100)
 * 
 * @example
 * ```typescript
 * // Get overall attendance percentage
 * const overallPercentage = await calculateAttendancePercentage();
 * 
 * // Get course-specific attendance percentage
 * const coursePercentage = await calculateAttendancePercentage('course-123');
 * ```
 */
export const calculateAttendancePercentage = async (courseId?: string): Promise<number> => {
  try {
    const endpoint = courseId
      ? `/students/me/courses/${courseId}/attendance/percentage`
      : '/students/me/attendance/percentage';

    const response = await api.get<ApiResponse<{ percentage: number }>>(endpoint);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to calculate attendance percentage');
    }

    return response.data.data.percentage;
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      logToConsole: true,
    });
    throw error;
  }
};

/**
 * Attendance API service object containing all attendance-related functions
 */
export const attendanceApi = {
  fetchAttendance,
  fetchCourseAttendance,
  fetchAttendanceSummary,
  fetchAttendanceStats,
  calculateAttendancePercentage,
};

export default attendanceApi;
