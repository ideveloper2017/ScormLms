/**
 * Dashboard React Query Hooks
 * 
 * Custom hooks for fetching dashboard data using React Query.
 * Implements caching, loading states, and error handling for:
 * - Dashboard statistics
 * - Recent courses
 * - Upcoming assignments
 * - Upcoming tests
 * - Recent activity
 * - Notification summary
 */

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import {
  fetchDashboardStats,
  fetchRecentCourses,
  fetchUpcomingAssignments,
  fetchUpcomingTests,
  fetchRecentActivity,
  fetchNotificationSummary,
  type NotificationSummary,
} from '@/services/api/dashboard-api';
import type { DashboardStats } from '@/types/dashboard.types';
import type { Course } from '@/types/course.types';
import type { Assignment } from '@/types/assignment.types';
import type { Test } from '@/types/test.types';
import type { ActivityItem } from '@/types/dashboard.types';

/**
 * Cache configuration for dashboard data
 * - staleTime: How long data is considered fresh (5 minutes)
 * - cacheTime: How long unused data stays in cache (10 minutes)
 */
const DASHBOARD_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
};

/**
 * Fetches dashboard statistics for the authenticated student
 * 
 * @returns React Query result containing dashboard stats
 * 
 * @example
 * ```tsx
 * function DashboardStats() {
 *   const { data: stats, isLoading, error } = useDashboardStats();
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <div>
 *       <p>Active Courses: {stats.activeCourses}</p>
 *       <p>Pending Assignments: {stats.pendingAssignments}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useDashboardStats = () => {
  return useQuery<DashboardStats, Error>({
    queryKey: qk.dashboard.stats(),
    queryFn: fetchDashboardStats,
    staleTime: DASHBOARD_CACHE_CONFIG.staleTime,
    cacheTime: DASHBOARD_CACHE_CONFIG.cacheTime,
  });
};

/**
 * Fetches recent/active courses for dashboard display
 * 
 * @returns React Query result containing list of recent courses
 * 
 * @example
 * ```tsx
 * function RecentCourses() {
 *   const { data: courses, isLoading, error } = useRecentCourses();
 *   
 *   if (isLoading) return <CardSkeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <div>
 *       {courses?.map(course => (
 *         <CourseCard key={course.id} course={course} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useRecentCourses = () => {
  return useQuery<Course[], Error>({
    queryKey: qk.dashboard.root().concat('recentCourses'),
    queryFn: fetchRecentCourses,
    staleTime: DASHBOARD_CACHE_CONFIG.staleTime,
    cacheTime: DASHBOARD_CACHE_CONFIG.cacheTime,
  });
};

/**
 * Fetches upcoming assignments for dashboard display
 * 
 * @returns React Query result containing list of upcoming assignments
 * 
 * @example
 * ```tsx
 * function UpcomingAssignments() {
 *   const { data: assignments, isLoading, error } = useUpcomingAssignments();
 *   
 *   if (isLoading) return <ListSkeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <ul>
 *       {assignments?.map(assignment => (
 *         <li key={assignment.id}>{assignment.title} - Due: {assignment.dueDate}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export const useUpcomingAssignments = () => {
  return useQuery<Assignment[], Error>({
    queryKey: qk.dashboard.root().concat('upcomingAssignments'),
    queryFn: fetchUpcomingAssignments,
    staleTime: DASHBOARD_CACHE_CONFIG.staleTime,
    cacheTime: DASHBOARD_CACHE_CONFIG.cacheTime,
  });
};

/**
 * Fetches upcoming tests for dashboard display
 * 
 * @returns React Query result containing list of upcoming tests
 * 
 * @example
 * ```tsx
 * function UpcomingTests() {
 *   const { data: tests, isLoading, error } = useUpcomingTests();
 *   
 *   if (isLoading) return <ListSkeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <ul>
 *       {tests?.map(test => (
 *         <li key={test.id}>{test.title} - {test.date}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export const useUpcomingTests = () => {
  return useQuery<Test[], Error>({
    queryKey: qk.dashboard.root().concat('upcomingTests'),
    queryFn: fetchUpcomingTests,
    staleTime: DASHBOARD_CACHE_CONFIG.staleTime,
    cacheTime: DASHBOARD_CACHE_CONFIG.cacheTime,
  });
};

/**
 * Fetches recent activity for the student
 * 
 * @returns React Query result containing list of recent activity items
 * 
 * @example
 * ```tsx
 * function RecentActivity() {
 *   const { data: activity, isLoading, error } = useRecentActivity();
 *   
 *   if (isLoading) return <ListSkeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <ul>
 *       {activity?.map(item => (
 *         <li key={item.id}>
 *           <span>{item.type}</span>: {item.title}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export const useRecentActivity = () => {
  return useQuery<ActivityItem[], Error>({
    queryKey: qk.dashboard.root().concat('recentActivity'),
    queryFn: fetchRecentActivity,
    staleTime: DASHBOARD_CACHE_CONFIG.staleTime,
    cacheTime: DASHBOARD_CACHE_CONFIG.cacheTime,
  });
};

/**
 * Fetches notification summary for dashboard display
 * 
 * @returns React Query result containing notification summary
 * 
 * @example
 * ```tsx
 * function NotificationBadge() {
 *   const { data: summary, isLoading } = useNotificationSummary();
 *   
 *   if (isLoading) return <Skeleton />;
 *   
 *   return (
 *     <div>
 *       <Badge count={summary?.unreadCount} />
 *       {summary?.urgent > 0 && <UrgentIndicator count={summary.urgent} />}
 *     </div>
 *   );
 * }
 * ```
 */
export const useNotificationSummary = () => {
  return useQuery<NotificationSummary, Error>({
    queryKey: qk.dashboard.root().concat('notificationSummary'),
    queryFn: fetchNotificationSummary,
    staleTime: DASHBOARD_CACHE_CONFIG.staleTime,
    cacheTime: DASHBOARD_CACHE_CONFIG.cacheTime,
  });
};
