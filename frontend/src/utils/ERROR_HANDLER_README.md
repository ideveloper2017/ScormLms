# Error Handler Utility

Centralized error handling utility for the Student Portal frontend. This utility provides consistent error handling across all API calls with proper typing, user-friendly messages, and toast notifications.

## Features

✅ **Axios Error Handling** - Automatically parses and formats Axios errors  
✅ **HTTP Status Code Handling** - Handles 401, 403, 404, 422, 500, 503 with appropriate messages  
✅ **Network Error Detection** - Detects timeout and connectivity issues  
✅ **Toast Notifications** - Integrated with the app's toast system  
✅ **Authentication Redirect** - Automatically redirects to login on 401 errors  
✅ **Validation Error Formatting** - Formats field-level validation errors  
✅ **TypeScript Support** - Full type safety with `ApiError` interface  
✅ **Error Logging** - Console logging in development mode  
✅ **Retry Support** - Built-in retry functionality for failed requests  

## Installation

The error handler is already installed and ready to use:

```typescript
import {
  handleApiError,
  formatValidationErrors,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  isValidationError,
  withErrorHandler,
  logError,
} from '@/utils/error-handler';
```

## Core Functions

### `handleApiError(error, options?)`

Main error handling function that processes errors and displays user feedback.

**Parameters:**
- `error: unknown` - The error to handle (typically AxiosError or Error)
- `options?: ErrorHandlerOptions` - Configuration options:
  - `showToast?: boolean` - Show toast notification (default: `true`)
  - `redirectOnAuth?: boolean` - Redirect to login on 401 (default: `true`)
  - `logToConsole?: boolean` - Log to console (default: `true`)
  - `customMessage?: string` - Custom error message
  - `includeRetry?: boolean` - Include retry button (default: `false`)
  - `onRetry?: () => void` - Retry callback function

**Returns:** `ApiError` object with structure:
```typescript
{
  status: number;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}
```

**Example:**
```typescript
try {
  await api.get('/students/me');
} catch (error) {
  handleApiError(error, {
    showToast: true,
    redirectOnAuth: true,
  });
}
```

### `formatValidationErrors(details?)`

Formats validation error details into a readable string.

**Parameters:**
- `details?: Record<string, string[]>` - Field-level validation errors

**Returns:** `string` - Formatted error message

**Example:**
```typescript
const details = {
  email: ['Email is required', 'Email must be valid'],
  password: ['Password is too short']
};
const formatted = formatValidationErrors(details);
// "email: Email is required, Email must be valid\npassword: Password is too short"
```

### `getErrorMessage(error)`

Extracts a user-friendly error message from any error type.

**Parameters:**
- `error: unknown` - Any error object

**Returns:** `string` - User-friendly error message

**Example:**
```typescript
const message = getErrorMessage(error);
console.log(message);
```

### `isNetworkError(error)`

Checks if an error is a network connectivity error.

**Parameters:**
- `error: unknown` - Error to check

**Returns:** `boolean` - `true` if network error

**Example:**
```typescript
if (isNetworkError(error)) {
  console.log('Network issue detected');
}
```

### `isAuthError(error)`

Checks if an error is an authentication error (401).

**Parameters:**
- `error: unknown` - Error to check

**Returns:** `boolean` - `true` if 401 error

**Example:**
```typescript
if (isAuthError(error)) {
  console.log('User needs to re-authenticate');
}
```

### `isValidationError(error)`

Checks if an error is a validation error (422).

**Parameters:**
- `error: unknown` - Error to check

**Returns:** `boolean` - `true` if 422 error

**Example:**
```typescript
if (isValidationError(error)) {
  const apiError = handleApiError(error);
  console.log('Validation errors:', apiError.details);
}
```

### `withErrorHandler(fn, options?)`

Higher-order function that wraps an async function with automatic error handling.

**Parameters:**
- `fn: Function` - Async function to wrap
- `options?: ErrorHandlerOptions` - Error handling options

**Returns:** Wrapped function with error handling

**Example:**
```typescript
const fetchCourses = withErrorHandler(
  async () => api.get('/courses/student'),
  { showToast: true }
);

// Use it without try-catch
const courses = await fetchCourses();
```

### `logError(context, error, additionalData?)`

Logs an error to the console with consistent formatting (development only).

**Parameters:**
- `context: string` - Description of where/when error occurred
- `error: unknown` - The error to log
- `additionalData?: Record<string, unknown>` - Optional additional data

**Example:**
```typescript
logError('Failed to fetch courses', error, { userId: '123' });
```

## Usage Patterns

### 1. Basic API Call

```typescript
async function fetchUserProfile() {
  try {
    const response = await api.get('/students/me');
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}
```

### 2. Custom Error Message

```typescript
try {
  await api.post('/assignments/submit', data);
} catch (error) {
  handleApiError(error, {
    customMessage: 'Topshiriqni yuborishda xatolik',
  });
}
```

### 3. Silent Error Handling

```typescript
try {
  const count = await api.get('/notifications/unread/count');
  return count.data;
} catch (error) {
  handleApiError(error, {
    showToast: false,
    redirectOnAuth: false,
  });
  return { count: 0 };
}
```

### 4. With Retry Button

```typescript
try {
  return await api.get('/courses/student');
} catch (error) {
  handleApiError(error, {
    includeRetry: true,
    onRetry: () => window.location.reload(),
  });
  throw error;
}
```

### 5. React Query Integration

```typescript
import { useQuery } from '@tanstack/react-query';
import { handleApiError } from '@/utils/error-handler';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses/student');
      return response.data;
    },
    onError: (error) => {
      handleApiError(error, {
        showToast: true,
        customMessage: 'Kurslarni yuklashda xatolik',
      });
    },
  });
}
```

### 6. Multiple Requests

```typescript
async function loadDashboard() {
  const [profile, courses, assignments] = await Promise.allSettled([
    api.get('/students/me'),
    api.get('/courses/student/active'),
    api.get('/assignments/student/pending'),
  ]);

  if (profile.status === 'rejected') {
    handleApiError(profile.reason, { showToast: false });
  }
  if (courses.status === 'rejected') {
    handleApiError(courses.reason, { showToast: false });
  }
  if (assignments.status === 'rejected') {
    handleApiError(assignments.reason, { showToast: false });
  }

  return {
    profile: profile.status === 'fulfilled' ? profile.value.data : null,
    courses: courses.status === 'fulfilled' ? courses.value.data : [],
    assignments: assignments.status === 'fulfilled' ? assignments.value.data : [],
  };
}
```

## Error Messages

The error handler provides user-friendly messages in Uzbek language:

| Status Code | Default Message |
|-------------|----------------|
| 401 | Avtorizatsiya xatosi. Iltimos, qayta kiring. |
| 403 | Sizda bu amalni bajarish uchun ruxsat yo'q. |
| 404 | So'ralgan ma'lumot topilmadi. |
| 422 | Ma'lumotlar validatsiyadan o'tmadi. |
| 500 | Server xatosi. Iltimos, keyinroq urinib ko'ring. |
| 503 | Server hozirda ishlamayapti. Iltimos, keyinroq urinib ko'ring. |
| Network | Server bilan bog'lanib bo'lmadi. Internet aloqangizni tekshiring. |
| Timeout | So'rov vaqti tugadi. Internet aloqangizni tekshiring. |

## TypeScript Types

```typescript
interface ErrorHandlerOptions {
  showToast?: boolean;
  redirectOnAuth?: boolean;
  logToConsole?: boolean;
  customMessage?: string;
  includeRetry?: boolean;
  onRetry?: () => void;
}

interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}
```

## Testing

The error handler includes comprehensive unit tests covering:
- ✅ HTTP status code handling (401, 403, 404, 422, 500, 503)
- ✅ Network error handling (timeout, connection failures)
- ✅ Toast notification triggering
- ✅ Custom error messages
- ✅ Validation error formatting
- ✅ Error type checking functions
- ✅ Auth data clearing

Run tests:
```bash
npm run test:run -- error-handler.test.ts
```

## Best Practices

1. **Always handle API errors** - Use `handleApiError` for all API calls
2. **Use custom messages** - Provide context-specific error messages when appropriate
3. **Silent failures for non-critical data** - Use `showToast: false` for background requests
4. **Log errors in development** - Keep `logToConsole: true` for debugging
5. **Handle validation errors** - Check `apiError.details` for field-level errors
6. **Provide retry options** - Use `includeRetry` for transient failures
7. **Check error types** - Use `isNetworkError`, `isAuthError` for specific handling

## Integration with Existing Systems

The error handler integrates with:
- ✅ **Axios Client** (`@/lib/api.ts`) - Works with existing API client
- ✅ **Toast System** (`@/hooks/use-toast`) - Uses app's toast notifications
- ✅ **Authentication** - Clears auth data and redirects on 401
- ✅ **TypeScript** - Full type safety with `ApiError` type

## See Also

- [Usage Examples](./error-handler.example.ts) - Comprehensive usage examples
- [Test Suite](./__tests__/error-handler.test.ts) - Unit tests
- [Design Document](/.kiro/specs/student-backend-api-integration/design.md) - Full design specs
