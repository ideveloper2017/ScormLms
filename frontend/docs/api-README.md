# API Services

This directory contains API service modules for the Student Portal backend integration.

## Overview

Each service module encapsulates API endpoints for a specific domain (courses, assignments, tests, etc.) and provides:

- **Type-safe API calls** using TypeScript
- **Consistent error handling** using the centralized error handler
- **Proper request/response transformation**
- **Clear documentation** with JSDoc comments

## Services

### Course API (`course-api.ts`)

Handles all course-related operations for students.

**Endpoints:**

1. **`fetchCourses(filters?)`** - Get all student courses
   - Endpoint: `GET /students/me/courses`
   - Params: `status`, `search`
   - Returns: `Course[]`

2. **`fetchCourseById(id)`** - Get course details
   - Endpoint: `GET /courses/{id}`
   - Returns: `CourseDetails`

3. **`fetchCourseModules(courseId)`** - Get course modules
   - Endpoint: `GET /courses/{id}/modules`
   - Returns: `CourseModule[]`

4. **`fetchModuleContent(courseId, moduleId)`** - Get module content
   - Endpoint: `GET /courses/{courseId}/modules/{moduleId}/content`
   - Returns: `CourseContent[]`

5. **`markContentAsViewed(courseId, contentId, payload?)`** - Mark content as viewed
   - Endpoint: `POST /courses/{courseId}/content/{contentId}/view`
   - Body: `{ viewedAt: Date, progress?: number }`
   - Returns: `void`

6. **`fetchCourseProgress(courseId)`** - Get course progress
   - Endpoint: `GET /courses/{id}/progress`
   - Returns: `CourseProgress`

7. **`updateCourseProgress(courseId, payload)`** - Update course progress
   - Endpoint: `POST /courses/{id}/progress`
   - Body: `{ moduleId?, contentId?, progress, completed?, timeSpent? }`
   - Returns: `void`

**Usage Example:**

```typescript
import { courseApi } from '@/services/api';

// Fetch all active courses
const courses = await courseApi.fetchCourses({ status: 'active' });

// Get course details
const courseDetails = await courseApi.fetchCourseById('course-123');

// Mark content as viewed
await courseApi.markContentAsViewed('course-123', 'content-456', {
  viewedAt: new Date(),
  progress: 100
});
```

## Error Handling

All API services use the centralized `handleApiError` utility which:

- Shows toast notifications for errors (configurable)
- Redirects to login on 401 errors (configurable)
- Logs errors to console in development
- Provides user-friendly error messages in Uzbek

Errors are automatically handled, but you can catch them for custom behavior:

```typescript
try {
  const courses = await courseApi.fetchCourses();
} catch (error) {
  // Error already handled (toast shown)
  // Add custom logic here if needed
}
```

## Type Definitions

All types are imported from `@/types/`:

- `Course`, `CourseDetails`, `CourseProgress`, `CourseFilters` - from `@/types/course.types.ts`
- `CourseModule`, `CourseContent` - defined in `course-api.ts`
- `ApiResponse` - from `@/lib/api.ts`

## Testing

Each service has corresponding tests in `__tests__/` directory:

- **Unit tests** for individual functions
- **Error handling tests** for various failure scenarios
- **Mock API responses** using Vitest mocks

Run tests:

```bash
npm test -- course-api.test.ts
```

## Architecture

```
UI Component
    ↓
React Query Hook (useCourses)
    ↓
API Service (courseApi.fetchCourses)
    ↓
Axios Client (api.get)
    ↓ [Auth Token Interceptor]
Backend API
```

## Best Practices

1. **Always use the service layer** - Never call `api.get/post` directly from components
2. **Let errors propagate** - The error handler takes care of user feedback
3. **Use TypeScript types** - Ensure type safety for requests and responses
4. **Document with JSDoc** - Provide clear documentation for all public functions
5. **Write tests** - Cover happy paths and error scenarios

## Future Services

Additional services will be added for:

- `assignment-api.ts` - Assignment operations
- `test-api.ts` - Test/exam operations
- `grade-api.ts` - Grade fetching
- `attendance-api.ts` - Attendance tracking
- `schedule-api.ts` - Schedule fetching
- `notification-api.ts` - Notification operations
- `dashboard-api.ts` - Dashboard data aggregation
