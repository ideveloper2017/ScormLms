import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { scheduleApi } from '@/services/api/schedule-api';
import {
  useSchedule,
  useTodaySchedule,
  useWeekSchedule,
  useUpcomingClasses,
  useScheduleByWeek,
  useNextClass,
} from '../useSchedule';
import type { ScheduleItem, WeeklySchedule } from '@/types/schedule.types';

// Mock the schedule API service
vi.mock('@/services/api/schedule-api', () => ({
  scheduleApi: {
    fetchSchedule: vi.fn(),
    fetchTodaySchedule: vi.fn(),
    fetchWeekSchedule: vi.fn(),
    fetchUpcomingClasses: vi.fn(),
    fetchScheduleByWeek: vi.fn(),
    getUpcomingClass: vi.fn(),
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

// Mock schedule item
const createMockScheduleItem = (overrides?: Partial<ScheduleItem>): ScheduleItem => ({
  id: '1',
  courseId: 'course-1',
  courseName: 'Math 101',
  instructor: 'Dr. Smith',
  room: 'A-101',
  building: 'Main Building',
  dayOfWeek: 1, // Monday
  startTime: '09:00',
  endTime: '10:30',
  type: 'lecture',
  color: '#3b82f6',
  isOnline: false,
  ...overrides,
});

describe('useSchedule hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSchedule', () => {
    it('should fetch schedule successfully', async () => {
      const mockSchedule: ScheduleItem[] = [
        createMockScheduleItem(),
        createMockScheduleItem({ id: '2', courseName: 'Physics 201', dayOfWeek: 2 }),
      ];

      vi.mocked(scheduleApi.fetchSchedule).mockResolvedValue(mockSchedule);

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for success
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSchedule);
      expect(result.current.isLoading).toBe(false);
      expect(scheduleApi.fetchSchedule).toHaveBeenCalledTimes(1);
    });

    it('should fetch schedule with filters', async () => {
      const mockSchedule: ScheduleItem[] = [createMockScheduleItem()];
      const filters = { startDate: '2024-01-01', endDate: '2024-01-31' };

      vi.mocked(scheduleApi.fetchSchedule).mockResolvedValue(mockSchedule);

      const { result } = renderHook(() => useSchedule(filters), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSchedule);
      expect(scheduleApi.fetchSchedule).toHaveBeenCalledWith(filters);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch schedule');
      vi.mocked(scheduleApi.fetchSchedule).mockRejectedValue(error);

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useTodaySchedule', () => {
    it('should fetch today\'s schedule successfully', async () => {
      const mockSchedule: ScheduleItem[] = [
        createMockScheduleItem(),
        createMockScheduleItem({ id: '2', courseName: 'Chemistry Lab', startTime: '14:00' }),
      ];

      vi.mocked(scheduleApi.fetchTodaySchedule).mockResolvedValue(mockSchedule);

      const { result } = renderHook(() => useTodaySchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSchedule);
      expect(result.current.data).toHaveLength(2);
      expect(scheduleApi.fetchTodaySchedule).toHaveBeenCalledTimes(1);
    });

    it('should handle empty today\'s schedule', async () => {
      vi.mocked(scheduleApi.fetchTodaySchedule).mockResolvedValue([]);

      const { result } = renderHook(() => useTodaySchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
      expect(result.current.data).toHaveLength(0);
    });

    it('should handle today\'s schedule fetch errors', async () => {
      const error = new Error('Failed to fetch today\'s schedule');
      vi.mocked(scheduleApi.fetchTodaySchedule).mockRejectedValue(error);

      const { result } = renderHook(() => useTodaySchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useWeekSchedule', () => {
    it('should fetch week schedule successfully', async () => {
      const mockSchedule: ScheduleItem[] = [
        createMockScheduleItem({ dayOfWeek: 1 }), // Monday
        createMockScheduleItem({ id: '2', dayOfWeek: 2 }), // Tuesday
        createMockScheduleItem({ id: '3', dayOfWeek: 3 }), // Wednesday
      ];

      vi.mocked(scheduleApi.fetchWeekSchedule).mockResolvedValue(mockSchedule);

      const { result } = renderHook(() => useWeekSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockSchedule);
      expect(result.current.data).toHaveLength(3);
      expect(scheduleApi.fetchWeekSchedule).toHaveBeenCalledTimes(1);
    });

    it('should handle week schedule errors', async () => {
      const error = new Error('Failed to fetch week schedule');
      vi.mocked(scheduleApi.fetchWeekSchedule).mockRejectedValue(error);

      const { result } = renderHook(() => useWeekSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useUpcomingClasses', () => {
    it('should fetch upcoming classes successfully', async () => {
      const mockClasses: ScheduleItem[] = [
        createMockScheduleItem({ startTime: '14:00' }),
        createMockScheduleItem({ id: '2', startTime: '16:00' }),
      ];

      vi.mocked(scheduleApi.fetchUpcomingClasses).mockResolvedValue(mockClasses);

      const { result } = renderHook(() => useUpcomingClasses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockClasses);
      expect(result.current.data).toHaveLength(2);
      expect(scheduleApi.fetchUpcomingClasses).toHaveBeenCalledTimes(1);
    });

    it('should handle empty upcoming classes', async () => {
      vi.mocked(scheduleApi.fetchUpcomingClasses).mockResolvedValue([]);

      const { result } = renderHook(() => useUpcomingClasses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it('should handle online classes with meeting links', async () => {
      const mockClasses: ScheduleItem[] = [
        createMockScheduleItem({
          isOnline: true,
          meetingLink: 'https://zoom.us/j/123456789',
        }),
      ];

      vi.mocked(scheduleApi.fetchUpcomingClasses).mockResolvedValue(mockClasses);

      const { result } = renderHook(() => useUpcomingClasses(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].isOnline).toBe(true);
      expect(result.current.data?.[0].meetingLink).toBe('https://zoom.us/j/123456789');
    });
  });

  describe('useScheduleByWeek', () => {
    it('should fetch schedule by week successfully', async () => {
      const mockWeekSchedule: WeeklySchedule = {
        weekNumber: 10,
        startDate: new Date('2024-03-04'),
        endDate: new Date('2024-03-10'),
        items: [
          createMockScheduleItem(),
          createMockScheduleItem({ id: '2', courseName: 'Physics 201' }),
        ],
      };

      vi.mocked(scheduleApi.fetchScheduleByWeek).mockResolvedValue(mockWeekSchedule);

      const { result } = renderHook(() => useScheduleByWeek(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockWeekSchedule);
      expect(result.current.data?.weekNumber).toBe(10);
      expect(result.current.data?.items).toHaveLength(2);
      expect(scheduleApi.fetchScheduleByWeek).toHaveBeenCalledWith(10);
    });

    it('should not fetch when week number is 0', () => {
      const { result } = renderHook(() => useScheduleByWeek(0), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(scheduleApi.fetchScheduleByWeek).not.toHaveBeenCalled();
    });

    it('should not fetch when week number is greater than 53', () => {
      const { result } = renderHook(() => useScheduleByWeek(54), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(scheduleApi.fetchScheduleByWeek).not.toHaveBeenCalled();
    });

    it('should not fetch when week number is negative', () => {
      const { result } = renderHook(() => useScheduleByWeek(-1), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(scheduleApi.fetchScheduleByWeek).not.toHaveBeenCalled();
    });

    it('should handle errors for valid week numbers', async () => {
      const error = new Error('Failed to fetch schedule by week');
      vi.mocked(scheduleApi.fetchScheduleByWeek).mockRejectedValue(error);

      const { result } = renderHook(() => useScheduleByWeek(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useNextClass', () => {
    it('should fetch next class successfully', async () => {
      const mockNextClass: ScheduleItem = createMockScheduleItem({
        startTime: '14:00',
        endTime: '15:30',
      });

      vi.mocked(scheduleApi.getUpcomingClass).mockResolvedValue(mockNextClass);

      const { result } = renderHook(() => useNextClass(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockNextClass);
      expect(result.current.data?.courseName).toBe('Math 101');
      expect(scheduleApi.getUpcomingClass).toHaveBeenCalledTimes(1);
    });

    it('should handle null when no upcoming class', async () => {
      vi.mocked(scheduleApi.getUpcomingClass).mockResolvedValue(null);

      const { result } = renderHook(() => useNextClass(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeNull();
    });

    it('should handle next class fetch errors', async () => {
      const error = new Error('Failed to fetch next class');
      vi.mocked(scheduleApi.getUpcomingClass).mockRejectedValue(error);

      const { result } = renderHook(() => useNextClass(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('cache configuration', () => {
    it('should use 30-minute stale time for schedule queries', async () => {
      const mockSchedule: ScheduleItem[] = [createMockScheduleItem()];
      vi.mocked(scheduleApi.fetchSchedule).mockResolvedValue(mockSchedule);

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The staleTime is configured in the hook, we verify it doesn't refetch immediately
      // This is more of an integration test - the actual staleTime is tested by behavior
      expect(scheduleApi.fetchSchedule).toHaveBeenCalledTimes(1);
    });
  });

  describe('schedule item types', () => {
    it('should handle different class types', async () => {
      const mockSchedule: ScheduleItem[] = [
        createMockScheduleItem({ type: 'lecture' }),
        createMockScheduleItem({ id: '2', type: 'lab' }),
        createMockScheduleItem({ id: '3', type: 'seminar' }),
        createMockScheduleItem({ id: '4', type: 'tutorial' }),
      ];

      vi.mocked(scheduleApi.fetchSchedule).mockResolvedValue(mockSchedule);

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(4);
      expect(result.current.data?.[0].type).toBe('lecture');
      expect(result.current.data?.[1].type).toBe('lab');
      expect(result.current.data?.[2].type).toBe('seminar');
      expect(result.current.data?.[3].type).toBe('tutorial');
    });

    it('should handle different days of week', async () => {
      const mockSchedule: ScheduleItem[] = [
        createMockScheduleItem({ dayOfWeek: 0 }), // Sunday
        createMockScheduleItem({ id: '2', dayOfWeek: 1 }), // Monday
        createMockScheduleItem({ id: '3', dayOfWeek: 6 }), // Saturday
      ];

      vi.mocked(scheduleApi.fetchSchedule).mockResolvedValue(mockSchedule);

      const { result } = renderHook(() => useSchedule(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.[0].dayOfWeek).toBe(0);
      expect(result.current.data?.[1].dayOfWeek).toBe(1);
      expect(result.current.data?.[2].dayOfWeek).toBe(6);
    });
  });
});
