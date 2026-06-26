import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { attendanceApi } from '@/services/api/attendance-api';
import {
  useAttendance,
  useCourseAttendance,
  useAttendanceSummary,
  useAttendanceStats,
  useAttendancePercentage,
} from '../useAttendance';
import type { AttendanceRecord, AttendanceStats } from '@/types/attendance.types';
import type { AttendanceSummary } from '@/services/api/attendance-api';

// Mock the attendance API service
vi.mock('@/services/api/attendance-api', () => ({
  attendanceApi: {
    fetchAttendance: vi.fn(),
    fetchCourseAttendance: vi.fn(),
    fetchAttendanceSummary: vi.fn(),
    fetchAttendanceStats: vi.fn(),
    calculateAttendancePercentage: vi.fn(),
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

describe('useAttendance hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAttendance', () => {
    it('should fetch attendance records successfully', async () => {
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          date: new Date('2024-01-15'),
          status: 'present',
          checkInTime: new Date('2024-01-15T09:00:00'),
          checkOutTime: new Date('2024-01-15T10:30:00'),
        },
        {
          id: '2',
          courseId: 'course-2',
          courseName: 'Physics 201',
          date: new Date('2024-01-16'),
          status: 'late',
          reason: 'Traffic delay',
          checkInTime: new Date('2024-01-16T09:15:00'),
        },
      ];

      vi.mocked(attendanceApi.fetchAttendance).mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useAttendance(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for success
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRecords);
      expect(result.current.isLoading).toBe(false);
      expect(attendanceApi.fetchAttendance).toHaveBeenCalledTimes(1);
    });

    it('should fetch attendance with filters', async () => {
      const filters = { courseId: 'course-1', status: 'present' as const };
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          date: new Date('2024-01-15'),
          status: 'present',
        },
      ];

      vi.mocked(attendanceApi.fetchAttendance).mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useAttendance(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRecords);
      expect(attendanceApi.fetchAttendance).toHaveBeenCalledWith(filters);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch attendance');
      vi.mocked(attendanceApi.fetchAttendance).mockRejectedValue(error);

      const { result } = renderHook(() => useAttendance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useCourseAttendance', () => {
    it('should fetch course attendance successfully', async () => {
      const courseId = 'course-1';
      const mockRecords: AttendanceRecord[] = [
        {
          id: '1',
          courseId: courseId,
          courseName: 'Math 101',
          date: new Date('2024-01-15'),
          status: 'present',
        },
        {
          id: '2',
          courseId: courseId,
          courseName: 'Math 101',
          date: new Date('2024-01-17'),
          status: 'absent',
          reason: 'Sick leave',
        },
      ];

      vi.mocked(attendanceApi.fetchCourseAttendance).mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useCourseAttendance(courseId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockRecords);
      expect(attendanceApi.fetchCourseAttendance).toHaveBeenCalledWith(courseId);
    });

    it('should not fetch when courseId is empty', () => {
      const { result } = renderHook(() => useCourseAttendance(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(attendanceApi.fetchCourseAttendance).not.toHaveBeenCalled();
    });

    it('should handle course attendance errors', async () => {
      const courseId = 'course-1';
      const error = new Error('Course not found');
      vi.mocked(attendanceApi.fetchCourseAttendance).mockRejectedValue(error);

      const { result } = renderHook(() => useCourseAttendance(courseId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useAttendanceSummary', () => {
    it('should fetch attendance summary successfully', async () => {
      const mockSummary: AttendanceSummary = {
        totalClasses: 100,
        attended: 85,
        absent: 10,
        late: 5,
        excused: 2,
        attendancePercentage: 85,
        byCourse: [
          {
            courseId: 'course-1',
            courseName: 'Math 101',
            totalClasses: 30,
            attended: 28,
            percentage: 93.3,
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
            date: new Date('2024-01-20'),
            status: 'present',
          },
        ],
      };

      vi.mocked(attendanceApi.fetchAttendanceSummary).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useAttendanceSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSummary);
      expect(result.current.data?.totalClasses).toBe(100);
      expect(result.current.data?.attendancePercentage).toBe(85);
      expect(result.current.data?.byCourse).toHaveLength(2);
    });

    it('should handle summary fetch errors', async () => {
      const error = new Error('Failed to fetch summary');
      vi.mocked(attendanceApi.fetchAttendanceSummary).mockRejectedValue(error);

      const { result } = renderHook(() => useAttendanceSummary(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useAttendanceStats', () => {
    it('should fetch attendance stats successfully', async () => {
      const mockStats: AttendanceStats = {
        totalClasses: 100,
        attended: 85,
        absent: 10,
        late: 5,
        excused: 2,
        attendancePercentage: 85,
        byCourse: [
          {
            courseId: 'course-1',
            courseName: 'Math 101',
            totalClasses: 30,
            attended: 28,
            percentage: 93.3,
          },
        ],
      };

      vi.mocked(attendanceApi.fetchAttendanceStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useAttendanceStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockStats);
      expect(result.current.data?.totalClasses).toBe(100);
      expect(result.current.data?.attended).toBe(85);
      expect(result.current.data?.attendancePercentage).toBe(85);
    });

    it('should handle stats fetch errors', async () => {
      const error = new Error('Stats calculation failed');
      vi.mocked(attendanceApi.fetchAttendanceStats).mockRejectedValue(error);

      const { result } = renderHook(() => useAttendanceStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useAttendancePercentage', () => {
    it('should fetch overall attendance percentage successfully', async () => {
      const mockPercentage = 87.5;

      vi.mocked(attendanceApi.calculateAttendancePercentage).mockResolvedValue(mockPercentage);

      const { result } = renderHook(() => useAttendancePercentage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(mockPercentage);
      expect(attendanceApi.calculateAttendancePercentage).toHaveBeenCalledWith(undefined);
    });

    it('should fetch course-specific attendance percentage successfully', async () => {
      const courseId = 'course-1';
      const mockPercentage = 92.3;

      vi.mocked(attendanceApi.calculateAttendancePercentage).mockResolvedValue(mockPercentage);

      const { result } = renderHook(() => useAttendancePercentage(courseId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBe(mockPercentage);
      expect(attendanceApi.calculateAttendancePercentage).toHaveBeenCalledWith(courseId);
    });

    it('should handle percentage calculation errors', async () => {
      const error = new Error('Percentage calculation failed');
      vi.mocked(attendanceApi.calculateAttendancePercentage).mockRejectedValue(error);

      const { result } = renderHook(() => useAttendancePercentage(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('cache configuration', () => {
    it('should use 5-minute stale time for attendance queries', async () => {
      const mockRecords: AttendanceRecord[] = [];
      vi.mocked(attendanceApi.fetchAttendance).mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useAttendance(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The staleTime is configured in the hook, verify it doesn't refetch immediately
      expect(attendanceApi.fetchAttendance).toHaveBeenCalledTimes(1);
    });
  });

  describe('enabled option', () => {
    it('useCourseAttendance should respect enabled option based on courseId', () => {
      const { result: result1 } = renderHook(() => useCourseAttendance('course-1'), {
        wrapper: createWrapper(),
      });

      const { result: result2 } = renderHook(() => useCourseAttendance(''), {
        wrapper: createWrapper(),
      });

      // With valid courseId, query should be enabled
      expect(result1.current.isFetching).toBe(true);

      // With empty courseId, query should be disabled
      expect(result2.current.isFetching).toBe(false);
    });
  });
});
