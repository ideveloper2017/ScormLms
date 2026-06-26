/**
 * React Query hooks for Schedule management
 * 
 * Provides hooks for fetching class schedules with various filters and time ranges.
 * All hooks use React Query for caching, loading states, and error handling.
 */

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { scheduleApi, ScheduleFilters } from '@/services/api/schedule-api';
import type { ScheduleItem, WeeklySchedule } from '@/types/schedule.types';

/**
 * Hook to fetch the complete schedule for the authenticated student
 * 
 * @param filters - Optional filters to narrow down schedule results (date range, course, day of week)
 * @returns Query result with schedule items array, loading state, and error state
 * 
 * @example
 * ```tsx
 * function SchedulePage() {
 *   const { data: schedule, isLoading, error } = useSchedule({
 *     startDate: '2024-01-01',
 *     endDate: '2024-01-31'
 *   });
 *   
 *   if (isLoading) return <CardSkeleton />;
 *   if (error) return <ErrorDisplay error={error} />;
 *   
 *   return (
 *     <div>
 *       {schedule?.map(item => (
 *         <div key={item.id}>
 *           {item.courseName} - {item.room} ({item.startTime} - {item.endTime})
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useSchedule = (filters?: ScheduleFilters) => {
  return useQuery<ScheduleItem[], Error>({
    queryKey: qk.schedule.list(),
    queryFn: () => scheduleApi.fetchSchedule(filters),
    staleTime: 30 * 60 * 1000, // 30 minutes - schedules are relatively stable
  });
};

/**
 * Hook to fetch today's schedule for the authenticated student
 * Returns all classes scheduled for the current day
 * 
 * @returns Query result with today's schedule items array
 * 
 * @example
 * ```tsx
 * function TodayScheduleCard() {
 *   const { data: todayClasses, isLoading } = useTodaySchedule();
 *   
 *   if (isLoading) return <CardSkeleton />;
 *   
 *   return (
 *     <div>
 *       <h3>Bugungi darslar</h3>
 *       {todayClasses?.length === 0 ? (
 *         <p>Bugun darslar yo'q</p>
 *       ) : (
 *         todayClasses?.map(item => (
 *           <div key={item.id}>
 *             <strong>{item.courseName}</strong>
 *             <p>{item.startTime} - {item.endTime}</p>
 *             <p>Xona: {item.room}</p>
 *           </div>
 *         ))
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTodaySchedule = () => {
  return useQuery<ScheduleItem[], Error>({
    queryKey: qk.schedule.today(),
    queryFn: scheduleApi.fetchTodaySchedule,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to fetch this week's schedule for the authenticated student
 * Returns all classes scheduled for the current week (Monday-Sunday)
 * 
 * @returns Query result with this week's schedule items array
 * 
 * @example
 * ```tsx
 * function WeeklyScheduleView() {
 *   const { data: weekSchedule, isLoading } = useWeekSchedule();
 *   
 *   if (isLoading) return <TableSkeleton />;
 *   
 *   // Group by day of week
 *   const groupedByDay = weekSchedule?.reduce((acc, item) => {
 *     const day = item.dayOfWeek;
 *     if (!acc[day]) acc[day] = [];
 *     acc[day].push(item);
 *     return acc;
 *   }, {} as Record<number, ScheduleItem[]>);
 *   
 *   return (
 *     <div>
 *       {Object.entries(groupedByDay || {}).map(([day, items]) => (
 *         <div key={day}>
 *           <h4>Kun {day}</h4>
 *           {items.map(item => (
 *             <div key={item.id}>{item.courseName}</div>
 *           ))}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useWeekSchedule = () => {
  return useQuery<ScheduleItem[], Error>({
    queryKey: [...qk.schedule.root(), 'week'] as const,
    queryFn: scheduleApi.fetchWeekSchedule,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to fetch upcoming classes for the authenticated student
 * Returns the next scheduled classes in chronological order
 * 
 * @returns Query result with upcoming schedule items array
 * 
 * @example
 * ```tsx
 * function UpcomingClassesWidget() {
 *   const { data: upcomingClasses, isLoading, error } = useUpcomingClasses();
 *   
 *   if (isLoading) return <Skeleton className="h-40 w-full" />;
 *   if (error) return <div>Keyingi darslarni yuklab bo'lmadi</div>;
 *   
 *   return (
 *     <div>
 *       <h3>Keyingi darslar</h3>
 *       {upcomingClasses?.length === 0 ? (
 *         <p>Keyingi darslar yo'q</p>
 *       ) : (
 *         <ul>
 *           {upcomingClasses?.map(item => (
 *             <li key={item.id}>
 *               {item.courseName} - {item.startTime}
 *               {item.isOnline && <span> (Online)</span>}
 *             </li>
 *           ))}
 *         </ul>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useUpcomingClasses = () => {
  return useQuery<ScheduleItem[], Error>({
    queryKey: qk.schedule.upcoming(),
    queryFn: scheduleApi.fetchUpcomingClasses,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to fetch schedule for a specific week number
 * Week numbers follow ISO 8601 standard (week 1 contains first Thursday of the year)
 * 
 * @param weekNumber - The ISO week number (1-53)
 * @returns Query result with weekly schedule data including date range and items
 * 
 * @example
 * ```tsx
 * function SpecificWeekSchedule() {
 *   const [selectedWeek, setSelectedWeek] = useState(10);
 *   const { data: weekSchedule, isLoading } = useScheduleByWeek(selectedWeek);
 *   
 *   if (isLoading) return <div>Yuklanmoqda...</div>;
 *   
 *   return (
 *     <div>
 *       <h3>Hafta {weekSchedule?.weekNumber}</h3>
 *       <p>
 *         {weekSchedule?.startDate.toLocaleDateString()} - 
 *         {weekSchedule?.endDate.toLocaleDateString()}
 *       </p>
 *       <div>
 *         {weekSchedule?.items.map(item => (
 *           <div key={item.id}>
 *             {item.courseName} - {item.instructor}
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export const useScheduleByWeek = (weekNumber: number) => {
  return useQuery<WeeklySchedule, Error>({
    queryKey: qk.schedule.byWeek(weekNumber),
    queryFn: () => scheduleApi.fetchScheduleByWeek(weekNumber),
    enabled: !!weekNumber && weekNumber >= 1 && weekNumber <= 53, // Only fetch valid week numbers
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to fetch the next upcoming class for the authenticated student
 * Returns the single next scheduled class based on current date and time
 * 
 * @returns Query result with the next schedule item, or null if no upcoming classes
 * 
 * @example
 * ```tsx
 * function NextClassWidget() {
 *   const { data: nextClass, isLoading } = useNextClass();
 *   
 *   if (isLoading) return <Skeleton className="h-24 w-full" />;
 *   
 *   if (!nextClass) {
 *     return (
 *       <div>
 *         <p>Keyingi dars yo'q</p>
 *       </div>
 *     );
 *   }
 *   
 *   return (
 *     <div>
 *       <h4>Keyingi dars</h4>
 *       <p><strong>{nextClass.courseName}</strong></p>
 *       <p>O'qituvchi: {nextClass.instructor}</p>
 *       <p>Xona: {nextClass.room}</p>
 *       <p>Vaqt: {nextClass.startTime} - {nextClass.endTime}</p>
 *       {nextClass.isOnline && nextClass.meetingLink && (
 *         <a href={nextClass.meetingLink} target="_blank" rel="noopener noreferrer">
 *           Online darsga qo'shilish
 *         </a>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useNextClass = () => {
  return useQuery<ScheduleItem | null, Error>({
    queryKey: [...qk.schedule.root(), 'next'] as const,
    queryFn: scheduleApi.getUpcomingClass,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
