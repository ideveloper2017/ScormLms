# ErrorBoundary Component

A robust React error boundary implementation for graceful error handling and recovery in the Student Portal application.

## Overview

The `ErrorBoundary` component catches JavaScript errors anywhere in the React component tree, logs those errors, and displays a fallback UI instead of crashing the entire application with a white screen.

## Features

- ✅ **Catches React component errors** - Prevents white screen of death
- ✅ **User-friendly error UI** - Displays helpful error messages in Uzbek
- ✅ **Retry functionality** - Allows users to attempt recovery
- ✅ **Page refresh option** - Provides fallback recovery mechanism  
- ✅ **Development mode debugging** - Shows error stack traces in dev environment
- ✅ **Custom fallback support** - Allows custom error UI components
- ✅ **Error logging** - Logs errors to console for debugging
- ✅ **TypeScript support** - Full type safety with interfaces
- ✅ **Hook support** - Includes `useErrorBoundary` hook for functional components

## Installation

The component is already created in:
```
frontend/src/components/error-boundary.tsx
```

## Basic Usage

### 1. Wrap Your Components

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### 2. Wrap Routes

```tsx
import { ErrorBoundary } from '@/components/error-boundary';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/assignments" element={<Assignments />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
```

### 3. Multiple Error Boundaries (Recommended)

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <MainContent />
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}
```

## Advanced Usage

### Custom Fallback Component

Create your own error UI:

```tsx
import { ErrorBoundary, ErrorFallbackProps } from '@/components/error-boundary';

const MyCustomFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError 
}) => {
  return (
    <div>
      <h1>Oops! Something went wrong</h1>
      <p>{error?.message}</p>
      <button onClick={resetError}>Try Again</button>
      
      {/* Send error to logging service */}
      <button onClick={() => logErrorToService(error)}>
        Report Error
      </button>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary fallback={MyCustomFallback}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Using the DefaultErrorFallback

For full-page errors with more detailed UI:

```tsx
import { ErrorBoundary, DefaultErrorFallback } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={DefaultErrorFallback}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Using the useErrorBoundary Hook

Trigger error boundaries from functional components:

```tsx
import { useErrorBoundary } from '@/components/error-boundary';

function MyComponent() {
  const throwError = useErrorBoundary();

  const handleAsyncOperation = async () => {
    try {
      await riskyApiCall();
    } catch (error) {
      // This will trigger the nearest error boundary
      throwError(error);
    }
  };

  return (
    <button onClick={handleAsyncOperation}>
      Do Something Risky
    </button>
  );
}

// Wrap it with ErrorBoundary
function Page() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## API Reference

### ErrorBoundary Component

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Components to wrap and protect |
| `fallback` | `React.ComponentType<ErrorFallbackProps>` | No | Default UI | Custom fallback component |

#### Example

```tsx
<ErrorBoundary fallback={CustomFallback}>
  <YourComponent />
</ErrorBoundary>
```

### ErrorFallbackProps Interface

```typescript
interface ErrorFallbackProps {
  error?: Error;           // The error that was caught
  errorInfo?: React.ErrorInfo;  // React error information
  resetError: () => void;  // Function to reset error state
}
```

### DefaultErrorFallback Component

A pre-built full-page error fallback with:
- Error icon
- Error title and description
- Error message display
- Stack trace in development mode
- Retry button
- Home page navigation button
- Help text

```tsx
import { DefaultErrorFallback } from '@/components/error-boundary';

<ErrorBoundary fallback={DefaultErrorFallback}>
  <App />
</ErrorBoundary>
```

### useErrorBoundary Hook

```typescript
const throwError = useErrorBoundary();

// Usage
throwError(new Error('Something went wrong'));
```

## What ErrorBoundary Catches

✅ **DOES catch:**
- Errors during rendering
- Errors in lifecycle methods
- Errors in constructors
- Errors in the component tree below

❌ **DOES NOT catch:**
- Event handlers (use try-catch)
- Asynchronous code (use try-catch or .catch())
- Server-side rendering errors
- Errors in the error boundary itself

## Handling Uncaught Errors

For errors that ErrorBoundary doesn't catch:

### Event Handler Errors

```tsx
function MyComponent() {
  const throwError = useErrorBoundary();

  const handleClick = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      throwError(error);  // Trigger error boundary
    }
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### Global Error Handler

```tsx
// In your main.tsx or App.tsx
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Optionally show a toast notification
  toast.error('An unexpected error occurred');
});
```

## Best Practices

### 1. Strategic Placement

Place error boundaries at strategic points:

```tsx
// ✅ Good: Multiple boundaries
<ErrorBoundary>
  <Header />  {/* If header crashes, rest of app works */}
</ErrorBoundary>

<ErrorBoundary>
  <Sidebar />  {/* If sidebar crashes, content works */}
</ErrorBoundary>

<ErrorBoundary>
  <Content />  {/* If content crashes, navigation works */}
</ErrorBoundary>

// ❌ Bad: Single boundary at root only
<ErrorBoundary>
  <Header />
  <Sidebar />
  <Content />
</ErrorBoundary>
```

### 2. Granular Error Boundaries

For complex pages, use granular boundaries:

```tsx
function CoursePage() {
  return (
    <div>
      <ErrorBoundary>
        <CourseHeader />
      </ErrorBoundary>

      <ErrorBoundary>
        <CourseLessons />
      </ErrorBoundary>

      <ErrorBoundary>
        <CourseAssignments />
      </ErrorBoundary>
    </div>
  );
}
```

### 3. Error Logging Integration

```tsx
import { ErrorBoundary } from '@/components/error-boundary';
import * as Sentry from '@sentry/react';  // or your logging service

const LoggingErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  React.useEffect(() => {
    // Log to external service
    Sentry.captureException(error);
  }, [error]);

  return (
    <div>
      <h2>Error Logged</h2>
      <button onClick={resetError}>Retry</button>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary fallback={LoggingErrorFallback}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### 4. Environment-Specific Behavior

```tsx
const ProductionErrorFallback: React.FC<ErrorFallbackProps> = ({ resetError }) => {
  return (
    <div>
      <h2>Ma'lumotni yuklashda xatolik yuz berdi</h2>
      <p>Iltimos, qayta urinib ko'ring</p>
      <button onClick={resetError}>Qayta yuklash</button>
    </div>
  );
};

const DevelopmentErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError 
}) => {
  return (
    <div>
      <h2>Error: {error?.message}</h2>
      <pre>{error?.stack}</pre>
      <pre>{errorInfo?.componentStack}</pre>
      <button onClick={resetError}>Retry</button>
    </div>
  );
};

function App() {
  const Fallback = import.meta.env.DEV 
    ? DevelopmentErrorFallback 
    : ProductionErrorFallback;

  return (
    <ErrorBoundary fallback={Fallback}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Real-World Examples

### Example 1: Protected Routes

```tsx
import { ErrorBoundary } from '@/components/error-boundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <ErrorBoundary>
            <ProtectedRoute requiredRoles={['STUDENT']}>
              <Dashboard />
            </ProtectedRoute>
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}
```

### Example 2: Data Fetching Components

```tsx
import { ErrorBoundary } from '@/components/error-boundary';
import { useCourses } from '@/hooks/useCourses';

function CourseList() {
  const { data, isLoading, error } = useCourses();

  if (error) throw error;  // Let ErrorBoundary handle it

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div>
      {data.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

function CoursePage() {
  return (
    <ErrorBoundary>
      <CourseList />
    </ErrorBoundary>
  );
}
```

### Example 3: Form Submission

```tsx
import { useErrorBoundary } from '@/components/error-boundary';
import { ErrorBoundary } from '@/components/error-boundary';

function AssignmentSubmitForm() {
  const throwError = useErrorBoundary();
  const { mutateAsync } = useSubmitAssignment();

  const handleSubmit = async (data) => {
    try {
      await mutateAsync(data);
      toast.success('Topshiriq muvaffaqiyatli yuborildi');
    } catch (error) {
      // Let error boundary handle it
      throwError(error);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

function AssignmentPage() {
  return (
    <ErrorBoundary>
      <AssignmentSubmitForm />
    </ErrorBoundary>
  );
}
```

## Testing

See `error-boundary.test.tsx` for comprehensive test examples.

### Basic Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './error-boundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches error and displays fallback', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText('Xatolik yuz berdi')).toBeInTheDocument();
});
```

## Demo Page

A comprehensive demo page is available at:
```
frontend/src/components/error-boundary-demo.tsx
```

To use the demo:

1. Import it in your router:
```tsx
import ErrorBoundaryDemo from '@/components/error-boundary-demo';

<Route path="/demo/error-boundary" element={<ErrorBoundaryDemo />} />
```

2. Navigate to `/demo/error-boundary` to see interactive examples

## Troubleshooting

### Error Boundary Not Catching Errors

**Problem:** Error boundary doesn't catch the error

**Solutions:**
1. Make sure the error is thrown during render, not in an event handler
2. Check if the error is thrown in an async function (use try-catch)
3. Verify the component is actually wrapped by ErrorBoundary

### Error Boundary Catches Too Much

**Problem:** One small component error breaks the entire page

**Solutions:**
1. Use multiple error boundaries at different levels
2. Place boundaries around independent sections
3. Consider more granular error boundaries

### Development Mode Shows Too Much Info

**Problem:** Error details are overwhelming in development

**Solutions:**
1. The detailed error info is intentional for debugging
2. In production, only user-friendly messages are shown
3. Customize the fallback component for your needs

## Browser Support

Works in all modern browsers that support:
- React 16.8+ (hooks)
- ES6+ features

## Migration Guide

If you're upgrading from a previous error handling approach:

1. Install the ErrorBoundary component
2. Identify critical UI sections
3. Wrap them with ErrorBoundary
4. Test error scenarios
5. Customize fallback UI as needed

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- Basic error catching
- User-friendly fallback UI
- Development mode debugging
- Custom fallback support
- useErrorBoundary hook
- DefaultErrorFallback component
- Uzbek language support

## Contributing

To improve this component:
1. Maintain backward compatibility
2. Add tests for new features
3. Update this documentation
4. Follow project code style

## License

Part of the Student Portal project.

## Support

For issues or questions:
1. Check this documentation
2. Review the demo page
3. Check the test file for examples
4. Contact the development team
