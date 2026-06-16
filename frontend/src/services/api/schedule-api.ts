import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import { ScheduleItem, WeeklySchedule } from '@/types/schedule.types';
import { ApiResponse } from '@/lib/api';
import {
  ScheduleItemSchema,
  WeeklyScheduleSchema,
} from '@/types/schemas/schedule.schema';
import { validateArrayPartial, validateDataOrThrow } from '@/utils/validation';

/**
 * Schedule filters for querying schedule data
 */
export interface ScheduleFilters {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  courseId?: string;
  dayOfWeek?: number;
}

/**
 * Schedule API service for student class schedule operations
 * Handles viewing class schedules, today's classes, weekly view, and upcoming sessions
 */
export const scheduleApi = {
  /**
   * Fetches the complete schedule for the authenticated student
   * Supports optional date filters to narrow down results
   * 
   * @param filters - Optional filters for date range, course, or day of week
   * @returns Promise resolving to array of schedule items
   * 
   * @example
   * ```typescript
   * const schedule = await scheduleApi.fetchSchedule({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  fetchSchedule: async (filters?: ScheduleFilters): Promise<ScheduleItem[]> => {
    try {
      const response = await api.get<ApiResponse<ScheduleItem[]>>('/students/me/schedule', {
        params: filters,
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch schedule');
      }

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedSchedule = validateArrayPartial(
        ScheduleItemSchema,
        response.data.data,
        { context: 'scheduleApi.fetchSchedule', logErrors: true }
      );

      return validatedSchedule;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches today's schedule for the authenticated student
   * Returns all classes scheduled for the current day
   * 
   * @returns Promise resolving to array of today's schedule items
   * 
   * @example
   * ```typescript
   * const todayClasses = await scheduleApi.fetchTodaySchedule();
   * console.log(`You have ${todayClasses.length} classes today`);
   * ```
   */
  fetchTodaySchedule: async (): Promise<ScheduleItem[]> => {
    try {
      const response = await api.get<ApiResponse<ScheduleItem[]>>('/students/me/schedule/today');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch today\'s schedule');
      }

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedSchedule = validateArrayPartial(
        ScheduleItemSchema,
        response.data.data,
        { context: 'scheduleApi.fetchTodaySchedule', logErrors: true }
      );

      return validatedSchedule;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches the current week's schedule for the authenticated student
   * Returns all classes scheduled for the current week (Monday-Sunday)
   * 
   * @returns Promise resolving to array of this week's schedule items
   * 
   * @example
   * ```typescript
   * const weekSchedule = await scheduleApi.fetchWeekSchedule();
   * console.log(`You have ${weekSchedule.length} classes this week`);
   * ```
   */
  fetchWeekSchedule: async (): Promise<ScheduleItem[]> => {
    try {
      const response = await api.get<ApiResponse<ScheduleItem[]>>('/students/me/schedule/week');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch week schedule');
      }

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedSchedule = validateArrayPartial(
        ScheduleItemSchema,
        response.data.data,
        { context: 'scheduleApi.fetchWeekSchedule', logErrors: true }
      );

      return validatedSchedule;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches upcoming classes for the authenticated student
   * Returns the next scheduled classes in chronological order
   * 
   * @returns Promise resolving to array of upcoming schedule items
   * 
   * @example
   * ```typescript
   * const upcomingClasses = await scheduleApi.fetchUpcomingClasses();
   * if (upcomingClasses.length > 0) {
   *   console.log(`Next class: ${upcomingClasses[0].courseName} at ${upcomingClasses[0].startTime}`);
   * }
   * ```
   */
  fetchUpcomingClasses: async (): Promise<ScheduleItem[]> => {
    try {
      const response = await api.get<ApiResponse<ScheduleItem[]>>('/students/me/schedule/upcoming');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch upcoming classes');
      }

      // Validate array with element-level filtering (Requirement 14.4)
      const validatedSchedule = validateArrayPartial(
        ScheduleItemSchema,
        response.data.data,
        { context: 'scheduleApi.fetchUpcomingClasses', logErrors: true }
      );

      return validatedSchedule;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Fetches schedule for a specific week number
   * Week numbers follow ISO 8601 standard (week 1 contains first Thursday of the year)
   * 
   * @param weekNumber - The ISO week number (1-53)
   * @returns Promise resolving to weekly schedule data with date range and items
   * 
   * @example
   * ```typescript
   * const week10Schedule = await scheduleApi.fetchScheduleByWeek(10);
   * console.log(`Week ${week10Schedule.weekNumber}: ${week10Schedule.startDate} to ${week10Schedule.endDate}`);
   * ```
   */
  fetchScheduleByWeek: async (weekNumber: number): Promise<WeeklySchedule> => {
    try {
      const response = await api.get<ApiResponse<WeeklySchedule>>(
        `/students/me/schedule/week/${weekNumber}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch schedule by week');
      }

      // Validate with Zod schema
      const validatedWeeklySchedule = validateDataOrThrow(
        WeeklyScheduleSchema,
        response.data.data,
        { context: 'scheduleApi.fetchScheduleByWeek', logErrors: true }
      );

      return validatedWeeklySchedule;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },

  /**
   * Gets the next upcoming class for the authenticated student
   * Returns the single next scheduled class based on current date and time
   * 
   * @returns Promise resolving to the next schedule item, or null if no upcoming classes
   * 
   * @example
   * ```typescript
   * const nextClass = await scheduleApi.getUpcomingClass();
   * if (nextClass) {
   *   console.log(`Next class: ${nextClass.courseName} in room ${nextClass.room}`);
   * } else {
   *   console.log('No upcoming classes');
   * }
   * ```
   */
  getUpcomingClass: async (): Promise<ScheduleItem | null> => {
    try {
      const response = await api.get<ApiResponse<ScheduleItem | null>>(
        '/students/me/schedule/next'
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch upcoming class');
      }

      return response.data.data || null;
    } catch (error) {
      handleApiError(error, {
        showToast: true,
        logToConsole: true,
      });
      throw error;
    }
  },
};
