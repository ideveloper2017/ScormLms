/**
 * ErrorBoundary Integration Example
 * 
 * This file shows a minimal working example of how to integrate
 * the ErrorBoundary component into App.tsx
 * 
 * QUICK START:
 * Copy the relevant code sections into your App.tsx
 */

import { ErrorBoundary } from '@/components/error-boundary';
import { Routes, Route } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════
// OPTION 1: Minimal Integration (5 minutes)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Just wrap your entire Routes block with ErrorBoundary
 * This prevents white screen of death across the entire app
 */
export function AppMinimal() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* ... all your existing routes ... */}
      </Routes>
    </ErrorBoundary>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION 2: Recommended Integration (30 minutes)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wrap major sections with separate boundaries
 * If one section fails, others still work
 */
export function AppRecommended() {
  return (
    <Routes>
      {/* Student routes with their own boundary */}
      <Route
        path="/student/*"
        element={
          <ErrorBoundary>
            <StudentRoutes />
          </ErrorBoundary>
        }
      />

      {/* Teacher routes with their own boundary */}
      <Route
        path="/teacher/*"
        element={
          <ErrorBoundary>
            <TeacherRoutes />
          </ErrorBoundary>
        }
      />

      {/* Admin routes with their own boundary */}
      <Route
        path="/admin/*"
        element={
          <ErrorBoundary>
            <AdminRoutes />
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// OPTION 3: Granular Integration (1-2 hours)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wrap individual page components
 * Maximum isolation - one page error doesn't affect others
 */
export function AppGranular() {
  return (
    <Routes>
      <Route
        path="/student/dashboard"
        element={
          <ErrorBoundary>
            <StudentDashboard />
          </ErrorBoundary>
        }
      />
      
      <Route
        path="/student/courses"
        element={
          <ErrorBoundary>
            <StudentCourses />
          </ErrorBoundary>
        }
      />

      {/* Repeat for each route */}
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COPY-PASTE READY: Integration into Existing App.tsx
// ═══════════════════════════════════════════════════════════════════════════

/**
 * STEP 1: Add this import at the top of App.tsx
 */
// import { ErrorBoundary } from '@/components/error-boundary';

/**
 * STEP 2: Wrap your return statement's Routes component
 * 
 * BEFORE:
 * return (
 *   <>
 *     <Routes>
 *       ... routes ...
 *     </Routes>
 *     <Toaster />
 *   </>
 * );
 * 
 * AFTER:
 * return (
 *   <>
 *     <ErrorBoundary>
 *       <Routes>
 *         ... routes ...
 *       </Routes>
 *     </ErrorBoundary>
 *     <Toaster />
 *   </>
 * );
 */

// ═══════════════════════════════════════════════════════════════════════════
// PRACTICAL EXAMPLES FOR YOUR PROJECT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Example: Protect Student Dashboard
 */
export function StudentDashboardRoute() {
  return (
    <Route
      path="/student/dashboard"
      element={
        <P roles={['ROLE_STUDENT']}>
          <ErrorBoundary>
            <StudentDashboard />
          </ErrorBoundary>
        </P>
      }
    />
  );
}

/**
 * Example: Protect Data Fetching Component
 */
import { useCourses } from '@/hooks/useCourses';

export function CourseList() {
  return (
    <ErrorBoundary>
      <CourseListContent />
    </ErrorBoundary>
  );
}

function CourseListContent() {
  const { data, isLoading, error } = useCourses();

  // Throw error to boundary
  if (error) throw error;

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div>
      {data.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

/**
 * Example: Handle Async Errors in Forms
 */
import { useErrorBoundary } from '@/components/error-boundary';

export function AssignmentSubmitForm() {
  const throwError = useErrorBoundary();
  const { mutateAsync } = useSubmitAssignment();

  const handleSubmit = async (data: any) => {
    try {
      await mutateAsync(data);
      toast.success('Muvaffaqiyatli yuborildi');
    } catch (error) {
      // Let error boundary handle it
      throwError(error as Error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTING THE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a test component to verify ErrorBoundary works
 */
export function TestErrorComponent() {
  const [shouldThrow, setShouldThrow] = React.useState(false);

  if (shouldThrow) {
    throw new Error('Bu test xatoligi');
  }

  return (
    <div>
      <p>ErrorBoundary test sahifasi</p>
      <button onClick={() => setShouldThrow(true)}>
        Xatolikni chiqarish
      </button>
    </div>
  );
}

/**
 * Add test route to App.tsx (development only)
 */
export function AddTestRoute() {
  return (
    <>
      {import.meta.env.DEV && (
        <Route
          path="/test-error-boundary"
          element={
            <ErrorBoundary>
              <TestErrorComponent />
            </ErrorBoundary>
          }
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPLETE WORKING EXAMPLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete example showing ErrorBoundary with AuthGuard and RoleGuard
 */
import { AuthGuard } from '@/components/auth/auth-guard';
import { RoleGuard } from '@/components/auth/role-guard';
import { DashboardLayout } from '@/components/layout/AdminLayout';

function P({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>
        <RoleGuard allowedRoles={roles}>{children}</RoleGuard>
      </DashboardLayout>
    </AuthGuard>
  );
}

export function CompleteExample() {
  return (
    <Routes>
      {/* Wrap entire student section */}
      <Route
        path="/student/*"
        element={
          <ErrorBoundary>
            <P roles={['ROLE_STUDENT']}>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="courses" element={<Courses />} />
                <Route path="assignments" element={<StudentAssignments />} />
                <Route path="tests" element={<StudentTests />} />
                <Route path="grades" element={<StudentGrades />} />
                <Route path="attendance" element={<StudentAttendance />} />
              </Routes>
            </P>
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION CHECKLIST
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Follow these steps to integrate ErrorBoundary:
 * 
 * □ 1. Import ErrorBoundary at top of App.tsx
 * □ 2. Choose integration strategy (minimal/recommended/granular)
 * □ 3. Wrap Routes or specific routes with ErrorBoundary
 * □ 4. Keep Toaster outside ErrorBoundary
 * □ 5. Test with test route (create TestErrorComponent)
 * □ 6. Navigate to test route and trigger error
 * □ 7. Verify error UI appears
 * □ 8. Verify retry button works
 * □ 9. Remove test route (or keep for development)
 * □ 10. Deploy to staging for testing
 * 
 * Optional enhancements:
 * □ 11. Add error logging service (Sentry, LogRocket)
 * □ 12. Create custom fallback components
 * □ 13. Add boundaries to data-fetching components
 * □ 14. Use useErrorBoundary hook for async errors
 * □ 15. Monitor error rates in production
 */

// ═══════════════════════════════════════════════════════════════════════════
// RESOURCES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Documentation:
 * - README: src/components/ERROR_BOUNDARY_README.md
 * - Integration: src/components/ERROR_BOUNDARY_INTEGRATION.md
 * - Summary: src/components/ERROR_BOUNDARY_SUMMARY.md
 * 
 * Demo:
 * - Interactive demo: src/components/error-boundary-demo.tsx
 * 
 * Tests:
 * - Test file: src/components/__tests__/error-boundary.test.tsx
 * 
 * Source:
 * - Component: src/components/error-boundary.tsx
 */

// Dummy components for examples
function HomePage() { return <div>Home</div>; }
function AboutPage() { return <div>About</div>; }
function StudentRoutes() { return <div>Student Routes</div>; }
function TeacherRoutes() { return <div>Teacher Routes</div>; }
function AdminRoutes() { return <div>Admin Routes</div>; }
function StudentDashboard() { return <div>Student Dashboard</div>; }
function StudentCourses() { return <div>Student Courses</div>; }
function Courses() { return <div>Courses</div>; }
function StudentAssignments() { return <div>Student Assignments</div>; }
function StudentTests() { return <div>Student Tests</div>; }
function StudentGrades() { return <div>Student Grades</div>; }
function StudentAttendance() { return <div>Student Attendance</div>; }
function CourseCard({ course }: any) { return <div>{course.title}</div>; }
function LoadingSkeleton() { return <div>Loading...</div>; }

import React from 'react';
