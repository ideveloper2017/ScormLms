# API Response Validation Schemas

This directory contains Zod validation schemas for all API response types in the Student Portal application.

## Purpose

These schemas provide runtime validation for API responses with:
- **Date parsing and validation** - Automatically converts ISO string dates to Date objects with fallback to current date
- **Numeric range validation** - Ensures scores, percentages, and counts are within valid ranges
- **Fallback values** - Provides safe defaults when API returns invalid data
- **Type safety** - TypeScript types inferred from Zod schemas
- **Error messages in Uzbek (Lotin)** - User-friendly validation error messages

## Files

- `validation.ts` - Core validation utilities and reusable schemas
- `assignment.schemas.ts` - Assignment and submission validation
- `test.schemas.ts` - Test and exam validation
- `grade.schemas.ts` - Grade and GPA validation
- `attendance.schemas.ts` - Attendance record validation
- `course.schemas.ts` - Course and material validation
- `schedule.schemas.ts` - Class schedule validation
- `dashboard.schemas.ts` - Dashboard and stats validation
- `notification.schemas.ts` - Notification validation
- `schemas.ts` - Central export file

## Usage

### Basic Validation

```typescript
import { assignmentSchema, assignmentsArraySchema } from '@/types/schemas';

// Validate single assignment
const assignment = assignmentSchema.parse(apiResponse);

// Validate array of assignments
const assignments = assignmentsArraySchema.parse(apiResponse);
```

### In API Services

```typescript
import { courseSchema, coursesArraySchema } from '@/types/schemas';
import api from '@/lib/api';

export const courseApi = {
  fetchCourses: async () => {
    const response = await api.get('/courses/student');
    // Validate and transform API response
    return coursesArraySchema.parse(response.data.data);
  },
  
  fetchCourseDetails: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return courseSchema.parse(response.data.data);
  },
};
```

### Safe Parsing with Error Handling

```typescript
import { testSchema } from '@/types/schemas';

const result = testSchema.safeParse(apiResponse);

if (result.success) {
  console.log('Valid data:', result.data);
} else {
  console.error('Validation errors:', result.error.errors);
  // Handle validation failure
}
```

## Validation Features

### Date Validation

Dates are automatically parsed from ISO string format and fallback to current date if invalid:

```typescript
// API returns: { dueDate: "2024-02-01T10:00:00Z" }
// Result: { dueDate: Date object }

// API returns: { dueDate: "invalid-date" }
// Result: { dueDate: new Date() } // Current date as fallback
```

### Numeric Range Validation

All numeric fields have appropriate range validation:

#### Scores (0-100)
```typescript
maxScore: 100 // ✓ Valid
maxScore: -10 // ✗ Fallback to 0
maxScore: 150 // ✗ Fallback to 0
```

#### Percentages (0-100)
```typescript
progress: 75 // ✓ Valid
progress: -5 // ✗ Fallback to 0
progress: 101 // ✗ Fallback to 0
```

#### GPA (0-4.0)
```typescript
gpa: 3.5 // ✓ Valid
gpa: -1 // ✗ Fallback to 0
gpa: 5.0 // ✗ Fallback to 0
```

#### Counts (non-negative)
```typescript
questionCount: 50 // ✓ Valid
questionCount: -5 // ✗ Fallback to 0
```

### Array Validation

Arrays are validated element by element. Invalid elements can be filtered out:

```typescript
import { assignmentsArraySchema } from '@/types/schemas';

// If API returns mixed valid/invalid items, Zod will validate each
const assignments = assignmentsArraySchema.parse(apiData);
```

## Error Messages

All validation errors are in Uzbek (Lotin):

- `"Noto'g'ri sana formati"` - Invalid date format
- `"Ball raqam bo'lishi kerak"` - Score must be a number
- `"Ball 0 dan kam bo'lmasligi kerak"` - Score cannot be less than 0
- `"Ball 100 dan oshmasligi kerak"` - Score cannot exceed 100
- `"Foiz 0 dan kam bo'lmasligi kerak"` - Percentage cannot be less than 0
- `"GPA 4.0 dan oshmasligi kerak"` - GPA cannot exceed 4.0
- `"Noto'g'ri URL formati"` - Invalid URL format
- `"Noto'g'ri email formati"` - Invalid email format

## Available Schemas

### Assignment
- `assignmentSchema`
- `assignmentDetailsSchema`
- `assignmentSubmissionSchema`
- `assignmentsArraySchema`

### Test
- `testSchema`
- `testDetailsSchema`
- `testSessionSchema`
- `testResultSchema`
- `testsArraySchema`

### Grade
- `gradeSchema`
- `gradeDistributionSchema`
- `gpaDataSchema`
- `gradesArraySchema`

### Attendance
- `attendanceRecordSchema`
- `courseAttendanceSchema`
- `attendanceStatsSchema`
- `attendanceRecordsArraySchema`

### Course
- `courseSchema`
- `courseDetailsSchema`
- `courseProgressSchema`
- `coursesArraySchema`

### Schedule
- `scheduleItemSchema`
- `weeklyScheduleSchema`
- `scheduleItemsArraySchema`

### Dashboard
- `studentProfileSchema`
- `dashboardStatsSchema`
- `dashboardDataSchema`

### Notification
- `notificationSchema`
- `notificationGroupSchema`
- `notificationsArraySchema`

## Testing

All validation schemas are thoroughly tested:

```bash
npm test -- src/lib/__tests__/validation.test.ts
npm test -- src/types/__tests__/schemas.test.ts
```

Tests cover:
- Valid data parsing
- Invalid data with fallbacks
- Date parsing and fallback
- Numeric range validation
- Array validation
- Optional fields

## Requirements

This implementation satisfies:
- **Requirement 14.5**: Date field parsing and validation
- **Requirement 14.6**: Numeric range validation for scores, percentages, counts
- Fallback to current date for invalid dates
- Fallback to 0 for invalid numbers
- Error messages in Uzbek (Lotin)
