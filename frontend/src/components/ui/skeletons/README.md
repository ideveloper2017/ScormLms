# Skeleton Loading Components

Reusable skeleton loading components for the Student Portal, providing better UX during data loading states.

## Overview

All skeleton components are built using the base `Skeleton` component from shadcn/ui and match the actual component layouts they represent.

## Components

### CourseCardSkeleton

Skeleton for course card displays with image, title, instructor, and progress information.

```tsx
import { CourseCardSkeleton, CourseCardSkeletonList } from '@/components/ui/skeletons';

// Single card
<CourseCardSkeleton />

// Multiple cards in a grid (default: 6 cards)
<CourseCardSkeletonList count={6} />
```

**Usage Example:**
```tsx
function CoursesPage() {
  const { data: courses, isLoading } = useCourses();
  
  if (isLoading) {
    return <CourseCardSkeletonList count={9} />;
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses?.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

---

### DashboardStatsSkeleton

Skeleton for dashboard statistics cards and overview sections.

```tsx
import {
  StatCardSkeleton,
  DashboardStatsSkeleton,
  DashboardOverviewSkeleton
} from '@/components/ui/skeletons';

// Single stat card
<StatCardSkeleton />

// Stats grid (default: 4 cards)
<DashboardStatsSkeleton count={4} />

// Full dashboard with profile, stats, and activity
<DashboardOverviewSkeleton />
```

**Usage Example:**
```tsx
function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard();
  
  if (isLoading) {
    return <DashboardOverviewSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <ProfileHeader profile={dashboardData.profile} />
      <StatsGrid stats={dashboardData.stats} />
      <RecentActivity activities={dashboardData.recentActivity} />
    </div>
  );
}
```

---

### AssignmentListSkeleton

Skeleton for assignment list items and pages.

```tsx
import {
  AssignmentItemSkeleton,
  AssignmentListSkeleton,
  AssignmentPageSkeleton
} from '@/components/ui/skeletons';

// Single assignment item
<AssignmentItemSkeleton />

// Assignment list (default: 5 items)
<AssignmentListSkeleton count={5} />

// Full page with filters and stats
<AssignmentPageSkeleton />
```

**Usage Example:**
```tsx
function AssignmentsPage() {
  const { data: assignments, isLoading } = useAssignments();
  
  if (isLoading) {
    return <AssignmentPageSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <AssignmentFilters />
      <AssignmentStats />
      <AssignmentList assignments={assignments} />
    </div>
  );
}
```

---

### TableSkeleton

Skeleton for data tables including grades and attendance.

```tsx
import {
  TableSkeleton,
  GradeTableSkeleton,
  AttendanceTableSkeleton,
  CompactTableSkeleton
} from '@/components/ui/skeletons';

// Generic table (customizable rows and columns)
<TableSkeleton rows={10} columns={5} showHeader={true} />

// Grade table with stats cards
<GradeTableSkeleton rows={10} />

// Attendance table with filters
<AttendanceTableSkeleton rows={10} />

// Compact table for embedded views
<CompactTableSkeleton rows={5} />
```

**Usage Example:**
```tsx
function GradesPage() {
  const { data: grades, isLoading } = useGrades();
  
  if (isLoading) {
    return <GradeTableSkeleton rows={15} />;
  }
  
  return (
    <div className="space-y-4">
      <GPACards gpa={calculateGPA(grades)} />
      <GradesTable grades={grades} />
    </div>
  );
}
```

---

## React Query Integration

These skeleton components are designed to work seamlessly with React Query suspense boundaries:

```tsx
import { Suspense } from 'react';
import { CourseCardSkeletonList } from '@/components/ui/skeletons';

function CoursesPage() {
  return (
    <Suspense fallback={<CourseCardSkeletonList />}>
      <CoursesList />
    </Suspense>
  );
}

function CoursesList() {
  const { data: courses } = useCourses({
    suspense: true  // Enable suspense mode
  });
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

---

## Design Principles

1. **Match Layout**: Each skeleton component matches the layout of its corresponding actual component
2. **Pulse Animation**: Uses the default pulse animation from shadcn/ui Skeleton component
3. **Responsive**: All components are responsive and adapt to different screen sizes
4. **Accessible**: Skeleton components follow accessibility best practices
5. **Customizable**: Accept props for count, rows, columns, etc. to fit different use cases

---

## Styling

All skeleton components use:
- Tailwind CSS utility classes for layout and spacing
- The base `Skeleton` component which provides:
  - `animate-pulse` for animation
  - `bg-muted` for background color
  - `rounded-md` for border radius

The skeleton components automatically inherit the theme's muted color and adapt to light/dark mode.

---

## Best Practices

1. **Minimum Display Time**: Display skeletons for at least 300ms to avoid flashing
2. **Match Actual Content**: Ensure skeleton layout closely matches the actual content
3. **Use with React Query**: Leverage React Query's loading states for automatic skeleton display
4. **Consistent Usage**: Use the same skeleton component consistently across the app for similar content types
5. **Accessibility**: Ensure skeleton screens don't trap keyboard focus or confuse screen readers

---

## Examples in Context

### Complete Dashboard Example

```tsx
import { DashboardOverviewSkeleton } from '@/components/ui/skeletons';
import { useDashboard } from '@/hooks/useDashboard';

function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  
  if (isLoading) {
    return <DashboardOverviewSkeleton />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <div className="space-y-6">
      <ProfileHeader profile={data.profile} />
      <StatsGrid stats={data.stats} />
      <RecentActivity activities={data.recentActivity} />
    </div>
  );
}
```

### Table with Filtering

```tsx
import { GradeTableSkeleton } from '@/components/ui/skeletons';
import { useGrades } from '@/hooks/useGrades';

function GradesPage() {
  const [filters, setFilters] = useState({ courseId: null });
  const { data: grades, isLoading } = useGrades(filters);
  
  return (
    <div className="space-y-6">
      <GradeFilters filters={filters} onChange={setFilters} />
      
      {isLoading ? (
        <GradeTableSkeleton rows={10} />
      ) : (
        <GradesTable grades={grades} />
      )}
    </div>
  );
}
```

---

## Related Components

- `@/components/ui/skeleton` - Base skeleton component from shadcn/ui
- `@/components/ui/card` - Card component used in skeleton layouts
- `@/components/ui/table` - Table components used in table skeletons

---

## Contributing

When adding new skeleton components:

1. Match the actual component's layout structure
2. Use the base `Skeleton` component for animated placeholders
3. Accept props for customization (count, rows, etc.)
4. Export from the `index.ts` file
5. Add documentation to this README
6. Follow the existing naming convention: `[Component]Skeleton`
