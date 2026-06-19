/**
 * Dashboard API Service
 * 
 * Provides functions for fetching dashboard-related data including:
 * - Student dashboard statistics
 * - Recent courses
 * - Upcoming assignments
 * - Upcoming tests
 * - Recent activity
 * - Notification summary
 */

import api from '@/lib/api';
import { handleApiError } from '@/utils/error-handler';
import { DashboardStats } from '@/types/dashboard.types';
import { Course } from '@/types/course.types';
import { Assignment } from '@/types/assignment.types';
import { Test } from '@/types/test.types';
import { ActivityItem } from '@/types/dashboard.types';
import {
  DashboardStatsSchema,
  ActivityArraySchema,
  CourseSchema,
  AssignmentSchema,
  TestSchema,
  ActivityItemSchema,
} from '@/types/schemas';
import { validateDataOrFallback, validateArrayPartial } from '@/utils/validation';


/**
 * Notification summary for dashboard display
 */
export interface NotificationSummary {
  unreadCount: number;
  urgent: number;
  recent: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: Date;
  }>;
}

/**
 * Fetches dashboard statistics for the authenticated student
 * 
 * @returns Promise<DashboardStats> - Dashboard statistics including active courses,
 *                                    pending assignments, upcoming tests, etc.
 * @throws Error if the request fails
 * 
 * @example
 * ```typescript
 * try {
 *   const stats = await fetchDashboardStats();
 *   console.log(`Active courses: ${stats.activeCourses}`);
 * } catch (error) {
 *   console.error('Failed to fetch dashboard stats', error);
 * }
 * ```
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/students/me/dashboard/stats');
  const data = response.data.data || response.data;
  return validateDataOrFallback(
    DashboardStatsSchema, data,
    { activeCourses: 0, completedCourses: 0, pendingAssignments: 0, upcomingTests: 0, averageGrade: 0, attendancePercentage: 0, gpa: 0, totalCredits: 0, learningStreak: 0 },
    { context: 'dashboardApi.fetchDashboardStats', logErrors: true }
  );
};

/**
 * Fetches recent courses for the student's dashboard
 * 
 * @returns Promise<Course[]> - List of recent/active courses
 * @throws Error if the request fails
 * 
 * @example
 * ```typescript
 * const courses = await fetchRecentCourses();
 * courses.forEach(course => console.log(course.title));
 * ```
 */
export const fetchRecentCourses = async (): Promise<Course[]> => {
  const response = await api.get('/students/me/dashboard/courses');
  const data = response.data.data || response.data;
  return validateArrayPartial(CourseSchema, data, { context: 'dashboardApi.fetchRecentCourses', logErrors: true });
};

/**
 * Fetches upcoming assignments for the student
 * 
 * @returns Promise<Assignment[]> - List of upcoming assignments sorted by due date
 * @throws Error if the request fails
 * 
 * @example
 * ```typescript
 * const assignments = await fetchUpcomingAssignments();
 * console.log(`You have ${assignments.length} upcoming assignments`);
 * ```
 */
export const fetchUpcomingAssignments = async (): Promise<Assignment[]> => {
  const response = await api.get('/students/me/dashboard/assignments');
  const data = response.data.data || response.data;
  return validateArrayPartial(AssignmentSchema, data, { context: 'dashboardApi.fetchUpcomingAssignments', logErrors: true });
};

/**
 * Fetches upcoming tests for the student
 * 
 * @returns Promise<Test[]> - List of upcoming tests sorted by date
 * @throws Error if the request fails
 * 
 * @example
 * ```typescript
 * const tests = await fetchUpcomingTests();
 * tests.forEach(test => console.log(`${test.title} on ${test.date}`));
 * ```
 */
export const fetchUpcomingTests = async (): Promise<Test[]> => {
  const response = await api.get('/students/me/dashboard/tests');
  const data = response.data.data || response.data;
  return validateArrayPartial(TestSchema, data, { context: 'dashboardApi.fetchUpcomingTests', logErrors: true });
};

/**
 * Fetches recent activity for the student
 * 
 * @returns Promise<ActivityItem[]> - List of recent activity items
 * @throws Error if the request fails
 * 
 * @example
 * ```typescript
 * const activity = await fetchRecentActivity();
 * activity.forEach(item => console.log(`${item.type}: ${item.title}`));
 * ```
 */
export const fetchRecentActivity = async (): Promise<ActivityItem[]> => {
  const response = await api.get('/students/me/dashboard/activity');
  const data = response.data.data || response.data;
  return validateArrayPartial(ActivityItemSchema, data, { context: 'dashboardApi.fetchRecentActivity', logErrors: true });
};

/**
 * Fetches notification summary for the dashboard
 * 
 * @returns Promise<NotificationSummary> - Summary of notifications including
 *                                         unread count, urgent count, and recent items
 * @throws Error if the request fails
 * 
 * @example
 * ```typescript
 * const summary = await fetchNotificationSummary();
 * console.log(`You have ${summary.unreadCount} unread notifications`);
 * ```
 */
export const fetchNotificationSummary = async (): Promise<NotificationSummary> => {
  const response = await api.get('/students/me/dashboard/notifications');
  return response.data.data || response.data;
};

/**
 * Dashboard API object grouping all dashboard-related API functions
 */
export const dashboardApi = {
  fetchDashboardStats,
  fetchRecentCourses,
  fetchUpcomingAssignments,
  fetchUpcomingTests,
  fetchRecentActivity,
  fetchNotificationSummary,
};

export default dashboardApi;
