# ErrorBoundary Integration Guide

## Integration into App.tsx

This guide shows how to integrate the ErrorBoundary component into the existing Student Portal application.

## Recommended Integration Approach

### Option 1: App-Level Error Boundary (Recommended for Quick Start)

Wrap the entire application with a single error boundary:

```tsx
// src/App.tsx
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  const { user, isLoading, completeLogin } = useAuth();
  // ... existing code ...

  return (
    <ErrorBoundary>
      <Routes>
        {/* All your existing routes */}
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}
```

**Pros:**
- ✅ Quick to implement (single line change)
- ✅ Catches all unhandled errors
- ✅ Prevents white screen of death

**Cons:**
- ❌ One component error breaks entire app
- ❌ Less granular error recovery

### Option 2: Route-Level Error Boundaries (Recommended for Production)

Wrap major sections with separate error boundaries:

```tsx
// src/App.tsx
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <>
      <Routes>
        {/* Public routes with separate boundary */}
        <Route 
          path="/login" 
          element={
            <ErrorBoundary>
              <LoginPage />
            </ErrorBoundary>
          } 
        />
        
        {/* Student routes with separate boundary */}
        <Route 
          path="/student/*" 
          element={
            <ErrorBoundary>
              <AuthGuard>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="courses" element={<Courses />} />
                    <Route path="assignments" element={<StudentAssignments />} />
                    {/* ... other student routes */}
                  </Routes>
                </DashboardLayout>
              </AuthGuard>
            </ErrorBoundary>
          }
        />
        
        {/* Teacher routes with separate boundary */}
        <Route 
          path="/teacher/*" 
          element={
            <ErrorBoundary>
              <P roles={TEACHER_ROLES}>
                <Routes>
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="courses" element={<TeacherCourses />} />
                  {/* ... other teacher routes */}
                </Routes>
              </P>
            </ErrorBoundary>
          }
        />

        {/* Admin routes with separate boundary */}
        <Route 
          path="/admin/*" 
          element={
            <ErrorBoundary>
              <P roles={ADMIN_ROLES}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  {/* ... other admin routes */}
                </Routes>
              </P>
            </ErrorBoundary>
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}
```

**Pros:**
- ✅ Isolated error handling per section
- ✅ One section error doesn't break others
- ✅ Better user experience

**Cons:**
- ⚠️ More code to add
- ⚠️ Requires careful planning

### Option 3: Component-Level Error Boundaries (Most Granular)

Wrap individual components that might fail:

```tsx
// src/pages/student-dashboard.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export function StudentDashboard() {
  return (
    <div className="space-y-6">
      {/* Wrap statistics cards */}
      <ErrorBoundary>
        <DashboardStats />
      </ErrorBoundary>

      {/* Wrap course list */}
      <ErrorBoundary>
        <CourseList />
      </ErrorBoundary>

      {/* Wrap upcoming assignments */}
      <ErrorBoundary>
        <UpcomingAssignments />
      </ErrorBoundary>
    </div>
  );
}
```

**Pros:**
- ✅ Maximum isolation
- ✅ One component failure doesn't affect others
- ✅ Best user experience

**Cons:**
- ⚠️ Most code changes required
- ⚠️ Potential for over-engineering

## Recommended Implementation Plan

### Phase 1: Quick Protection (5 minutes)

Add a single app-level error boundary:

```tsx
// src/App.tsx - Add this import at top
import { ErrorBoundary } from '@/components/error-boundary';

// Wrap the entire return statement
function App() {
  // ... all existing code ...
  
  return (
    <ErrorBoundary>
      <>
        <Routes>
          {/* All existing routes */}
        </Routes>
        <Toaster />
      </>
    </ErrorBoundary>
  );
}
```

### Phase 2: Critical Pages (30 minutes)

Add boundaries to high-traffic pages:

```tsx
// Wrap critical student pages
<Route 
  path="/student/dashboard" 
  element={
    <P roles={[R_STU]}>
      <ErrorBoundary>
        <StudentDashboard />
      </ErrorBoundary>
    </P>
  } 
/>

<Route 
  path="/student/tests" 
  element={
    <P roles={[R_STU]}>
      <ErrorBoundary>
        <StudentTests />
      </ErrorBoundary>
    </P>
  } 
/>

// Wrap critical teacher pages
<Route 
  path="/teacher/gradebook" 
  element={
    <P roles={TEACHER_ROLES}>
      <ErrorBoundary>
        <TeacherGradebook />
      </ErrorBoundary>
    </P>
  } 
/>
```

### Phase 3: Data Fetching Components (1 hour)

Add boundaries around components with API calls:

```tsx
// In pages that fetch data
export function CourseList() {
  return (
    <ErrorBoundary>
      <CourseListContent />
    </ErrorBoundary>
  );
}

function CourseListContent() {
  const { data, isLoading, error } = useCourses();
  
  // If API call fails, throw error to boundary
  if (error) throw error;
  
  // ... rest of component
}
```

### Phase 4: Complex UI Sections (2 hours)

Add boundaries to complex features:

```tsx
// Proctoring session with error boundary
<Route 
  path="/exam/:id/proctoring" 
  element={
    <P roles={[R_STU, R_PROC]}>
      <ErrorBoundary>
        <ProctoringSession />
      </ErrorBoundary>
    </P>
  } 
/>

// SCORM course player with error boundary
<Route 
  path="/course/:id" 
  element={
    <P roles={CONTENT_ROLES}>
      <ErrorBoundary>
        <CoursePlayer />
      </ErrorBoundary>
    </P>
  } 
/>
```

## Integration with Existing Error Handling

### Working with React Query

The app already uses React Query. Integrate ErrorBoundary:

```tsx
// In your hooks (e.g., useCourses)
export const useCourses = (filters?: CourseFilters) => {
  return useQuery({
    queryKey: qk.courses.list(filters),
    queryFn: () => courseApi.fetchCourses(filters),
    // Add this to make errors throw to boundary
    useErrorBoundary: true,  // or throwOnError: true in v5
    staleTime: 5 * 60 * 1000,
  });
};

// Or handle in component
function CourseList() {
  const { data, isLoading, error } = useCourses();
  
  // Throw error to nearest error boundary
  if (error) throw error;
  
  // ... render logic
}
```

### Working with AuthGuard

The ErrorBoundary should wrap AuthGuard:

```tsx
// Good: ErrorBoundary catches AuthGuard errors
<ErrorBoundary>
  <AuthGuard>
    <YourComponent />
  </AuthGuard>
</ErrorBoundary>

// Bad: AuthGuard errors won't be caught
<AuthGuard>
  <ErrorBoundary>
    <YourComponent />
  </ErrorBoundary>
</AuthGuard>
```

### Working with RoleGuard

Same principle as AuthGuard:

```tsx
<ErrorBoundary>
  <RoleGuard allowedRoles={['STUDENT']}>
    <YourComponent />
  </RoleGuard>
</ErrorBoundary>
```

### Working with Toaster

The Toaster should be outside ErrorBoundary so errors don't break it:

```tsx
function App() {
  return (
    <>
      <ErrorBoundary>
        <Routes>
          {/* Your routes */}
        </Routes>
      </ErrorBoundary>
      <Toaster />  {/* Outside boundary so it always works */}
    </>
  );
}
```

## Specific Page Examples

### Example 1: Student Dashboard

```tsx
// src/pages/student-dashboard.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export function StudentDashboard() {
  return (
    <div className="space-y-6 p-6">
      <h1>Student Dashboard</h1>
      
      {/* Wrap data-fetching sections */}
      <ErrorBoundary>
        <DashboardStats />
      </ErrorBoundary>

      <div className="grid gap-6 md:grid-cols-2">
        <ErrorBoundary>
          <RecentCourses />
        </ErrorBoundary>

        <ErrorBoundary>
          <UpcomingTests />
        </ErrorBoundary>
      </div>

      <ErrorBoundary>
        <NotificationsList />
      </ErrorBoundary>
    </div>
  );
}
```

### Example 2: Teacher Gradebook

```tsx
// src/pages/teacher/gradebook.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export function TeacherGradebook() {
  return (
    <ErrorBoundary>
      <GradebookContent />
    </ErrorBoundary>
  );
}

function GradebookContent() {
  const { data, error } = useGrades();
  
  if (error) throw error;  // Let boundary handle it
  
  return (
    <div>
      <GradeTable data={data} />
    </div>
  );
}
```

### Example 3: Course Player

```tsx
// src/components/scorm/course-player.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export function CoursePlayer() {
  return (
    <ErrorBoundary>
      <CoursePlayerContent />
    </ErrorBoundary>
  );
}

function CoursePlayerContent() {
  const { id } = useParams();
  const { data, error, isLoading } = useCourse(id);
  
  if (error) throw error;
  if (isLoading) return <LoadingSkeleton />;
  
  return <ScormPlayer course={data} />;
}
```

## Handling Async Errors

### Form Submissions

```tsx
import { useErrorBoundary } from '@/components/error-boundary';

function AssignmentForm() {
  const throwError = useErrorBoundary();
  const { mutateAsync } = useSubmitAssignment();

  const handleSubmit = async (data) => {
    try {
      await mutateAsync(data);
      toast.success('Yuborildi');
    } catch (error) {
      // Let error boundary handle it
      throwError(error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Button Click Handlers

```tsx
import { useErrorBoundary } from '@/components/error-boundary';

function DeleteButton({ courseId }) {
  const throwError = useErrorBoundary();
  const { mutateAsync } = useDeleteCourse();

  const handleDelete = async () => {
    try {
      await mutateAsync(courseId);
      toast.success('O\'chirildi');
    } catch (error) {
      throwError(error);
    }
  };

  return <Button onClick={handleDelete}>O'chirish</Button>;
}
```

## Custom Error Fallbacks

### Create Role-Specific Fallbacks

```tsx
// src/components/student-error-fallback.tsx
export const StudentErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ma'lumot yuklanmadi</CardTitle>
        <CardDescription>
          Sahifani yuklashda muammo yuz berdi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {error?.message}
        </p>
        <div className="flex gap-2">
          <Button onClick={resetError}>Qayta urinish</Button>
          <Button variant="outline" asChild>
            <Link to="/student/dashboard">Dashboard ga qaytish</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Use it
<ErrorBoundary fallback={StudentErrorFallback}>
  <StudentPage />
</ErrorBoundary>
```

## Testing the Integration

### 1. Create a Test Error Component

```tsx
// src/components/test-error.tsx
export function TestError({ shouldThrow = false }) {
  if (shouldThrow) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>No error</div>;
}
```

### 2. Add a Test Route

```tsx
// In App.tsx (development only)
{import.meta.env.DEV && (
  <Route 
    path="/test-error" 
    element={
      <ErrorBoundary>
        <TestError shouldThrow={true} />
      </ErrorBoundary>
    } 
  />
)}
```

### 3. Test Different Scenarios

```tsx
// Test route errors
<Route path="/test/render-error" element={<TestError shouldThrow />} />

// Test data fetching errors
<Route path="/test/api-error" element={<TestApiError />} />

// Test async errors
<Route path="/test/async-error" element={<TestAsyncError />} />
```

## Monitoring and Logging

### Integrate with Error Tracking Service

```tsx
// src/lib/error-tracking.ts
import * as Sentry from '@sentry/react';

export const logError = (error: Error, errorInfo?: React.ErrorInfo) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo?.componentStack,
        },
      },
    });
  } else {
    console.error('Error:', error, errorInfo);
  }
};
```

```tsx
// Custom fallback with logging
const LoggingFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
}) => {
  React.useEffect(() => {
    logError(error, errorInfo);
  }, [error, errorInfo]);

  return <DefaultErrorUI error={error} resetError={resetError} />;
};

<ErrorBoundary fallback={LoggingFallback}>
  <App />
</ErrorBoundary>
```

## Performance Considerations

### Avoid Too Many Boundaries

```tsx
// ❌ Bad: Too granular
<ErrorBoundary>
  <ErrorBoundary>
    <ErrorBoundary>
      <div>Content</div>
    </ErrorBoundary>
  </ErrorBoundary>
</ErrorBoundary>

// ✅ Good: Balanced
<ErrorBoundary>
  <div>
    <Header />
    <Content />
    <Footer />
  </div>
</ErrorBoundary>
```

### Use Boundaries at Natural Split Points

```tsx
// ✅ Good: Natural boundaries
<ErrorBoundary>
  <Navigation />
</ErrorBoundary>

<ErrorBoundary>
  <MainContent />
</ErrorBoundary>

<ErrorBoundary>
  <Sidebar />
</ErrorBoundary>
```

## Maintenance Checklist

After integration, ensure:

- [ ] All major routes have error boundaries
- [ ] Data fetching components are wrapped
- [ ] Complex features are protected
- [ ] Error logging is set up
- [ ] Custom fallbacks are user-friendly
- [ ] Toaster is outside boundaries
- [ ] Test error scenarios work
- [ ] Development vs production behavior differs appropriately
- [ ] Documentation is updated
- [ ] Team is trained on usage

## Troubleshooting

### ErrorBoundary not catching errors

**Check:**
1. Is the error thrown during render?
2. Is the component wrapped by ErrorBoundary?
3. Is it an async error? (use useErrorBoundary hook)

### Too many error boundaries

**Solution:** Consolidate boundaries at higher levels

### Error boundary catches too much

**Solution:** Use more granular boundaries

## Next Steps

1. ✅ Component created
2. ⏭️ Integrate into App.tsx
3. ⏭️ Add to critical pages
4. ⏭️ Test error scenarios
5. ⏭️ Add error logging
6. ⏭️ Train team on usage

## Resources

- Component: `src/components/error-boundary.tsx`
- Demo: `src/components/error-boundary-demo.tsx`
- Documentation: `src/components/ERROR_BOUNDARY_README.md`
- Tests: `src/components/__tests__/error-boundary.test.tsx`
