import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosResponse } from 'axios';
import api from '@/lib/api';
import {
  fetchAttendance,
  fetchCourseAttendance,
  fetchAttendanceSummary,
  fetchAttendanceStats,
  calculateAttendancePercentage,
  attendanceApi,
} from '../attendance-api';
import { handleApiError } from '@/utils/error-handler';
import { AttendanceRecord, AttendanceStats } from '@/types/attendance.types';
import type { AttendanceSummary } from '../attendance-api';

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

describe('attendance-api service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAttendance', () => {
    it('should fetch all attendance records successfully', async () => {
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          date: '2024-01-15T08:00:00Z' as any,
          status: 'present',
          checkInTime: '2024-01-15T08:05:00Z' as any,
          checkOutTime: '2024-01-15T09:45:00Z' as any,
        },
        {
          id: '2',
          courseId: 'course-2',
          courseName: 'Physics 201',
          date: '2024-01-16T10:00:00Z' as any,
          status: 'late',
          reason: 'Traffic',
          checkInTime: '2024-01-16T10:15:00Z' as any,
        },
      ];

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockRecords,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchAttendance();

      expect(api.get).toHaveBeenCalledWith('/students/me/attendance', {
        params: undefined,
      });
      expect(result).toHaveLength(2);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[0].checkInTime).toBeInstanceOf(Date);
      expect(result[0].checkOutTime).toBeInstanceOf(Date);
      expect(result[0].courseName).toBe('Math 101');
      expect(result[1].status).toBe('late');
    });

    it('should fetch attendance with filters', async () => {
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
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'present' as const,
      };

      await fetchAttendance(filters);

      expect(api.get).toHaveBeenCalledWith('/students/me/attendance', {
        params: filters,
      });
    });

    it('should handle records without check times', async () => {
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          date: '2024-01-15T08:00:00Z' as any,
          status: 'absent',
          reason: 'Sick leave',
        },
      ];

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockRecords,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchAttendance();

      expect(result[0].checkInTime).toBeUndefined();
      expect(result[0].checkOutTime).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchAttendance()).rejects.toThrow('Network error');
      expect(handleApiError).toHaveBeenCalledWith(error, {
        showToast: true,
        logToConsole: true,
      });
    });

    it('should throw error when response is not successful', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: false,
          message: 'Failed to fetch attendance',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      await expect(fetchAttendance()).rejects.toThrow('Failed to fetch attendance');
    });
  });

  describe('fetchCourseAttendance', () => {
    it('should fetch course attendance successfully', async () => {
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          date: '2024-01-15T08:00:00Z' as any,
          status: 'present',
          checkInTime: '2024-01-15T08:05:00Z' as any,
        },
      ];

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockRecords,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchCourseAttendance('course-1');

      expect(api.get).toHaveBeenCalledWith('/students/me/courses/course-1/attendance');
      expect(result).toHaveLength(1);
      expect(result[0].courseId).toBe('course-1');
      expect(result[0].date).toBeInstanceOf(Date);
    });

    it('should throw error when courseId is not provided', async () => {
      await expect(fetchCourseAttendance('')).rejects.toThrow('Course ID is required');
    });

    it('should handle API errors', async () => {
      const error = new Error('Not found');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchCourseAttendance('course-1')).rejects.toThrow('Not found');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchAttendanceSummary', () => {
    it('should fetch attendance summary successfully', async () => {
      const mockSummary: AttendanceSummary = {
        totalClasses: 50,
        attended: 45,
        absent: 3,
        late: 2,
        excused: 0,
        attendancePercentage: 90,
        byCourse: [
          {
            courseId: 'course-1',
            courseName: 'Math 101',
            totalClasses: 25,
            attended: 23,
            percentage: 92,
          },
          {
            courseId: 'course-2',
            courseName: 'Physics 201',
            totalClasses: 25,
            attended: 22,
            percentage: 88,
          },
        ],
        recentRecords: [
          {
            id: '1',
            courseId: 'course-1',
            courseName: 'Math 101',
            date: '2024-01-15T08:00:00Z' as any,
            status: 'present',
            checkInTime: '2024-01-15T08:05:00Z' as any,
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

      const result = await fetchAttendanceSummary();

      expect(api.get).toHaveBeenCalledWith('/students/me/attendance/summary');
      expect(result.totalClasses).toBe(50);
      expect(result.attended).toBe(45);
      expect(result.attendancePercentage).toBe(90);
      expect(result.byCourse).toHaveLength(2);
      expect(result.recentRecords[0].date).toBeInstanceOf(Date);
    });

    it('should handle API errors', async () => {
      const error = new Error('Server error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchAttendanceSummary()).rejects.toThrow('Server error');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchAttendanceStats', () => {
    it('should fetch attendance statistics successfully', async () => {
      const mockStats: AttendanceStats = {
        totalClasses: 50,
        attended: 45,
        absent: 3,
        late: 2,
        excused: 0,
        attendancePercentage: 90,
        byCourse: [
          {
            courseId: 'course-1',
            courseName: 'Math 101',
            totalClasses: 25,
            attended: 23,
            percentage: 92,
          },
        ],
      };

      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: mockStats,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await fetchAttendanceStats();

      expect(api.get).toHaveBeenCalledWith('/students/me/attendance/stats');
      expect(result.totalClasses).toBe(50);
      expect(result.attendancePercentage).toBe(90);
      expect(result.byCourse).toHaveLength(1);
    });

    it('should handle API errors', async () => {
      const error = new Error('Unauthorized');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(fetchAttendanceStats()).rejects.toThrow('Unauthorized');
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('calculateAttendancePercentage', () => {
    it('should calculate overall attendance percentage successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: { percentage: 87.5 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await calculateAttendancePercentage();

      expect(api.get).toHaveBeenCalledWith('/students/me/attendance/percentage');
      expect(result).toBe(87.5);
    });

    it('should calculate course-specific attendance percentage successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: true,
          data: { percentage: 92.0 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await calculateAttendancePercentage('course-1');

      expect(api.get).toHaveBeenCalledWith('/students/me/courses/course-1/attendance/percentage');
      expect(result).toBe(92.0);
    });

    it('should handle API errors', async () => {
      const error = new Error('Server error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(calculateAttendancePercentage()).rejects.toThrow('Server error');
      expect(handleApiError).toHaveBeenCalled();
    });

    it('should throw error when response is not successful', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          success: false,
          message: 'Failed to calculate percentage',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      await expect(calculateAttendancePercentage()).rejects.toThrow('Failed to calculate percentage');
    });
  });

  describe('attendanceApi object', () => {
    it('should export all functions in attendanceApi object', () => {
      expect(attendanceApi).toHaveProperty('fetchAttendance');
      expect(attendanceApi).toHaveProperty('fetchCourseAttendance');
      expect(attendanceApi).toHaveProperty('fetchAttendanceSummary');
      expect(attendanceApi).toHaveProperty('fetchAttendanceStats');
      expect(attendanceApi).toHaveProperty('calculateAttendancePercentage');

      expect(typeof attendanceApi.fetchAttendance).toBe('function');
      expect(typeof attendanceApi.fetchCourseAttendance).toBe('function');
      expect(typeof attendanceApi.fetchAttendanceSummary).toBe('function');
      expect(typeof attendanceApi.fetchAttendanceStats).toBe('function');
      expect(typeof attendanceApi.calculateAttendancePercentage).toBe('function');
    });
  });
});
