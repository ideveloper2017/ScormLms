/**
 * React Query hooks for Attendance management
 * 
 * Provides hooks for fetching attendance records, course-specific attendance, 
 * and attendance summaries. All hooks use React Query for caching, loading states, 
 * and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { 
  attendanceApi, 
  AttendanceFilters, 
  AttendanceSummary 
} from '@/services/api/attendance-api';
import type { AttendanceRecord, AttendanceStats } from '@/types/attendance.types';

/**
 * Hook to fetch all attendance records for the authenticated student with optional filters
 * 
 * @param filters - Optional filters to narrow down attendance results (courseId, date range, status)
 * @returns Query result with attendance records array, loading state, and error state
 * 
 * @example
 * ```tsx
 * function AttendanceList() {
 *   const { data: records, isLoading, error } = useAttendance();
 *   
 *   if (isLoading) return <ListSkeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <div>
 *       {records?.map(record => (
 *         <div key={record.id}>
 *           {record.courseName} - {record.status} - {record.date.toLocaleDateString()}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * 
 * // With filters
 * function FilteredAttendance() {
 *   const { data } = useAttendance({ 
 *     courseId: 'course-123',
 *     status: 'present' 
 *   });
 *   
 *   return <div>{data?.length} present records</div>;
 * }
 * ```
 */
export const useAttendance = (filters?: AttendanceFilters) => {
  return useQuery<AttendanceRecord[], Error>({
    queryKey: qk.attendance.list(),
    queryFn: () => attendanceApi.fetchAttendance(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - attendance is relatively stable
  });
};

/**
 * Hook to fetch attendance records for a specific course
 * 
 * @param courseId - The ID of the course to fetch attendance records for
 * @returns Query result with course attendance records array
 * 
 * @example
 * ```tsx
 * function CourseAttendance({ courseId }: { courseId: string }) {
 *   const { data: records, isLoading } = useCourseAttendance(courseId);
 *   
 *   if (isLoading) return <TableSkeleton />;
 *   
 *   return (
 *     <table>
 *       <thead>
 *         <tr>
 *           <th>Sana</th>
 *           <th>Holat</th>
 *           <th>Vaqt</th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         {records?.map(record => (
 *           <tr key={record.id}>
 *             <td>{record.date.toLocaleDateString()}</td>
 *             <td>{record.status}</td>
 *             <td>{record.checkInTime?.toLocaleTimeString()}</td>
 *           </tr>
 *         ))}
 *       </tbody>
 *     </table>
 *   );
 * }
 * ```
 */
export const useCourseAttendance = (courseId: string) => {
  return useQuery<AttendanceRecord[], Error>({
    queryKey: qk.attendance.byCourse(courseId),
    queryFn: () => attendanceApi.fetchCourseAttendance(courseId),
    enabled: !!courseId, // Only fetch when courseId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch attendance summary with aggregated statistics
 * 
 * @returns Query result with attendance summary including stats by course and recent records
 * 
 * @example
 * ```tsx
 * function AttendanceSummaryCard() {
 *   const { data: summary, isLoading } = useAttendanceSummary();
 *   
 *   if (isLoading) return <CardSkeleton />;
 *   
 *   return (
 *     <div>
 *       <h3>Davomat xulosasi</h3>
 *       <p>Jami darslar: {summary?.totalClasses}</p>
 *       <p>Qatnashgan: {summary?.attended}</p>
 *       <p>Foiz: {summary?.attendancePercentage.toFixed(1)}%</p>
 *       
 *       <h4>Fanlar bo'yicha</h4>
 *       {summary?.byCourse.map(course => (
 *         <div key={course.courseId}>
 *           <p>{course.courseName}: {course.percentage.toFixed(1)}%</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useAttendanceSummary = () => {
  return useQuery<AttendanceSummary, Error>({
    queryKey: [...qk.attendance.root(), 'summary'] as const,
    queryFn: attendanceApi.fetchAttendanceSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch detailed attendance statistics
 * 
 * @returns Query result with comprehensive attendance statistics
 * 
 * @example
 * ```tsx
 * function AttendanceStatsDisplay() {
 *   const { data: stats, isLoading, error } = useAttendanceStats();
 *   
 *   if (isLoading) return <Skeleton className="h-32 w-full" />;
 *   if (error) return <div>Statistikani yuklab bo'lmadi</div>;
 *   
 *   return (
 *     <div className="grid grid-cols-2 gap-4">
 *       <div>
 *         <p className="text-sm text-muted-foreground">Jami darslar</p>
 *         <p className="text-2xl font-bold">{stats?.totalClasses}</p>
 *       </div>
 *       <div>
 *         <p className="text-sm text-muted-foreground">Qatnashgan</p>
 *         <p className="text-2xl font-bold text-green-600">{stats?.attended}</p>
 *       </div>
 *       <div>
 *         <p className="text-sm text-muted-foreground">Yo'qolgan</p>
 *         <p className="text-2xl font-bold text-red-600">{stats?.absent}</p>
 *       </div>
 *       <div>
 *         <p className="text-sm text-muted-foreground">Kech qolgan</p>
 *         <p className="text-2xl font-bold text-yellow-600">{stats?.late}</p>
 *       </div>
 *       <div className="col-span-2">
 *         <p className="text-sm text-muted-foreground">Davomat foizi</p>
 *         <p className="text-3xl font-bold">{stats?.attendancePercentage.toFixed(1)}%</p>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAttendanceStats = () => {
  return useQuery<AttendanceStats, Error>({
    queryKey: qk.attendance.stats(),
    queryFn: attendanceApi.fetchAttendanceStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to calculate attendance percentage for overall or specific course
 * 
 * @param courseId - Optional course ID to calculate percentage for specific course
 * @returns Query result with attendance percentage (0-100)
 * 
 * @example
 * ```tsx
 * function AttendancePercentage({ courseId }: { courseId?: string }) {
 *   const { data: percentage, isLoading } = useAttendancePercentage(courseId);
 *   
 *   if (isLoading) return <Skeleton className="h-12 w-24" />;
 *   
 *   const color = percentage >= 90 ? 'text-green-600' :
 *                 percentage >= 75 ? 'text-yellow-600' : 'text-red-600';
 *   
 *   return (
 *     <div>
 *       <p className={`text-4xl font-bold ${color}`}>
 *         {percentage?.toFixed(1)}%
 *       </p>
 *       <p className="text-sm text-muted-foreground">
 *         {courseId ? 'Fan davomati' : 'Umumiy davomat'}
 *       </p>
 *     </div>
 *   );
 * }
 * 
 * // Overall attendance
 * function OverallAttendance() {
 *   const { data: percentage } = useAttendancePercentage();
 *   return <div>Umumiy: {percentage}%</div>;
 * }
 * 
 * // Course-specific attendance
 * function CourseAttendancePercent() {
 *   const { data: percentage } = useAttendancePercentage('course-123');
 *   return <div>Fan: {percentage}%</div>;
 * }
 * ```
 */
export const useAttendancePercentage = (courseId?: string) => {
  return useQuery<number, Error>({
    queryKey: qk.attendance.percentage(courseId),
    queryFn: () => attendanceApi.calculateAttendancePercentage(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
