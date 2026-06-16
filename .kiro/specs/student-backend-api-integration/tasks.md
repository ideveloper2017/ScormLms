# Implementation Plan: Student Backend API Integration

## Overview

This implementation plan outlines the tasks for integrating the Student Portal React frontend with the existing Spring Boot backend API. The integration replaces all mock data with real API calls, implements comprehensive data caching using React Query, provides responsive loading states, and handles errors gracefully.

The implementation follows a layered architecture approach:
1. **Foundation Layer**: Core infrastructure (types, API client, error handlers)
2. **Service Layer**: API service modules for each domain
3. **Hook Layer**: React Query hooks for data fetching
4. **UI Layer**: Component integration with loading and error states

## Tasks

- [x] 1. Set up foundation and infrastructure
  - [x] 1.1 Create TypeScript type definitions for all API responses
    - Create type files in `src/types/` for: dashboard, course, assignment, test, grade, attendance, schedule, notification, and api response types
    - Define all interfaces matching backend API response structures
    - Include union types for status fields (e.g., `'active' | 'completed' | 'draft'`)
    - _Requirements: 14.9, 14.10_
  
  - [x] 1.2 Extend query keys factory with new student portal keys
    - Update `src/lib/query-keys.ts` with hierarchical query key structure
    - Add key factories for: dashboard, courses, assignments, tests, grades, attendance, schedule, notifications
    - Follow pattern: `root() → list() → detail(id)`
    - _Requirements: 11.8_
  
  - [x] 1.3 Implement centralized error handler utility
    - Create `src/lib/error-handler.ts` with `handleApiError()` function
    - Handle HTTP status codes: 401, 403, 404, 500, 503
    - Handle network errors: ECONNABORTED, Network Error
    - Include toast notifications with Uzbek messages
    - Add error logging for development mode
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.9, 10.10_
  
  - [x] 1.4 Create reusable skeleton loading components
    - Create `src/components/ui/skeleton.tsx` with CardSkeleton, ListSkeleton, TableSkeleton
    - Implement pulse animation effect
    - Match layout structure of final content
    - Use Uzbek loading text
    - _Requirements: 9.2, 9.3, 9.4, 9.8, 9.9, 9.10_
  
  - [x] 1.5 Create error boundary component for graceful error handling
    - Create `src/components/error-boundary.tsx` class component
    - Implement getDerivedStateFromError and componentDidCatch
    - Display user-friendly error message in Uzbek
    - Include retry button that reloads page
    - _Requirements: 10.1, 10.7_

- [x] 2. Checkpoint - Foundation complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement Dashboard API integration
  - [x] 3.1 Create Dashboard API service
    - Create `src/services/dashboard-api.ts`
    - Implement `fetchDashboardData()`, `fetchStudentProfile()`, `fetchDashboardStats()`
    - Define endpoints: `/api/v1/students/me`, `/api/v1/courses/student/active`, `/api/v1/assignments/student/pending`, `/api/v1/tests/student/upcoming`
    - Handle response transformation and validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 3.2 Create Dashboard React Query hooks
    - Create `src/hooks/useDashboard.ts`
    - Implement `useDashboardData()`, `useStudentProfile()`, `useDashboardStats()` hooks
    - Configure cache time for dashboard data
    - Handle loading, error, and success states
    - _Requirements: 1.5, 1.6, 1.7_
  
  - [x] 3.3 Integrate Dashboard component with API
    - Update Dashboard component to use `useDashboardData()` hook
    - Replace mock data with real API data
    - Display loading state with skeleton cards
    - Handle error state with error display component
    - Calculate and display GPA, total credits, learning streak
    - _Requirements: 1.8, 1.9, 1.10_
  
  - [ ]* 3.4 Write unit tests for Dashboard API service
    - Test successful data fetching
    - Test error handling for network failures
    - Test response data transformation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Implement Course API integration
  - [x] 4.1 Create Course API service
    - Create `src/services/course-api.ts`
    - Implement `fetchCourses()`, `fetchActiveCourses()`, `fetchCourseDetails()`, `fetchStudentProgress()`
    - Define endpoint: `/api/v1/courses/student` with filter params
    - Handle course filtering by status and search
    - _Requirements: 2.1, 2.7, 2.8_
  
  - [x] 4.2 Create Course React Query hooks
    - Create `src/hooks/useCourses.ts`
    - Implement `useCourses()`, `useActiveCourses()`, `useCourseDetails()` hooks
    - Configure 5-minute cache time
    - Enable background revalidation on focus
    - _Requirements: 2.9, 2.10_
  
  - [x] 4.3 Integrate Courses component with API
    - Update Courses component to use `useCourses()` hook
    - Display skeleton cards during loading
    - Show course title, instructor, progress, grade, status, next lesson
    - Display course image or placeholder
    - Show course count in statistics
    - Handle errors with toast notifications
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 4.4 Write unit tests for Course API service
    - Test course fetching with and without filters
    - Test active courses fetching
    - Test course detail fetching
    - Test error handling
    - _Requirements: 2.1, 2.7, 2.8_
  
  - [ ]* 4.5 Write integration tests for useCourses hook
    - Test successful data loading
    - Test caching behavior
    - Test error state handling
    - _Requirements: 2.9, 2.10_

- [x] 5. Implement Assignment API integration
  - [x] 5.1 Create Assignment API service
    - Create `src/services/assignment-api.ts`
    - Implement `fetchAssignments()`, `fetchPendingAssignments()`, `fetchAssignmentDetails()`, `submitAssignment()`
    - Define endpoints: `/api/v1/assignments/student`, `/api/v1/assignments/:id/submit`
    - Handle submission payload with file URL and answer text
    - _Requirements: 3.1, 3.8_
  
  - [x] 5.2 Create Assignment React Query hooks
    - Create `src/hooks/useAssignments.ts`
    - Implement `useAssignments()`, `usePendingAssignments()`, `useSubmitAssignment()` hooks
    - Configure 2-minute cache time
    - Implement optimistic update for assignment submission
    - Handle mutation rollback on failure
    - _Requirements: 3.10, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 5.3 Integrate Assignments component with API
    - Update Assignments component to use `useAssignments()` hook
    - Display skeleton list during loading
    - Show assignment title, course, due date, status, priority
    - Sort assignments by due date ascending
    - Highlight high priority assignments
    - Display submission button for pending assignments
    - Display completion badge for completed assignments
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [x] 5.4 Implement assignment submission flow
    - Add submission form with file upload and text input
    - Call `useSubmitAssignment()` mutation on form submit
    - Update UI optimistically before server confirmation
    - Display success toast on successful submission
    - Invalidate assignments cache after submission
    - _Requirements: 3.9, 12.6, 12.7, 12.9_
  
  - [ ]* 5.5 Write unit tests for Assignment API service
    - Test assignment fetching
    - Test pending assignments fetching
    - Test assignment submission
    - Test error handling
    - _Requirements: 3.1, 3.8_
  
  - [ ]* 5.6 Write integration tests for useAssignments hook
    - Test optimistic update behavior
    - Test rollback on submission failure
    - Test cache invalidation after mutation
    - _Requirements: 3.10, 12.2, 12.3, 12.4_

- [x] 6. Checkpoint - Core features complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Test and Exam API integration
  - [x] 7.1 Create Test API service
    - Create `src/services/test-api.ts`
    - Implement `fetchTests()`, `fetchUpcomingTests()`, `fetchTestDetails()`, `startTest()`, `submitTest()`
    - Define endpoints: `/api/v1/tests/student`, `/api/v1/tests/:id/start`, `/api/v1/tests/:id/submit`
    - Handle test session creation and answer submission
    - _Requirements: 4.1, 4.7_
  
  - [x] 7.2 Create Test React Query hooks
    - Create `src/hooks/useTests.ts`
    - Implement `useTests()`, `useUpcomingTests()`, `useTestDetails()`, `useStartTest()`, `useSubmitTest()` hooks
    - Configure 1-minute cache time
    - Handle mutation for starting and submitting tests
    - _Requirements: 4.9_
  
  - [x] 7.3 Integrate Tests component with API
    - Update Tests component to use `useTests()` hook
    - Display skeleton cards during loading
    - Show test title, course, date, time, duration, question count, proctoring status
    - Separate upcoming and completed tests
    - Display scores for completed tests
    - Display proctoring badge when enabled
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.10_
  
  - [x] 7.4 Implement test start and submission flow
    - Add "Start Test" button that calls `useStartTest()` mutation
    - Navigate to test session page after successful start
    - Implement test submission with answers array
    - Display test result after submission
    - _Requirements: 4.8_
  
  - [ ]* 7.5 Write unit tests for Test API service
    - Test test fetching
    - Test upcoming tests fetching
    - Test starting test
    - Test submitting test
    - Test error handling
    - _Requirements: 4.1, 4.7_

- [x] 8. Implement Grade API integration
  - [x] 8.1 Create Grade API service
    - Create `src/services/grade-api.ts`
    - Implement `fetchGrades()`, `fetchGradesByCourse()`, `calculateGPA()`, `fetchGradeDistribution()`
    - Define endpoint: `/api/v1/grades/student`
    - Support filtering by course ID
    - _Requirements: 5.1_
  
  - [x] 8.2 Create Grade React Query hooks
    - Create `src/hooks/useGrades.ts`
    - Implement `useGrades()`, `useGradesByCourse()`, `useGPA()`, `useGradeDistribution()` hooks
    - Configure 10-minute cache time
    - _Requirements: 5.8_
  
  - [x] 8.3 Integrate Grades component with API
    - Update Grades component to use `useGrades()` hook
    - Display skeleton table during loading
    - Show course name, assignment name, grade letter, score percentage, date
    - Calculate and display overall GPA
    - Group grades by course
    - Sort grades by date descending
    - Display achievement icon for scores above 90
    - Display grade distribution chart
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.10_
  
  - [ ]* 8.4 Write unit tests for Grade API service
    - Test grade fetching
    - Test grades by course fetching
    - Test GPA calculation
    - Test grade distribution fetching
    - _Requirements: 5.1_

- [x] 9. Implement Attendance API integration
  - [x] 9.1 Create Attendance API service
    - Create `src/services/attendance-api.ts`
    - Implement `fetchAttendance()`, `fetchAttendanceByCourse()`, `calculateAttendancePercentage()`, `fetchAttendanceStats()`
    - Define endpoint: `/api/v1/attendance/student`
    - Support filtering by course ID
    - _Requirements: 6.1_
  
  - [x] 9.2 Create Attendance React Query hooks
    - Create `src/hooks/useAttendance.ts`
    - Implement `useAttendance()`, `useAttendanceByCourse()`, `useAttendancePercentage()`, `useAttendanceStats()` hooks
    - Configure 5-minute cache time
    - _Requirements: 6.9_
  
  - [x] 9.3 Integrate Attendance component with API
    - Update Attendance component to use `useAttendance()` hook
    - Display skeleton calendar during loading
    - Show attendance records by date and course
    - Calculate attendance percentage per course
    - Calculate overall attendance percentage
    - Color-code days: green (present), red (absent), yellow (late)
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.10_
  
  - [ ]* 9.4 Write unit tests for Attendance API service
    - Test attendance fetching
    - Test attendance by course fetching
    - Test attendance percentage calculation
    - Test attendance stats fetching
    - _Requirements: 6.1_

- [x] 10. Implement Schedule API integration
  - [x] 10.1 Create Schedule API service
    - Create `src/services/schedule-api.ts`
    - Implement `fetchSchedule()`, `fetchScheduleByWeek()`, `getUpcomingClass()`, `getTodaySchedule()`
    - Define endpoint: `/api/v1/schedule/student`
    - Support filtering by week number
    - _Requirements: 7.1_
  
  - [x] 10.2 Create Schedule React Query hooks
    - Create `src/hooks/useSchedule.ts`
    - Implement `useSchedule()`, `useScheduleByWeek()`, `useUpcomingClass()`, `useTodaySchedule()` hooks
    - Configure 30-minute cache time
    - _Requirements: 7.9_
  
  - [x] 10.3 Integrate Schedule component with API
    - Update Schedule component to use `useSchedule()` hook
    - Display skeleton calendar during loading
    - Show class name, instructor, room, start time, end time
    - Organize classes by day of week and time slot
    - Color-code classes by course
    - Highlight current day
    - Display next upcoming class
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.10_
  
  - [ ]* 10.4 Write unit tests for Schedule API service
    - Test schedule fetching
    - Test schedule by week fetching
    - Test upcoming class fetching
    - Test today's schedule fetching
    - _Requirements: 7.1_

- [x] 11. Checkpoint - All feature APIs integrated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement Notification API integration
  - [x] 12.1 Create Notification API service
    - Create `src/services/notification-api.ts`
    - Implement `fetchNotifications()`, `fetchUnreadNotifications()`, `markAsRead()`, `markAllAsRead()`, `getUnreadCount()`
    - Define endpoints: `/api/v1/notifications/student`, `/api/v1/notifications/:id/read`
    - _Requirements: 8.1, 8.7_
  
  - [x] 12.2 Create Notification React Query hooks
    - Create `src/hooks/useNotifications.ts`
    - Implement `useNotifications()`, `useUnreadNotifications()`, `useMarkAsRead()`, `useMarkAllAsRead()`, `useUnreadCount()` hooks
    - Configure 1-minute cache time
    - Implement optimistic update for mark as read
    - _Requirements: 8.9, 12.1, 12.3, 12.4, 12.5_
  
  - [x] 12.3 Integrate Notifications component with API
    - Update Notifications component to use `useNotifications()` hook
    - Display skeleton list during loading
    - Show notification title, message, time, type
    - Group notifications by type (course, assignment, exam, system)
    - Display unread notifications with bold text
    - Display read notifications with normal text
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.10_
  
  - [x] 12.4 Implement mark as read flow
    - Add click handler that calls `useMarkAsRead()` mutation
    - Update UI optimistically before server confirmation
    - Rollback on failure with error toast
    - Invalidate notification cache after mutation
    - _Requirements: 8.8, 12.6, 12.7, 12.8, 12.9, 12.10_
  
  - [ ]* 12.5 Write unit tests for Notification API service
    - Test notification fetching
    - Test unread notifications fetching
    - Test mark as read
    - Test mark all as read
    - Test unread count fetching
    - _Requirements: 8.1, 8.7_
  
  - [ ]* 12.6 Write integration tests for useNotifications hook
    - Test optimistic update behavior
    - Test rollback on failure
    - Test cache invalidation
    - _Requirements: 8.9, 12.1, 12.3, 12.4_

- [x] 13. Implement authentication token management
  - [x] 13.1 Update Axios client with token interceptors
    - Update `src/lib/api.ts` to include JWT token in Authorization header
    - Add request interceptor to attach token from localStorage
    - Add response interceptor to handle 401 errors
    - _Requirements: 13.1, 13.2_
  
  - [x] 13.2 Implement token refresh mechanism
    - Create token refresh function that calls `/api/v1/auth/refresh-token`
    - Implement request queue during token refresh
    - Prevent multiple simultaneous refresh requests
    - Retry original failed request after successful refresh
    - Clear auth data and redirect on refresh failure
    - _Requirements: 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_
  
  - [ ]* 13.3 Write unit tests for token refresh logic
    - Test token refresh on 401 error
    - Test request queueing during refresh
    - Test redirect on refresh failure
    - Test prevention of multiple refresh requests
    - _Requirements: 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

- [x] 14. Implement data caching and revalidation
  - [x] 14.1 Configure React Query global settings
    - Update `src/main.tsx` with QueryClient configuration
    - Set default stale time and cache time
    - Enable refetch on window focus
    - Enable refetch on reconnect
    - Configure retry logic (3 attempts with exponential backoff)
    - _Requirements: 11.9, 11.10_
  
  - [x] 14.2 Configure cache times per feature
    - Set Course cache to 5 minutes
    - Set Assignment cache to 2 minutes
    - Set Test cache to 1 minute
    - Set Grade cache to 10 minutes
    - Set Attendance cache to 5 minutes
    - Set Schedule cache to 30 minutes
    - Set Notification cache to 1 minute
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [x] 14.3 Implement cache invalidation after mutations
    - Invalidate assignments cache after submission
    - Invalidate tests cache after starting/submitting test
    - Invalidate notifications cache after marking as read
    - Invalidate related queries (e.g., dashboard stats after assignment submission)
    - _Requirements: 11.8, 12.9_
  
  - [ ]* 14.4 Write integration tests for caching behavior
    - Test cache persistence across component remounts
    - Test background revalidation on stale data
    - Test cache invalidation after mutations
    - _Requirements: 11.8, 11.9, 11.10_

- [x] 15. Implement API response validation
  - [x] 15.1 Add runtime type validation with Zod schemas
    - Create Zod schemas for critical data structures in `src/types/`
    - Validate API responses in service layer
    - Handle validation errors with fallback values
    - Log validation errors to console in development
    - _Requirements: 14.1, 14.2, 14.3, 14.7, 14.8, 14.10_
  
  - [x] 15.2 Add date and numeric validation
    - Parse and validate date fields in API responses
    - Validate numeric ranges for scores, percentages, counts
    - Handle invalid dates with fallback to current date
    - Handle invalid numbers with fallback to 0
    - _Requirements: 14.5, 14.6_
  
  - [x] 15.3 Add array validation
    - Validate each array element in API responses
    - Filter out invalid elements with console warning
    - Return empty array if entire response is invalid
    - _Requirements: 14.4_
  
  - [ ]* 15.4 Write unit tests for validation logic
    - Test successful validation
    - Test validation failure with missing fields
    - Test validation failure with invalid types
    - Test fallback value usage
    - _Requirements: 14.1, 14.2, 14.3, 14.5, 14.6, 14.8_

- [x] 16. Implement performance monitoring
  - [x] 16.1 Add request timing instrumentation
    - Create `src/lib/performance-monitor.ts` with `monitorApiRequest()` function
    - Record request start and end times
    - Calculate request duration
    - Log slow queries (>3 seconds) to console
    - Display timeout warning (>5 seconds) to user
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 16.2 Configure React Query DevTools
    - Add React Query DevTools to main.tsx for development
    - Enable in development mode only
    - Position in bottom-right corner
    - _Requirements: 15.6_
  
  - [x] 16.3 Enable performance optimizations
    - Enable request deduplication in React Query
    - Enable automatic request cancellation on unmount
    - Implement pagination for large datasets (>50 records)
    - Implement infinite scroll for lists (>100 items)
    - _Requirements: 15.7, 15.8, 15.9, 15.10_
  
  - [ ]* 16.4 Write integration tests for performance features
    - Test request deduplication for simultaneous calls
    - Test request cancellation on unmount
    - Test pagination behavior
    - _Requirements: 15.7, 15.8, 15.9_

- [x] 17. Final integration and polish
  - [x] 17.1 Remove all mock data from components
    - Search for mock data arrays and objects in component files
    - Replace with API hook calls
    - Verify no hardcoded data remains
    - _Requirements: All requirements_
  
  - [x] 17.2 Add loading state transitions
    - Ensure minimum 300ms display time for loading states
    - Add smooth fade-in animations for data display
    - Add smooth fade-out animations for loading states
    - _Requirements: 9.5, 9.6, 9.7_
  
  - [x] 17.3 Implement retry functionality for errors
    - Add retry button to error display component
    - Call React Query refetch on retry button click
    - Show loading state during retry
    - _Requirements: 10.7, 10.8_
  
  - [x] 17.4 Wrap application with error boundary
    - Update root component to wrap with ErrorBoundary
    - Test error boundary with intentional error
    - Verify graceful error display
    - _Requirements: 10.1_
  
  - [ ]* 17.5 Write end-to-end tests for critical flows
    - Test Dashboard loading and data display
    - Test Course list with filtering
    - Test Assignment submission flow
    - Test Notification mark as read flow
    - _Requirements: All requirements_

- [x] 18. Implement Face Recognition Backend Integration
  - [x] 18.1 Create Face Recognition API service
    - Create `src/services/face-recognition-api.ts`
    - Implement `uploadFacePhoto()` to store face image in backend
    - Implement `getFacePhotoUrl()` to retrieve user's stored face photo from PostgreSQL
    - Implement `verifyFaceMatch()` to send face descriptor and compare with stored data
    - Define endpoints: `/api/v1/users/face/upload`, `/api/v1/users/face/photo`, `/api/v1/users/face/verify`
    - Handle base64 image encoding and multipart file uploads
    - _Requirements: Authentication, Student profile_
  
  - [x] 18.2 Update Face Recognition component to use backend API
    - Update `src/components/auth/face-recognition.tsx` to fetch reference image from backend
    - Replace hardcoded `referenceImage` prop with API call to `getFacePhotoUrl()`
    - Send face descriptor to backend for server-side verification
    - Handle cases where user has no stored face photo (first-time setup)
    - Display appropriate messages for setup vs verification flows
    - _Requirements: 13.1 (authentication token)_
  
  - [x] 18.3 Implement face photo upload flow
    - Create face photo capture component for first-time users
    - Allow users to take photo from webcam
    - Send captured photo to backend via `uploadFacePhoto()`
    - Store photo URL in user profile after successful upload
    - Update AuthContext to track face recognition status
    - _Requirements: Dashboard integration_
  
  - [x] 18.4 Integrate face verification with login flow
    - Update `LoginForm.tsx` to check if user has face photo after successful login
    - Redirect to face verification if photo exists
    - Redirect to face setup if no photo exists (optional for first-time)
    - Update `auth-context.tsx` to manage face recognition state
    - Allow skip option for users who don't want face recognition
    - _Requirements: 13.1, 13.2 (authentication)_
  
  - [x] 18.5 Add backend support for face data storage
    - Verify backend has endpoint for storing face photos (check `/api/v1/users/face/*`)
    - Ensure PostgreSQL user table has `facePhotoUrl` or similar field
    - Test photo upload and retrieval from backend
    - Handle photo deletion if user wants to re-register face
    - _Requirements: Database integration_
  
  - [ ]* 18.6 Write unit tests for face recognition API service
    - Test face photo upload with valid image
    - Test face photo retrieval for existing user
    - Test face verification with matching/non-matching faces
    - Test error handling for missing face photo
    - Test error handling for failed upload
    - _Requirements: 18.1_
  
  - [ ]* 18.7 Write integration tests for face recognition flow
    - Test complete flow: login → face photo check → verification
    - Test first-time setup: login → no photo → capture → upload
    - Test skip functionality
    - Test error recovery and retry
    - _Requirements: 18.2, 18.3, 18.4_

- [x] 19. Final checkpoint - Complete integration
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all mock data has been replaced with real API calls
  - Verify loading states display correctly
  - Verify error handling works as expected
  - Verify caching and revalidation work properly
  - Verify face recognition connects to backend and uses PostgreSQL data
  - Test full user flows in browser including face recognition

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- The implementation follows a bottom-up approach: foundation → services → hooks → UI integration
- TypeScript provides compile-time type safety for all API interactions
- React Query handles all caching, revalidation, and request lifecycle management
- Error handling is centralized and provides consistent user experience in Uzbek language
- Performance monitoring helps identify bottlenecks during development
- All components use existing UI library components (shadcn/ui) for consistency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["3.1", "4.1", "5.1", "7.1", "8.1", "9.1", "10.1", "12.1"] },
    { "id": 3, "tasks": ["3.2", "4.2", "5.2", "7.2", "8.2", "9.2", "10.2", "12.2"] },
    { "id": 4, "tasks": ["3.3", "4.3", "5.3", "7.3", "8.3", "9.3", "10.3", "12.3"] },
    { "id": 5, "tasks": ["3.4", "4.4", "5.4", "7.4", "12.4"] },
    { "id": 6, "tasks": ["4.5", "5.5", "7.5", "8.4", "9.4", "10.4", "12.5"] },
    { "id": 7, "tasks": ["5.6", "12.6"] },
    { "id": 8, "tasks": ["13.1"] },
    { "id": 9, "tasks": ["13.2"] },
    { "id": 10, "tasks": ["13.3", "14.1"] },
    { "id": 11, "tasks": ["14.2"] },
    { "id": 12, "tasks": ["14.3"] },
    { "id": 13, "tasks": ["14.4", "15.1"] },
    { "id": 14, "tasks": ["15.2", "15.3"] },
    { "id": 15, "tasks": ["15.4", "16.1"] },
    { "id": 16, "tasks": ["16.2", "16.3"] },
    { "id": 17, "tasks": ["16.4", "17.1"] },
    { "id": 18, "tasks": ["17.2", "17.3", "17.4"] },
    { "id": 19, "tasks": ["17.5", "18.1"] },
    { "id": 20, "tasks": ["18.2"] },
    { "id": 21, "tasks": ["18.3", "18.4"] },
    { "id": 22, "tasks": ["18.5"] },
    { "id": 23, "tasks": ["18.6", "18.7"] }
  ]
}
```
