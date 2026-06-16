# Requirements Document

## Introduction

This document specifies the requirements for integrating the Student Portal frontend (React + TypeScript) with the existing Spring Boot backend API. The system will replace mock data with real API calls, implement proper data caching, loading states, and error handling to provide students with accurate, real-time information about their courses, assignments, tests, grades, attendance, schedule, and notifications.

## Glossary

- **Student_Portal**: The React frontend application that displays student information
- **Backend_API**: The Spring Boot REST API server running on localhost:8080
- **React_Query**: TanStack Query library for data fetching and caching
- **API_Client**: Axios instance configured with authentication and interceptors
- **JWT_Token**: JSON Web Token stored in localStorage for authentication
- **Loading_State**: UI state indicating data is being fetched from the server
- **Error_Handler**: Component responsible for managing and displaying API errors
- **Dashboard**: The main student interface showing overview statistics
- **Course_Service**: API service for course-related endpoints
- **Assignment_Service**: API service for assignment-related endpoints
- **Test_Service**: API service for test and exam-related endpoints
- **Grade_Service**: API service for grade and scoring-related endpoints
- **Attendance_Service**: API service for attendance tracking endpoints
- **Schedule_Service**: API service for class schedule endpoints
- **Notification_Service**: API service for notifications and announcements
- **Cache_Strategy**: React Query configuration for data persistence and revalidation
- **Optimistic_Update**: UI update before server confirmation for better UX
- **Toast_Notification**: Brief UI message for user feedback
- **Student_Data**: Information about the authenticated student
- **Course_Data**: Information about courses the student is enrolled in
- **Assignment_Data**: Information about assignments and submissions
- **Test_Data**: Information about tests, exams, and proctoring sessions
- **Grade_Data**: Information about scores and academic performance
- **Attendance_Data**: Information about class attendance records
- **Schedule_Data**: Information about class timetable
- **Notification_Data**: Information about announcements and alerts

## Requirements

### Requirement 1: Dashboard Data Integration

**User Story:** Talaba sifatida, Dashboard sahifasida real ma'lumotlarimni ko'rishni xohlayman, shunda o'quv jarayonim haqida aniq statistikaga ega bo'laman.

#### Acceptance Criteria

1. WHEN THE Student_Portal loads THE Dashboard, THE Dashboard SHALL fetch Student_Data from Backend_API endpoint /api/v1/students/me
2. WHEN THE Student_Portal loads THE Dashboard, THE Dashboard SHALL fetch active Course_Data from Backend_API endpoint /api/v1/courses/student/active
3. WHEN THE Student_Portal loads THE Dashboard, THE Dashboard SHALL fetch pending Assignment_Data from Backend_API endpoint /api/v1/assignments/student/pending
4. WHEN THE Student_Portal loads THE Dashboard, THE Dashboard SHALL fetch upcoming Test_Data from Backend_API endpoint /api/v1/tests/student/upcoming
5. WHEN THE Student_Portal loads THE Dashboard, THE Dashboard SHALL display Loading_State within 100 milliseconds of initiating the fetch
6. WHEN THE Backend_API returns data successfully, THE Dashboard SHALL replace Loading_State with actual data within 200 milliseconds
7. WHEN THE Backend_API returns an error response, THE Dashboard SHALL display Error_Handler with descriptive message
8. THE Dashboard SHALL calculate and display GPA from Grade_Data returned by Backend_API
9. THE Dashboard SHALL calculate and display total credits from Course_Data returned by Backend_API
10. THE Dashboard SHALL display current learning streak from Attendance_Data returned by Backend_API

### Requirement 2: Course List Integration

**User Story:** Talaba sifatida, Kurslar sahifasida real kurslarimni ko'rishni xohlayman, shunda o'quv dasturim haqida to'liq ma'lumotga ega bo'laman.

#### Acceptance Criteria

1. WHEN THE Student_Portal navigates to Courses page, THE Course_Service SHALL fetch Course_Data from Backend_API endpoint /api/v1/courses/student
2. WHEN THE Course_Service fetches courses, THE Student_Portal SHALL display Loading_State with skeleton cards
3. WHEN THE Backend_API returns Course_Data, THE Student_Portal SHALL display course title, instructor, progress, grade, status, and next lesson
4. WHEN THE Backend_API returns Course_Data, THE Student_Portal SHALL display course image if provided, or placeholder image otherwise
5. WHEN THE Student_Portal displays courses, THE Student_Portal SHALL show course count in statistics card
6. WHEN THE Backend_API returns error, THE Error_Handler SHALL display Toast_Notification with error message
7. THE Student_Portal SHALL filter courses by status (active, completed, draft) based on Backend_API data
8. THE Student_Portal SHALL search courses by title and instructor based on Backend_API data
9. THE Course_Service SHALL cache Course_Data for 5 minutes using React_Query
10. WHEN THE Student_Portal navigates away and back, THE Student_Portal SHALL display cached data while revalidating

### Requirement 3: Assignment List Integration

**User Story:** Talaba sifatida, Topshiriqlar sahifasida real topshiriqlarimni ko'rishni xohlayman, shunda muddatlarni kuzatib borishim mumkin.

#### Acceptance Criteria

1. WHEN THE Student_Portal navigates to Assignments page, THE Assignment_Service SHALL fetch Assignment_Data from Backend_API endpoint /api/v1/assignments/student
2. WHEN THE Assignment_Service fetches assignments, THE Student_Portal SHALL display Loading_State with skeleton list
3. WHEN THE Backend_API returns Assignment_Data, THE Student_Portal SHALL display assignment title, course, due date, status, and priority
4. WHEN THE Backend_API returns Assignment_Data, THE Student_Portal SHALL sort assignments by due date ascending
5. WHEN THE Backend_API returns Assignment_Data, THE Student_Portal SHALL highlight high priority assignments
6. WHEN THE Backend_API returns Assignment_Data with status pending, THE Student_Portal SHALL display submission button
7. WHEN THE Backend_API returns Assignment_Data with status completed, THE Student_Portal SHALL display completion badge
8. WHEN THE student submits an assignment, THE Assignment_Service SHALL send POST request to Backend_API endpoint /api/v1/assignments/:id/submit
9. WHEN THE assignment submission succeeds, THE Student_Portal SHALL display success Toast_Notification and update status using Optimistic_Update
10. THE Assignment_Service SHALL cache Assignment_Data for 2 minutes using React_Query

### Requirement 4: Test and Exam Integration

**User Story:** Talaba sifatida, Testlar sahifasida imtihonlarim va natijalarimni ko'rishni xohlayman, shunda tayyorgarlik ko'rishim mumkin.

#### Acceptance Criteria

1. WHEN THE Student_Portal navigates to Tests page, THE Test_Service SHALL fetch Test_Data from Backend_API endpoint /api/v1/tests/student
2. WHEN THE Test_Service fetches tests, THE Student_Portal SHALL display Loading_State with skeleton cards
3. WHEN THE Backend_API returns Test_Data, THE Student_Portal SHALL display test title, course, date, time, duration, question count, and proctoring status
4. WHEN THE Backend_API returns Test_Data, THE Student_Portal SHALL display upcoming tests in separate section
5. WHEN THE Backend_API returns Test_Data, THE Student_Portal SHALL display completed tests with scores
6. WHEN THE Backend_API returns Test_Data with proctoring enabled, THE Student_Portal SHALL display proctoring badge
7. WHEN THE student starts a test, THE Test_Service SHALL send POST request to Backend_API endpoint /api/v1/tests/:id/start
8. WHEN THE test start succeeds, THE Student_Portal SHALL navigate to test session page
9. THE Test_Service SHALL cache Test_Data for 1 minute using React_Query
10. WHEN THE Backend_API returns error, THE Error_Handler SHALL display Toast_Notification with error message

### Requirement 5: Grade Display Integration

**User Story:** Talaba sifatida, Baholar sahifasida fanlar bo'yicha baholarimni ko'rishni xohlayman, shunda akademik natijalarimni kuzatishim mumkin.

#### Acceptance Criteria

1. WHEN THE Student_Portal navigates to Grades page, THE Grade_Service SHALL fetch Grade_Data from Backend_API endpoint /api/v1/grades/student
2. WHEN THE Grade_Service fetches grades, THE Student_Portal SHALL display Loading_State with skeleton table
3. WHEN THE Backend_API returns Grade_Data, THE Student_Portal SHALL display course name, assignment name, grade letter, score percentage, and date
4. WHEN THE Backend_API returns Grade_Data, THE Student_Portal SHALL calculate and display overall GPA
5. WHEN THE Backend_API returns Grade_Data, THE Student_Portal SHALL group grades by course
6. WHEN THE Backend_API returns Grade_Data, THE Student_Portal SHALL sort grades by date descending
7. WHEN THE Backend_API returns Grade_Data with score above 90, THE Student_Portal SHALL display achievement icon
8. THE Grade_Service SHALL cache Grade_Data for 10 minutes using React_Query
9. WHEN THE Backend_API returns error, THE Error_Handler SHALL display Toast_Notification with error message
10. THE Student_Portal SHALL display grade distribution chart based on Backend_API data

### Requirement 6: Attendance Tracking Integration

**User Story:** Talaba sifatida, Davomat sahifasida qatnashish statistikamni ko'rishni xohlayman, shunda ishtirok foizimni bilaman.

#### Acceptance Criteria

1. WHEN THE Student_Portal navigates to Attendance page, THE Attendance_Service SHALL fetch Attendance_Data from Backend_API endpoint /api/v1/attendance/student
2. WHEN THE Attendance_Service fetches attendance, THE Student_Portal SHALL display Loading_State with skeleton calendar
3. WHEN THE Backend_API returns Attendance_Data, THE Student_Portal SHALL display attendance records by date and course
4. WHEN THE Backend_API returns Attendance_Data, THE Student_Portal SHALL calculate attendance percentage per course
5. WHEN THE Backend_API returns Attendance_Data, THE Student_Portal SHALL calculate overall attendance percentage
6. WHEN THE Backend_API returns Attendance_Data, THE Student_Portal SHALL display present days in green
7. WHEN THE Backend_API returns Attendance_Data, THE Student_Portal SHALL display absent days in red
8. WHEN THE Backend_API returns Attendance_Data, THE Student_Portal SHALL display late arrivals in yellow
9. THE Attendance_Service SHALL cache Attendance_Data for 5 minutes using React_Query
10. WHEN THE Backend_API returns error, THE Error_Handler SHALL display Toast_Notification with error message

### Requirement 7: Class Schedule Integration

**User Story:** Talaba sifatida, Dars jadvali sahifasida haftalik jadvaliimni ko'rishni xohlayman, shunda darslarimni rejalashtira olaman.

#### Acceptance Criteria

1. WHEN THE Student_Portal navigates to Schedule page, THE Schedule_Service SHALL fetch Schedule_Data from Backend_API endpoint /api/v1/schedule/student
2. WHEN THE Schedule_Service fetches schedule, THE Student_Portal SHALL display Loading_State with skeleton calendar
3. WHEN THE Backend_API returns Schedule_Data, THE Student_Portal SHALL display class name, instructor, room, start time, and end time
4. WHEN THE Backend_API returns Schedule_Data, THE Student_Portal SHALL organize classes by day of week
5. WHEN THE Backend_API returns Schedule_Data, THE Student_Portal SHALL organize classes by time slot
6. WHEN THE Backend_API returns Schedule_Data, THE Student_Portal SHALL color-code classes by course
7. WHEN THE Backend_API returns Schedule_Data, THE Student_Portal SHALL display current day with highlight
8. WHEN THE Backend_API returns Schedule_Data, THE Student_Portal SHALL display next upcoming class
9. THE Schedule_Service SHALL cache Schedule_Data for 30 minutes using React_Query
10. WHEN THE Backend_API returns error, THE Error_Handler SHALL display Toast_Notification with error message

### Requirement 8: Notification Center Integration

**User Story:** Talaba sifatida, Xabarlar sahifasida bildirishnomalar va e'lonlarni ko'rishni xohlayman, shunda muhim yangiliklar haqida xabardor bo'laman.

#### Acceptance Criteria

1. WHEN THE Student_Portal navigates to Notifications page, THE Notification_Service SHALL fetch Notification_Data from Backend_API endpoint /api/v1/notifications/student
2. WHEN THE Notification_Service fetches notifications, THE Student_Portal SHALL display Loading_State with skeleton list
3. WHEN THE Backend_API returns Notification_Data, THE Student_Portal SHALL display notification title, message, time, and type
4. WHEN THE Backend_API returns Notification_Data, THE Student_Portal SHALL group notifications by type (course, assignment, exam, system)
5. WHEN THE Backend_API returns Notification_Data, THE Student_Portal SHALL display unread notifications with bold text
6. WHEN THE Backend_API returns Notification_Data, THE Student_Portal SHALL display read notifications with normal text
7. WHEN THE student clicks a notification, THE Notification_Service SHALL send PUT request to Backend_API endpoint /api/v1/notifications/:id/read
8. WHEN THE notification mark as read succeeds, THE Student_Portal SHALL update UI using Optimistic_Update
9. THE Notification_Service SHALL cache Notification_Data for 1 minute using React_Query
10. WHEN THE Backend_API returns error, THE Error_Handler SHALL display Toast_Notification with error message

### Requirement 9: Loading State Management

**User Story:** Talaba sifatida, ma'lumotlar yuklanayotganda vizual ko'rsatkich ko'rishni xohlayman, shunda tizim ishlab turganini bilaman.

#### Acceptance Criteria

1. WHEN THE Student_Portal initiates API request, THE Student_Portal SHALL display Loading_State within 100 milliseconds
2. WHEN THE Student_Portal displays Loading_State for lists, THE Student_Portal SHALL display skeleton screens
3. WHEN THE Student_Portal displays Loading_State for cards, THE Student_Portal SHALL display skeleton cards
4. WHEN THE Student_Portal displays Loading_State for tables, THE Student_Portal SHALL display skeleton rows
5. WHEN THE Backend_API responds with data, THE Student_Portal SHALL transition from Loading_State to data display within 200 milliseconds
6. WHEN THE Backend_API responds with data, THE Student_Portal SHALL animate the transition smoothly
7. THE Loading_State SHALL display for minimum 300 milliseconds to avoid flashing
8. THE Loading_State SHALL match the layout of the final content
9. THE Loading_State SHALL use pulse animation effect
10. THE Loading_State SHALL display loading text in Uzbek language

### Requirement 10: Error Handling and Recovery

**User Story:** Talaba sifatida, xatolik yuz berganda tushunarli xabar ko'rishni va qayta urinishni xohlayman, shunda muammoni hal qila olaman.

#### Acceptance Criteria

1. WHEN THE Backend_API returns HTTP 401, THE Error_Handler SHALL redirect student to login page
2. WHEN THE Backend_API returns HTTP 403, THE Error_Handler SHALL display Toast_Notification stating insufficient permissions
3. WHEN THE Backend_API returns HTTP 404, THE Error_Handler SHALL display Toast_Notification stating resource not found
4. WHEN THE Backend_API returns HTTP 500, THE Error_Handler SHALL display Toast_Notification stating server error
5. WHEN THE Backend_API request times out, THE Error_Handler SHALL display Toast_Notification stating connection timeout
6. WHEN THE Backend_API is unreachable, THE Error_Handler SHALL display Toast_Notification stating server unavailable
7. WHEN THE Error_Handler displays error, THE Error_Handler SHALL provide retry button
8. WHEN THE student clicks retry button, THE Student_Portal SHALL reattempt the failed request
9. WHEN THE Backend_API returns error with message field, THE Error_Handler SHALL display the message in Toast_Notification
10. THE Error_Handler SHALL log errors to browser console for debugging

### Requirement 11: Data Caching and Revalidation

**User Story:** Talaba sifatida, sahifalar orasida tez navigatsiya qilishni xohlayman, shunda kutish vaqtim kamalib, samaradorlik oshsin.

#### Acceptance Criteria

1. WHEN THE Student_Portal fetches Course_Data, THE React_Query SHALL cache data for 5 minutes
2. WHEN THE Student_Portal fetches Assignment_Data, THE React_Query SHALL cache data for 2 minutes
3. WHEN THE Student_Portal fetches Test_Data, THE React_Query SHALL cache data for 1 minute
4. WHEN THE Student_Portal fetches Grade_Data, THE React_Query SHALL cache data for 10 minutes
5. WHEN THE Student_Portal fetches Attendance_Data, THE React_Query SHALL cache data for 5 minutes
6. WHEN THE Student_Portal fetches Schedule_Data, THE React_Query SHALL cache data for 30 minutes
7. WHEN THE Student_Portal fetches Notification_Data, THE React_Query SHALL cache data for 1 minute
8. WHEN THE cache expires, THE React_Query SHALL revalidate data in background
9. WHEN THE Student_Portal regains focus, THE React_Query SHALL revalidate all active queries
10. WHEN THE Student_Portal reconnects after offline, THE React_Query SHALL revalidate all active queries

### Requirement 12: Optimistic Updates for Better UX

**User Story:** Talaba sifatida, amallarni bajarishda darhol natija ko'rishni xohlayman, shunda interfeys tezkor his qilsin.

#### Acceptance Criteria

1. WHEN THE student marks notification as read, THE Student_Portal SHALL update UI before Backend_API confirms
2. WHEN THE student submits assignment, THE Student_Portal SHALL update status before Backend_API confirms
3. WHEN THE Optimistic_Update succeeds on Backend_API, THE Student_Portal SHALL keep the optimistic change
4. WHEN THE Optimistic_Update fails on Backend_API, THE Student_Portal SHALL rollback to previous state
5. WHEN THE Optimistic_Update fails on Backend_API, THE Student_Portal SHALL display error Toast_Notification
6. THE Optimistic_Update SHALL complete UI update within 50 milliseconds
7. THE Optimistic_Update SHALL animate the change smoothly
8. THE Optimistic_Update SHALL maintain data consistency with React_Query cache
9. THE Optimistic_Update SHALL invalidate related queries after server confirmation
10. THE Optimistic_Update SHALL provide visual feedback during rollback if failure occurs

### Requirement 13: Authentication Token Management

**User Story:** Talaba sifatida, sessiyam davom etayotganda qayta login qilmasdan ishlashni xohlayman, shunda uzluksiz foydalanishim mumkin.

#### Acceptance Criteria

1. WHEN THE Student_Portal makes API request, THE API_Client SHALL include JWT_Token in Authorization header
2. WHEN THE JWT_Token is missing, THE API_Client SHALL redirect to login page
3. WHEN THE Backend_API returns HTTP 401 with token expired, THE API_Client SHALL attempt token refresh
4. WHEN THE API_Client refreshes token, THE API_Client SHALL send refresh token to Backend_API endpoint /api/v1/auth/refresh-token
5. WHEN THE token refresh succeeds, THE API_Client SHALL store new JWT_Token in localStorage
6. WHEN THE token refresh succeeds, THE API_Client SHALL retry the original failed request
7. WHEN THE token refresh fails, THE API_Client SHALL clear authentication data
8. WHEN THE token refresh fails, THE API_Client SHALL redirect to login page
9. THE API_Client SHALL prevent multiple simultaneous refresh token requests
10. THE API_Client SHALL queue requests during token refresh and execute after completion

### Requirement 14: API Response Validation

**User Story:** Developer sifatida, backend'dan kelgan ma'lumotlarni validatsiya qilishni xohlayman, shunda xatolarni erta aniqlay olaman.

#### Acceptance Criteria

1. WHEN THE Backend_API returns data, THE Student_Portal SHALL validate response structure using TypeScript types
2. WHEN THE Backend_API returns data with missing required fields, THE Error_Handler SHALL display validation error
3. WHEN THE Backend_API returns data with invalid field types, THE Error_Handler SHALL display validation error
4. WHEN THE Backend_API returns array, THE Student_Portal SHALL validate each array element
5. WHEN THE Backend_API returns date field, THE Student_Portal SHALL parse and validate date format
6. WHEN THE Backend_API returns numeric field, THE Student_Portal SHALL validate numeric range
7. WHEN THE validation fails, THE Error_Handler SHALL log detailed error to console
8. WHEN THE validation fails, THE Student_Portal SHALL use fallback default values where applicable
9. THE Student_Portal SHALL define TypeScript interfaces for all API responses
10. THE Student_Portal SHALL use Zod schema validation for critical data structures

### Requirement 15: Performance Monitoring and Optimization

**User Story:** Developer sifatida, API chaqiruvlar tezligini monitoring qilishni xohlayman, shunda performance muammolarini aniqlay olaman.

#### Acceptance Criteria

1. WHEN THE Student_Portal makes API request, THE Student_Portal SHALL record request start time
2. WHEN THE Backend_API responds, THE Student_Portal SHALL record request end time
3. WHEN THE request completes, THE Student_Portal SHALL calculate request duration
4. WHEN THE request duration exceeds 3 seconds, THE Student_Portal SHALL log slow query warning to console
5. WHEN THE request duration exceeds 5 seconds, THE Student_Portal SHALL display timeout warning to user
6. THE Student_Portal SHALL use React_Query DevTools in development mode
7. THE Student_Portal SHALL enable request deduplication in React_Query
8. THE Student_Portal SHALL enable request cancellation when component unmounts
9. THE Student_Portal SHALL implement pagination for large data sets (more than 50 records)
10. THE Student_Portal SHALL implement infinite scroll for lists exceeding 100 items

## Special Requirements Guidance

### API Service Layer

Each feature SHALL have a dedicated API service module:

**Course Service Requirements:**
- WHEN THE Course_Service is imported, THE Course_Service SHALL provide methods: `fetchCourses()`, `fetchCourseDetails(id)`, `fetchStudentProgress(courseId)`
- THE Course_Service SHALL use API_Client for all requests
- THE Course_Service SHALL return typed TypeScript responses

**Assignment Service Requirements:**
- WHEN THE Assignment_Service is imported, THE Assignment_Service SHALL provide methods: `fetchAssignments()`, `fetchAssignmentDetails(id)`, `submitAssignment(id, data)`
- THE Assignment_Service SHALL use API_Client for all requests
- THE Assignment_Service SHALL return typed TypeScript responses

**Test Service Requirements:**
- WHEN THE Test_Service is imported, THE Test_Service SHALL provide methods: `fetchTests()`, `fetchTestDetails(id)`, `startTest(id)`, `submitTest(id, answers)`
- THE Test_Service SHALL use API_Client for all requests
- THE Test_Service SHALL return typed TypeScript responses

**Grade Service Requirements:**
- WHEN THE Grade_Service is imported, THE Grade_Service SHALL provide methods: `fetchGrades()`, `fetchGradesByCourse(courseId)`, `calculateGPA()`
- THE Grade_Service SHALL use API_Client for all requests
- THE Grade_Service SHALL return typed TypeScript responses

**Attendance Service Requirements:**
- WHEN THE Attendance_Service is imported, THE Attendance_Service SHALL provide methods: `fetchAttendance()`, `fetchAttendanceByCourse(courseId)`, `calculateAttendancePercentage()`
- THE Attendance_Service SHALL use API_Client for all requests
- THE Attendance_Service SHALL return typed TypeScript responses

**Schedule Service Requirements:**
- WHEN THE Schedule_Service is imported, THE Schedule_Service SHALL provide methods: `fetchSchedule()`, `fetchScheduleByWeek(weekNumber)`, `getUpcomingClass()`
- THE Schedule_Service SHALL use API_Client for all requests
- THE Schedule_Service SHALL return typed TypeScript responses

**Notification Service Requirements:**
- WHEN THE Notification_Service is imported, THE Notification_Service SHALL provide methods: `fetchNotifications()`, `markAsRead(id)`, `markAllAsRead()`
- THE Notification_Service SHALL use API_Client for all requests
- THE Notification_Service SHALL return typed TypeScript responses

### React Query Hooks

Each service SHALL have corresponding React Query hooks:

**Hook Requirements:**
- WHEN THE custom hook is called, THE hook SHALL use React_Query `useQuery` for GET requests
- WHEN THE custom hook is called, THE hook SHALL use React_Query `useMutation` for POST/PUT/DELETE requests
- THE hook SHALL configure appropriate cache time
- THE hook SHALL configure appropriate stale time
- THE hook SHALL handle loading and error states
- THE hook SHALL provide refetch functionality
- THE hook SHALL implement retry logic for failed requests

### TypeScript Type Definitions

**Type Definition Requirements:**
- THE Student_Portal SHALL define interface for Student_Data with fields: id, name, email, studentId, gpa, photo, roles
- THE Student_Portal SHALL define interface for Course_Data with fields: id, title, description, instructor, progress, grade, status, nextLesson, dueDate
- THE Student_Portal SHALL define interface for Assignment_Data with fields: id, title, course, dueDate, status, priority, description
- THE Student_Portal SHALL define interface for Test_Data with fields: id, title, course, date, time, duration, questions, proctoring
- THE Student_Portal SHALL define interface for Grade_Data with fields: id, course, assignment, grade, score, date
- THE Student_Portal SHALL define interface for Attendance_Data with fields: id, course, date, status, reason
- THE Student_Portal SHALL define interface for Schedule_Data with fields: id, course, instructor, room, dayOfWeek, startTime, endTime
- THE Student_Portal SHALL define interface for Notification_Data with fields: id, title, message, time, type, isRead

