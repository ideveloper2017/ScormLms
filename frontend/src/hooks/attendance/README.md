# Attendance React Query Hooks

This directory contains React Query hooks for attendance-related data fetching and state management in the Student Portal.

## Overview

The attendance hooks provide a comprehensive interface for fetching attendance records, course-specific attendance, and attendance summaries with automatic caching, loading states, and error handling.

## Hooks

### `useAttendance(filters?: AttendanceFilters)`

Fetches all attendance records for the authenticated student with optional filters.

**Parameters:**
- `filters` (optional): Object to filter attendance records
  - `courseId?: string` - Filter by course ID
  - `startDate?: string` - Filter by start date (ISO format)
  - `endDate?: string` - Filter by end date (ISO format)
  - `status?: 'present' | 'absent' | 'late' | 'excused'` - Filter by status

**Returns:** Query result with `AttendanceRecord[]`

**Cache Time:** 5 minutes (staleTime)

**Example:**
```tsx
import { useAttendance } from '@/hooks/attendance';

function AttendanceList() {
  const { data: records, isLoading, error } = useAttendance();
  
  if (isLoading) return <ListSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div>
      {records?.map(record => (
        <div key={record.id}>
          {record.courseName} - {record.status} - {record.date.toLocaleDateString()}
        </div>
      ))}
    </div>
  );
}

// With filters
function FilteredAttendance() {
  const { data } = useAttendance({ 
    courseId: 'course-123',
    status: 'present' 
  });
  
  return <div>{data?.length} present records</div>;
}
```

---

### `useCourseAttendance(courseId: string)`

Fetches attendance records for a specific course.

**Parameters:**
- `courseId` (required): The ID of the course

**Returns:** Query result with `AttendanceRecord[]`

**Cache Time:** 5 minutes (staleTime)

**Query Behavior:** Only fetches when `courseId` is provided (enabled: !!courseId)

**Example:**
```tsx
import { useCourseAttendance } from '@/hooks/attendance';

function CourseAttendance({ courseId }: { courseId: string }) {
  const { data: records, isLoading } = useCourseAttendance(courseId);
  
  if (isLoading) return <TableSkeleton />;
  
  return (
    <table>
      <thead>
        <tr>
          <th>Sana</th>
          <th>Holat</th>
          <th>Vaqt</th>
        </tr>
      </thead>
      <tbody>
        {records?.map(record => (
          <tr key={record.id}>
            <td>{record.date.toLocaleDateString()}</td>
            <td>{record.status}</td>
            <td>{record.checkInTime?.toLocaleTimeString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### `useAttendanceSummary()`

Fetches attendance summary with aggregated statistics.

**Returns:** Query result with `AttendanceSummary`

**Summary includes:**
- `totalClasses: number` - Total number of classes
- `attended: number` - Number of attended classes
- `absent: number` - Number of absences
- `late: number` - Number of late arrivals
- `excused: number` - Number of excused absences
- `attendancePercentage: number` - Overall attendance percentage
- `byCourse: CourseAttendance[]` - Attendance breakdown by course
- `recentRecords: AttendanceRecord[]` - Recent attendance records

**Cache Time:** 5 minutes (staleTime)

**Example:**
```tsx
import { useAttendanceSummary } from '@/hooks/attendance';

function AttendanceSummaryCard() {
  const { data: summary, isLoading } = useAttendanceSummary();
  
  if (isLoading) return <CardSkeleton />;
  
  return (
    <div>
      <h3>Davomat xulosasi</h3>
      <p>Jami darslar: {summary?.totalClasses}</p>
      <p>Qatnashgan: {summary?.attended}</p>
      <p>Foiz: {summary?.attendancePercentage.toFixed(1)}%</p>
      
      <h4>Fanlar bo'yicha</h4>
      {summary?.byCourse.map(course => (
        <div key={course.courseId}>
          <p>{course.courseName}: {course.percentage.toFixed(1)}%</p>
        </div>
      ))}
    </div>
  );
}
```

---

### `useAttendanceStats()`

Fetches detailed attendance statistics.

**Returns:** Query result with `AttendanceStats`

**Statistics include:**
- `totalClasses: number` - Total number of classes
- `attended: number` - Number of attended classes
- `absent: number` - Number of absences
- `late: number` - Number of late arrivals
- `excused: number` - Number of excused absences
- `attendancePercentage: number` - Overall attendance percentage
- `byCourse: CourseAttendance[]` - Attendance breakdown by course

**Cache Time:** 5 minutes (staleTime)

**Example:**
```tsx
import { useAttendanceStats } from '@/hooks/attendance';

function AttendanceStatsDisplay() {
  const { data: stats, isLoading, error } = useAttendanceStats();
  
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (error) return <div>Statistikani yuklab bo'lmadi</div>;
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Jami darslar</p>
        <p className="text-2xl font-bold">{stats?.totalClasses}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Qatnashgan</p>
        <p className="text-2xl font-bold text-green-600">{stats?.attended}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Yo'qolgan</p>
        <p className="text-2xl font-bold text-red-600">{stats?.absent}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Kech qolgan</p>
        <p className="text-2xl font-bold text-yellow-600">{stats?.late}</p>
      </div>
      <div className="col-span-2">
        <p className="text-sm text-muted-foreground">Davomat foizi</p>
        <p className="text-3xl font-bold">{stats?.attendancePercentage.toFixed(1)}%</p>
      </div>
    </div>
  );
}
```

---

### `useAttendancePercentage(courseId?: string)`

Calculates attendance percentage for overall or specific course.

**Parameters:**
- `courseId` (optional): Course ID to calculate percentage for specific course. If omitted, returns overall percentage.

**Returns:** Query result with `number` (0-100)

**Cache Time:** 5 minutes (staleTime)

**Example:**
```tsx
import { useAttendancePercentage } from '@/hooks/attendance';

function AttendancePercentage({ courseId }: { courseId?: string }) {
  const { data: percentage, isLoading } = useAttendancePercentage(courseId);
  
  if (isLoading) return <Skeleton className="h-12 w-24" />;
  
  const color = percentage >= 90 ? 'text-green-600' :
                percentage >= 75 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div>
      <p className={`text-4xl font-bold ${color}`}>
        {percentage?.toFixed(1)}%
      </p>
      <p className="text-sm text-muted-foreground">
        {courseId ? 'Fan davomati' : 'Umumiy davomat'}
      </p>
    </div>
  );
}

// Overall attendance
function OverallAttendance() {
  const { data: percentage } = useAttendancePercentage();
  return <div>Umumiy: {percentage}%</div>;
}

// Course-specific attendance
function CourseAttendancePercent() {
  const { data: percentage } = useAttendancePercentage('course-123');
  return <div>Fan: {percentage}%</div>;
}
```

## Query Keys

All hooks use centralized query keys from `@/lib/query-keys`:

```typescript
qk.attendance.list()                    // useAttendance()
qk.attendance.byCourse(courseId)        // useCourseAttendance(courseId)
[...qk.attendance.root(), 'summary']    // useAttendanceSummary()
qk.attendance.stats()                   // useAttendanceStats()
qk.attendance.percentage(courseId?)     // useAttendancePercentage(courseId?)
```

## Caching Strategy

- **Stale Time:** 5 minutes for all attendance hooks
  - Attendance data doesn't change frequently during the day
  - Reduces unnecessary API calls while keeping data reasonably fresh
- **Background Refetch:** Automatically refetches when:
  - Window regains focus
  - Network reconnects
  - Cache becomes stale

## Error Handling

All hooks handle errors automatically:
- API errors are caught and returned in the `error` field
- Toast notifications are shown via the `handleApiError` utility
- Error messages are displayed in Uzbek language
- Errors are logged to console in development mode

## Loading States

All hooks provide loading states:
- `isLoading: boolean` - True during initial fetch
- `isFetching: boolean` - True during any fetch (including background refetch)
- `isSuccess: boolean` - True when data is successfully fetched
- `isError: boolean` - True when an error occurs

## Type Safety

All hooks are fully typed with TypeScript:
- Return types are explicitly defined
- Query keys are type-safe with `as const` assertions
- Generic types ensure proper inference

## API Service

These hooks use the `attendanceApi` service from `@/services/api/attendance-api`:

```typescript
import { attendanceApi } from '@/services/api/attendance-api';

// Service methods:
attendanceApi.fetchAttendance(filters?)
attendanceApi.fetchCourseAttendance(courseId)
attendanceApi.fetchAttendanceSummary()
attendanceApi.fetchAttendanceStats()
attendanceApi.calculateAttendancePercentage(courseId?)
```

## Related Files

- API Service: `/src/services/api/attendance-api.ts`
- Type Definitions: `/src/types/attendance.types.ts`
- Query Keys: `/src/lib/query-keys.ts`
- Error Handler: `/src/utils/error-handler.ts`

## Testing

Unit tests for these hooks can be found in:
- `/src/hooks/attendance/__tests__/useAttendance.test.tsx`

Example test setup:
```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAttendance } from '../useAttendance';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('useAttendance fetches attendance records', async () => {
  const { result } = renderHook(() => useAttendance(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

## Usage Guidelines

1. **Use appropriate hook for the context:**
   - Use `useAttendance()` for full attendance list with filters
   - Use `useCourseAttendance()` for course-specific views
   - Use `useAttendanceSummary()` for dashboard cards
   - Use `useAttendanceStats()` for detailed statistics pages
   - Use `useAttendancePercentage()` for quick percentage displays

2. **Handle loading and error states:**
   ```tsx
   const { data, isLoading, error } = useAttendance();
   
   if (isLoading) return <Skeleton />;
   if (error) return <ErrorDisplay error={error} />;
   if (!data) return <div>Ma'lumot topilmadi</div>;
   ```

3. **Leverage caching:**
   - Data is cached for 5 minutes
   - Navigating away and back shows cached data instantly
   - Background refetch ensures data freshness

4. **Use query invalidation for updates:**
   ```tsx
   import { useQueryClient } from '@tanstack/react-query';
   import { qk } from '@/lib/query-keys';
   
   const queryClient = useQueryClient();
   
   // After updating attendance
   queryClient.invalidateQueries({ 
     queryKey: qk.attendance.list() 
   });
   ```

## Architecture

```
UI Component
    ↓
useAttendance Hook (React Query)
    ↓
attendanceApi Service
    ↓
Axios Client (with auth)
    ↓
Backend API (/api/v1/students/me/attendance/*)
```

## Best Practices

1. **Always check for data existence before rendering:**
   ```tsx
   {data?.map(record => ...)}
   ```

2. **Use skeleton screens for loading states:**
   ```tsx
   if (isLoading) return <ListSkeleton rows={5} />;
   ```

3. **Display user-friendly error messages:**
   ```tsx
   if (error) return <ErrorDisplay message="Davomat ma'lumotlarini yuklab bo'lmadi" />;
   ```

4. **Format dates appropriately:**
   ```tsx
   {record.date.toLocaleDateString('uz-UZ')}
   ```

5. **Show percentage with proper formatting:**
   ```tsx
   {percentage.toFixed(1)}%
   ```
