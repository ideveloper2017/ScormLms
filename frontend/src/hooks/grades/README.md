# Grade React Query Hooks

This directory contains React Query hooks for managing grade-related data in the Student Portal.

## Overview

All hooks provide consistent interfaces for:
- **Loading states**: `isLoading`, `isFetching`
- **Error handling**: `isError`, `error`
- **Data access**: `data`
- **Refetching**: `refetch()`
- **Caching**: 10-minute stale time for all grade queries

## Available Hooks

### `useGrades(filters?: GradeFilters)`
Fetches all grades for the authenticated student with optional filters.

**Parameters:**
- `filters` (optional): Filter by courseId, semester, academicYear, assignmentId, or testId

**Returns:** `Grade[]`

**Example:**
```tsx
import { useGrades } from '@/hooks/grades';

function GradesList() {
  const { data: grades, isLoading, error } = useGrades();
  
  if (isLoading) return <CardSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div>
      {grades?.map(grade => (
        <div key={grade.id}>
          {grade.courseName}: {grade.gradeLetter} ({grade.scorePercentage}%)
        </div>
      ))}
    </div>
  );
}
```

### `useCourseGrades(courseId: string)`
Fetches grades for a specific course.

**Parameters:**
- `courseId` (required): The ID of the course

**Returns:** `Grade[]`

**Example:**
```tsx
import { useCourseGrades } from '@/hooks/grades';

function CourseGrades({ courseId }: { courseId: string }) {
  const { data: grades, isLoading } = useCourseGrades(courseId);
  
  if (isLoading) return <TableSkeleton />;
  
  return (
    <table>
      {grades?.map(grade => (
        <tr key={grade.id}>
          <td>{grade.assignmentName}</td>
          <td>{grade.gradeLetter}</td>
          <td>{grade.scorePercentage}%</td>
        </tr>
      ))}
    </table>
  );
}
```

### `useGradeSummary()`
Fetches aggregated grade statistics.

**Returns:** `GradeSummary`

**Example:**
```tsx
import { useGradeSummary } from '@/hooks/grades';

function GradeSummaryCard() {
  const { data: summary, isLoading } = useGradeSummary();
  
  if (isLoading) return <CardSkeleton />;
  
  return (
    <div>
      <h3>Grade Summary</h3>
      <p>Average: {summary?.averageScore}%</p>
      <p>Total Grades: {summary?.totalGrades}</p>
      <p>Highest: {summary?.highestScore}%</p>
      <p>Lowest: {summary?.lowestScore}%</p>
    </div>
  );
}
```

### `useGPA()`
Fetches GPA (Grade Point Average) for the authenticated student.

**Returns:** `GPA`

**Example:**
```tsx
import { useGPA } from '@/hooks/grades';

function GPADisplay() {
  const { data: gpa, isLoading, error } = useGPA();
  
  if (isLoading) return <Skeleton className="h-20 w-40" />;
  if (error) return <div>GPA ni yuklab bo'lmadi</div>;
  
  return (
    <div>
      <h3>GPA</h3>
      <p>Joriy: {gpa?.currentGPA.toFixed(2)}</p>
      <p>Umumiy: {gpa?.cumulativeGPA.toFixed(2)}</p>
      <p>Kreditlar: {gpa?.totalCredits}</p>
    </div>
  );
}
```

### `useTranscript()`
Fetches the complete academic transcript organized by semester.

**Returns:** `Transcript`

**Example:**
```tsx
import { useTranscript } from '@/hooks/grades';

function TranscriptPage() {
  const { data: transcript, isLoading } = useTranscript();
  
  if (isLoading) return <div>Transkript yuklanmoqda...</div>;
  
  return (
    <div>
      <h2>{transcript?.studentName}</h2>
      <p>Umumiy GPA: {transcript?.cumulativeGPA.toFixed(2)}</p>
      <p>Jami kreditlar: {transcript?.totalCredits}</p>
      {transcript?.semesters.map(semester => (
        <div key={semester.semester}>
          <h3>{semester.semester} - {semester.academicYear}</h3>
          <p>Semestr GPA: {semester.semesterGPA.toFixed(2)}</p>
          {semester.courses.map(course => (
            <div key={course.courseId}>
              {course.courseCode}: {course.courseName} - {course.gradeLetter}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### `useGradeDistribution()`
Fetches grade distribution statistics.

**Returns:** `GradeDistribution`

**Example:**
```tsx
import { useGradeDistribution } from '@/hooks/grades';

function GradeDistributionChart() {
  const { data: distribution, isLoading } = useGradeDistribution();
  
  if (isLoading) return <div>Yuklanmoqda...</div>;
  
  return (
    <div>
      <h3>Baholar taqsimoti</h3>
      <p>A: {distribution?.A}</p>
      <p>B: {distribution?.B}</p>
      <p>C: {distribution?.C}</p>
      <p>D: {distribution?.D}</p>
      <p>F: {distribution?.F}</p>
    </div>
  );
}
```

## Cache Configuration

All grade hooks use a 10-minute stale time (`staleTime: 10 * 60 * 1000`) because grade data doesn't change frequently. This means:

- Data is considered fresh for 10 minutes after fetching
- No automatic refetches occur during this time
- Background revalidation happens when:
  - Window regains focus (after being inactive)
  - Network reconnects after being offline
  - Manual refetch is triggered

## Query Keys

All hooks use query keys from `@/lib/query-keys.ts`:

- `qk.grades.list()` - All grades
- `qk.grades.byCourse(courseId)` - Grades by course
- `qk.grades.gpa()` - GPA data
- `qk.grades.distribution()` - Grade distribution
- `[...qk.grades.root(), 'summary']` - Grade summary
- `[...qk.grades.root(), 'transcript']` - Transcript

## Error Handling

All hooks handle errors through the underlying grade API service, which:
- Shows toast notifications for user-friendly error messages
- Logs errors to console in development mode
- Provides structured error objects for component handling

## Testing

Comprehensive tests are available in `__tests__/useGrades.test.tsx`:
- Tests for successful data fetching
- Tests for error handling
- Tests for loading states
- Tests for cache configuration

Run tests with:
```bash
npm test -- useGrades.test.tsx
```

## Type Safety

All hooks are fully typed with TypeScript:
- Request parameters are type-checked
- Response data is type-checked
- Error objects are typed as `Error`

## Related Files

- **API Service**: `@/services/api/grade-api.ts`
- **Type Definitions**: `@/types/grade.types.ts`
- **Query Keys**: `@/lib/query-keys.ts`
- **Tests**: `./__tests__/useGrades.test.tsx`
