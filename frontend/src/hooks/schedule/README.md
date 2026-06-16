# Schedule Hooks

React Query hooks for managing class schedule data in the Student Portal.

## Overview

This module provides hooks for fetching and managing class schedules with various time filters. All hooks use React Query for automatic caching, background revalidation, and loading/error state management.

## Available Hooks

### `useSchedule(filters?)`

Fetches the complete schedule for the authenticated student with optional filters.

**Parameters:**
- `filters` (optional): `ScheduleFilters` object
  - `startDate?: string` - ISO date string for start date
  - `endDate?: string` - ISO date string for end date
  - `courseId?: string` - Filter by specific course
  - `dayOfWeek?: number` - Filter by day of week (0-6, where 0 is Sunday)

**Returns:** `UseQueryResult<ScheduleItem[], Error>`

**Cache Time:** 30 minutes

**Example:**
```tsx
import { useSchedule } from '@/hooks/schedule';

function SchedulePage() {
  const { data: schedule, isLoading, error } = useSchedule({
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading schedule</div>;
  
  return (
    <div>
      {schedule?.map(item => (
        <div key={item.id}>{item.courseName}</div>
      ))}
    </div>
  );
}
```

### `useTodaySchedule()`

Fetches today's schedule for the authenticated student.

**Returns:** `UseQueryResult<ScheduleItem[], Error>`

**Cache Time:** 30 minutes

**Example:**
```tsx
import { useTodaySchedule } from '@/hooks/schedule';

function TodayScheduleCard() {
  const { data: todayClasses, isLoading } = useTodaySchedule();
  
  return (
    <div>
      <h3>Bugungi darslar</h3>
      {todayClasses?.length === 0 ? (
        <p>Bugun darslar yo'q</p>
      ) : (
        todayClasses?.map(item => (
          <div key={item.id}>{item.courseName}</div>
        ))
      )}
    </div>
  );
}
```

### `useWeekSchedule()`

Fetches this week's schedule (current week, Monday-Sunday).

**Returns:** `UseQueryResult<ScheduleItem[], Error>`

**Cache Time:** 30 minutes

**Example:**
```tsx
import { useWeekSchedule } from '@/hooks/schedule';

function WeeklyScheduleView() {
  const { data: weekSchedule, isLoading } = useWeekSchedule();
  
  if (isLoading) return <div>Loading week schedule...</div>;
  
  return (
    <div>
      <h3>Bu hafta</h3>
      {weekSchedule?.map(item => (
        <div key={item.id}>{item.courseName}</div>
      ))}
    </div>
  );
}
```

### `useUpcomingClasses()`

Fetches upcoming classes in chronological order.

**Returns:** `UseQueryResult<ScheduleItem[], Error>`

**Cache Time:** 30 minutes

**Example:**
```tsx
import { useUpcomingClasses } from '@/hooks/schedule';

function UpcomingClassesWidget() {
  const { data: upcomingClasses, isLoading } = useUpcomingClasses();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h3>Keyingi darslar</h3>
      <ul>
        {upcomingClasses?.map(item => (
          <li key={item.id}>
            {item.courseName} - {item.startTime}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### `useScheduleByWeek(weekNumber)`

Fetches schedule for a specific ISO week number.

**Parameters:**
- `weekNumber` (required): ISO week number (1-53)

**Returns:** `UseQueryResult<WeeklySchedule, Error>`

**Cache Time:** 30 minutes

**Notes:**
- Only fetches when weekNumber is between 1 and 53
- Returns week metadata (weekNumber, startDate, endDate) plus schedule items

**Example:**
```tsx
import { useScheduleByWeek } from '@/hooks/schedule';

function SpecificWeekSchedule() {
  const [selectedWeek, setSelectedWeek] = useState(10);
  const { data: weekSchedule, isLoading } = useScheduleByWeek(selectedWeek);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h3>Hafta {weekSchedule?.weekNumber}</h3>
      <p>
        {weekSchedule?.startDate.toLocaleDateString()} - 
        {weekSchedule?.endDate.toLocaleDateString()}
      </p>
      {weekSchedule?.items.map(item => (
        <div key={item.id}>{item.courseName}</div>
      ))}
    </div>
  );
}
```

### `useNextClass()`

Fetches the single next upcoming class based on current date and time.

**Returns:** `UseQueryResult<ScheduleItem | null, Error>`

**Cache Time:** 30 minutes

**Notes:**
- Returns `null` if no upcoming classes exist
- Useful for dashboard widgets showing the immediate next class

**Example:**
```tsx
import { useNextClass } from '@/hooks/schedule';

function NextClassWidget() {
  const { data: nextClass, isLoading } = useNextClass();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (!nextClass) {
    return <div>Keyingi dars yo'q</div>;
  }
  
  return (
    <div>
      <h4>Keyingi dars</h4>
      <p>{nextClass.courseName}</p>
      <p>Xona: {nextClass.room}</p>
      <p>{nextClass.startTime} - {nextClass.endTime}</p>
    </div>
  );
}
```

## Type Definitions

### `ScheduleItem`

```typescript
interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  instructor: string;
  room: string;
  building?: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  type: 'lecture' | 'lab' | 'seminar' | 'tutorial';
  color?: string; // For UI color coding
  isOnline: boolean;
  meetingLink?: string;
}
```

### `WeeklySchedule`

```typescript
interface WeeklySchedule {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  items: ScheduleItem[];
}
```

### `ScheduleFilters`

```typescript
interface ScheduleFilters {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  courseId?: string;
  dayOfWeek?: number; // 0-6
}
```

## Cache Strategy

All schedule hooks use a **30-minute stale time** because:
- Class schedules are relatively stable and don't change frequently
- Reduces unnecessary API calls
- Still provides fresh data when needed through background revalidation

React Query automatically:
- Refetches on window focus
- Refetches on network reconnection
- Provides cached data instantly while revalidating in the background

## Error Handling

All hooks automatically handle errors through React Query:

```tsx
const { data, isLoading, error, refetch } = useSchedule();

if (error) {
  return (
    <div>
      <p>Xatolik yuz berdi: {error.message}</p>
      <button onClick={() => refetch()}>Qayta urinish</button>
    </div>
  );
}
```

## Query Keys

All schedule hooks use query keys defined in `@/lib/query-keys.ts`:

```typescript
schedule: {
  root: () => ['schedule'],
  list: () => [...qk.schedule.root(), 'list'],
  byWeek: (weekNumber: number) => [...qk.schedule.root(), 'byWeek', weekNumber],
  upcoming: () => [...qk.schedule.root(), 'upcoming'],
  today: () => [...qk.schedule.root(), 'today'],
}
```

Additional keys used:
- `[...qk.schedule.root(), 'week']` - for current week schedule
- `[...qk.schedule.root(), 'next']` - for next single class

## Related Files

- **API Service:** `@/services/api/schedule-api.ts`
- **Type Definitions:** `@/types/schedule.types.ts`
- **Query Keys:** `@/lib/query-keys.ts`

## Testing

See `__tests__/useSchedule.test.tsx` for unit and integration tests.
