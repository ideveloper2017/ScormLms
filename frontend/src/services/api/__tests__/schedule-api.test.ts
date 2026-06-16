import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleApi } from '../schedule-api';
import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import { ScheduleItem, WeeklySchedule } from '@/types/schedule.types';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/utils/error-handler');

describe('scheduleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchSchedule', () => {
    it('should fetch schedule with filters successfully', async () => {
      const mockSchedule: ScheduleItem[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          instructor: 'John Doe',
          room: '101',
          building: 'Main Building',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
          type: 'lecture',
          isOnline: false,
        },
        {
          id: '2',
          courseId: 'course-2',
          courseName: 'Physics 201',
          instructor: 'Jane Smith',
          room: '202',
          dayOfWeek: 2,
          startTime: '14:00',
          endTime: '15:30',
          type: 'lab',
          isOnline: false,
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockSchedule },
      });

      const result = await scheduleApi.fetchSchedule({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule', {
        params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      });
      expect(result).toEqual(mockSchedule);
    });

    it('should fetch schedule without filters', async () => {
      const mockSchedule: ScheduleItem[] = [];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockSchedule },
      });

      await scheduleApi.fetchSchedule();

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule', {
        params: undefined,
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(scheduleApi.fetchSchedule()).rejects.toThrow('Network error');
      expect(handleApiError).toHaveBeenCalledWith(error, {
        showToast: true,
        logToConsole: true,
      });
    });

    it('should handle unsuccessful response', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false, message: 'Failed to load schedule' },
      });

      await expect(scheduleApi.fetchSchedule()).rejects.toThrow('Failed to load schedule');
    });
  });

  describe('fetchTodaySchedule', () => {
    it('should fetch today\'s schedule successfully', async () => {
      const mockTodaySchedule: ScheduleItem[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          instructor: 'John Doe',
          room: '101',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
          type: 'lecture',
          isOnline: false,
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockTodaySchedule },
      });

      const result = await scheduleApi.fetchTodaySchedule();

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule/today');
      expect(result).toEqual(mockTodaySchedule);
    });

    it('should return empty array when no classes today', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: [] },
      });

      const result = await scheduleApi.fetchTodaySchedule();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch today\'s schedule');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(scheduleApi.fetchTodaySchedule()).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchWeekSchedule', () => {
    it('should fetch week schedule successfully', async () => {
      const mockWeekSchedule: ScheduleItem[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          instructor: 'John Doe',
          room: '101',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
          type: 'lecture',
          isOnline: false,
        },
        {
          id: '2',
          courseId: 'course-2',
          courseName: 'Physics 201',
          instructor: 'Jane Smith',
          room: '202',
          dayOfWeek: 3,
          startTime: '14:00',
          endTime: '15:30',
          type: 'lab',
          isOnline: true,
          meetingLink: 'https://zoom.us/j/123456789',
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockWeekSchedule },
      });

      const result = await scheduleApi.fetchWeekSchedule();

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule/week');
      expect(result).toEqual(mockWeekSchedule);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch week schedule');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(scheduleApi.fetchWeekSchedule()).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchUpcomingClasses', () => {
    it('should fetch upcoming classes successfully', async () => {
      const mockUpcomingClasses: ScheduleItem[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          instructor: 'John Doe',
          room: '101',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
          type: 'lecture',
          isOnline: false,
        },
        {
          id: '2',
          courseId: 'course-2',
          courseName: 'Physics 201',
          instructor: 'Jane Smith',
          room: '202',
          dayOfWeek: 2,
          startTime: '11:00',
          endTime: '12:30',
          type: 'seminar',
          isOnline: false,
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockUpcomingClasses },
      });

      const result = await scheduleApi.fetchUpcomingClasses();

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule/upcoming');
      expect(result).toEqual(mockUpcomingClasses);
    });

    it('should return empty array when no upcoming classes', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: [] },
      });

      const result = await scheduleApi.fetchUpcomingClasses();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch upcoming classes');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(scheduleApi.fetchUpcomingClasses()).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('fetchScheduleByWeek', () => {
    it('should fetch schedule by week number successfully', async () => {
      const mockWeeklySchedule: WeeklySchedule = {
        weekNumber: 10,
        startDate: new Date('2024-03-04'),
        endDate: new Date('2024-03-10'),
        items: [
          {
            id: '1',
            courseId: 'course-1',
            courseName: 'Math 101',
            instructor: 'John Doe',
            room: '101',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '10:30',
            type: 'lecture',
            isOnline: false,
          },
        ],
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockWeeklySchedule },
      });

      const result = await scheduleApi.fetchScheduleByWeek(10);

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule/week/10');
      expect(result).toEqual(mockWeeklySchedule);
      expect(result.weekNumber).toBe(10);
      expect(result.items).toHaveLength(1);
    });

    it('should handle different week numbers', async () => {
      const mockWeeklySchedule: WeeklySchedule = {
        weekNumber: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-07'),
        items: [],
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockWeeklySchedule },
      });

      await scheduleApi.fetchScheduleByWeek(1);

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule/week/1');
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch schedule by week');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(scheduleApi.fetchScheduleByWeek(10)).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('getUpcomingClass', () => {
    it('should get next upcoming class successfully', async () => {
      const mockNextClass: ScheduleItem = {
        id: '1',
        courseId: 'course-1',
        courseName: 'Math 101',
        instructor: 'John Doe',
        room: '101',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:30',
        type: 'lecture',
        isOnline: false,
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockNextClass },
      });

      const result = await scheduleApi.getUpcomingClass();

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule/next');
      expect(result).toEqual(mockNextClass);
    });

    it('should return null when no upcoming classes', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: null },
      });

      const result = await scheduleApi.getUpcomingClass();

      expect(result).toBeNull();
    });

    it('should return null when data is undefined', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true },
      });

      const result = await scheduleApi.getUpcomingClass();

      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to fetch upcoming class');
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(scheduleApi.getUpcomingClass()).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });

    it('should handle unsuccessful response', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: false, message: 'Failed to get upcoming class' },
      });

      await expect(scheduleApi.getUpcomingClass()).rejects.toThrow(
        'Failed to get upcoming class'
      );
    });
  });

  describe('ScheduleFilters', () => {
    it('should handle all filter parameters', async () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        courseId: 'course-1',
        dayOfWeek: 1,
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: [] },
      });

      await scheduleApi.fetchSchedule(filters);

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule', {
        params: filters,
      });
    });

    it('should handle partial filters', async () => {
      const filters = {
        courseId: 'course-1',
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: [] },
      });

      await scheduleApi.fetchSchedule(filters);

      expect(api.get).toHaveBeenCalledWith('/students/me/schedule', {
        params: filters,
      });
    });
  });

  describe('Online classes', () => {
    it('should handle online classes with meeting links', async () => {
      const mockOnlineClass: ScheduleItem = {
        id: '1',
        courseId: 'course-1',
        courseName: 'Math 101',
        instructor: 'John Doe',
        room: 'Online',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:30',
        type: 'lecture',
        isOnline: true,
        meetingLink: 'https://zoom.us/j/123456789',
      };

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: [mockOnlineClass] },
      });

      const result = await scheduleApi.fetchSchedule();

      expect(result[0].isOnline).toBe(true);
      expect(result[0].meetingLink).toBe('https://zoom.us/j/123456789');
    });
  });

  describe('Schedule item types', () => {
    it('should handle different class types', async () => {
      const mockSchedule: ScheduleItem[] = [
        {
          id: '1',
          courseId: 'course-1',
          courseName: 'Math 101',
          instructor: 'John Doe',
          room: '101',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
          type: 'lecture',
          isOnline: false,
        },
        {
          id: '2',
          courseId: 'course-2',
          courseName: 'Physics 201',
          instructor: 'Jane Smith',
          room: 'Lab 1',
          dayOfWeek: 2,
          startTime: '14:00',
          endTime: '16:00',
          type: 'lab',
          isOnline: false,
        },
        {
          id: '3',
          courseId: 'course-3',
          courseName: 'English 101',
          instructor: 'Bob Johnson',
          room: '202',
          dayOfWeek: 3,
          startTime: '11:00',
          endTime: '12:00',
          type: 'seminar',
          isOnline: false,
        },
        {
          id: '4',
          courseId: 'course-4',
          courseName: 'Programming 301',
          instructor: 'Alice Williams',
          room: 'Computer Lab',
          dayOfWeek: 4,
          startTime: '15:00',
          endTime: '16:30',
          type: 'tutorial',
          isOnline: false,
        },
      ];

      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockSchedule },
      });

      const result = await scheduleApi.fetchSchedule();

      expect(result).toHaveLength(4);
      expect(result[0].type).toBe('lecture');
      expect(result[1].type).toBe('lab');
      expect(result[2].type).toBe('seminar');
      expect(result[3].type).toBe('tutorial');
    });
  });
});
