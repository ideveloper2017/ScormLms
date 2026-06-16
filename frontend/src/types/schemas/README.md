# Zod Validation Schemas

This directory contains Zod schemas for runtime type validation of API responses in the Student Portal.

## Overview

Runtime validation ensures that data received from the backend API matches our expected TypeScript types, catching potential issues early and providing fallback values when needed.

## Features

- **Runtime Type Safety**: Validate API responses at runtime to catch type mismatches
- **Graceful Error Handling**: Provide fallback values for invalid data instead of crashing
- **Development Logging**: Log validation errors to console in development mode for debugging
- **Partial Array Validation**: Filter out invalid items from arrays instead of rejecting the entire array

## Available Schemas

### Course Schemas
- `CourseSchema` - Individual course validation
- `CoursesArraySchema` - Array of courses
- `CourseDetailsSchema` - Detailed course information
- `CourseProgressSchema` - Course progress tracking
- `CourseModuleSchema` - Course module information
- `CourseContentSchema` - Module content items

### Assignment Schemas
- `AssignmentSchema` - Individual assignment validation
- `AssignmentsArraySchema` - Array of assignments
- `AssignmentDetailsSchema` - Detailed assignment information
- `AssignmentSubmissionSchema` - Submission records

### Test Schemas
- `TestSchema` - Individual test validation
- `TestsArraySchema` - Array of tests
- `TestDetailsSchema` - Detailed test information
- `TestSessionSchema` - Active test session
- `TestResultSchema` - Test results

### Grade Schemas
- `GradeSchema` - Individual grade validation
- `GradesArraySchema` - Array of grades
- `GradeDistributionSchema` - Grade distribution statistics
- `GPADataSchema` - GPA calculation data

### Attendance Schemas
- `AttendanceRecordSchema` - Individual attendance record
- `AttendanceRecordsArraySchema` - Array of attendance records
- `AttendanceStatsSchema` - Attendance statistics
- `CourseAttendanceSchema` - Per-course attendance

### Schedule Schemas
- `ScheduleItemSchema` - Individual schedule item
- `ScheduleItemsArraySchema` - Array of schedule items
- `WeeklyScheduleSchema` - Weekly schedule view

### Notification Schemas
- `NotificationSchema` - Individual notification
- `NotificationsArraySchema` - Array of notifications
- `NotificationCountSchema` - Notification count
- `NotificationGroupSchema` - Grouped notifications

### Dashboard Schemas
- `StudentProfileSchema` - Student profile information
- `DashboardStatsSchema` - Dashboard statistics
- `ActivityItemSchema` - Activity item
- `DashboardDataSchema` - Complete dashboard data

## Usage in API Services

All API services in `src/services/api/` use these schemas to validate responses:

```typescript
import { CoursesArraySchema } from '@/types/schemas';
import { validateDataOrFallback } from '@/utils/validation';

export const fetchCourses = async (): Promise<Course[]> => {
  try {
    const response = await api.get('/students/me/courses');

    // Validate with fallback to empty array
    const validatedCourses = validateDataOrFallback(
      CoursesArraySchema,
      response.data.data,
      [], // Fallback value
      { context: 'courseApi.fetchCourses', logErrors: true }
    );

    return validatedCourses;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
```

## Validation Utilities

Located in `src/utils/validation.ts`:

### `validateData<T>(schema, data, options)`
Validates data and returns a result object with `success` status and either `data` or `error`.

### `validateDataOrThrow<T>(schema, data, options)`
Validates data and returns it, or throws an error if validation fails. Use for critical data that must be valid.

### `validateDataOrFallback<T>(schema, data, fallback, options)`
Validates data and returns it, or returns a fallback value if validation fails. Use for non-critical data with sensible defaults.

### `validateArrayPartial<T>(itemSchema, data, options)`
Validates an array and filters out invalid items instead of failing entirely. Useful for lists where some items may be malformed.

## Validation Options

```typescript
interface ValidationOptions {
  logErrors?: boolean;      // Log errors to console (default: true in dev)
  context?: string;         // Context information for error logging
}
```

## Error Logging

In development mode, validation errors are logged to the console with detailed information:

```
[Validation Error] courseApi.fetchCourses
  ❌ progress: Progress must be between 0 and 100
  ❌ status: Invalid enum value. Expected 'active' | 'completed' | 'draft', received 'archived'
```

## Date Handling

Zod schemas use `z.coerce.date()` to automatically convert date strings to Date objects:

```typescript
export const CourseSchema = z.object({
  // ... other fields
  dueDate: z.coerce.date().optional(),
  nextLesson: z.object({
    title: z.string().min(1),
    date: z.coerce.date(),
  }).optional(),
});
```

## Validation Strategy by API Service

| Service | Validation Approach | Fallback |
|---------|---------------------|----------|
| Course API | Array partial (filter invalid items) | Empty array |
| Assignment API | Array partial (filter invalid items) | Empty array |
| Test API | Array partial (filter invalid items) | Empty array |
| Grade API | Array partial (filter invalid items) | Empty array |
| Attendance API | Array partial (filter invalid items) | Empty array |
| Schedule API | Array partial (filter invalid items) | Empty array |
| Notification API | Array partial (filter invalid items) | Empty array |
| Dashboard API | Fallback with default stats | Zero values |

## Benefits

1. **Early Error Detection**: Catch data issues before they cause runtime errors in components
2. **Better User Experience**: Provide fallback data instead of showing error screens
3. **Debugging Aid**: Development logging helps identify backend data issues
4. **Type Safety**: Runtime validation ensures API responses match TypeScript types
5. **Graceful Degradation**: Partial array validation allows showing valid data even when some items are malformed

## Testing

Validation logic is tested in:
- `src/services/api/__tests__/` - API service tests with mock invalid data
- `src/utils/__tests__/validation.test.ts` - Validation utility tests

## Requirements Satisfied

This implementation satisfies requirements:
- **14.1**: Validate response structure using TypeScript types
- **14.2**: Display validation error for missing required fields
- **14.3**: Display validation error for invalid field types
- **14.7**: Log detailed error to console
- **14.8**: Use fallback default values where applicable
- **14.10**: Use Zod schema validation for critical data structures
