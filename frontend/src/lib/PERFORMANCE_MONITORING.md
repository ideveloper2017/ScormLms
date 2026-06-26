# Performance Monitoring Implementation

## Overview

This document describes the request timing instrumentation implemented for the Student Backend API Integration project. The performance monitoring system tracks API request durations and alerts developers and users about slow queries.

## Features

### Automatic Request Timing (Requirements 15.1, 15.2, 15.3)

All API requests made through the Axios client are automatically instrumented with timing:

- **Start Time Recording (15.1)**: Captured when request begins using `performance.now()`
- **End Time Recording (15.2)**: Captured when response arrives (success or error)
- **Duration Calculation (15.3)**: Automatically computed as `endTime - startTime`

### Slow Query Logging (Requirement 15.4)

Requests exceeding **3 seconds** trigger a console warning:

```
[Performance] Sekin so'rov aniqlandi: GET /api/v1/courses - 3500ms
```

This helps developers identify performance bottlenecks during development.

### User Timeout Warnings (Requirement 15.5)

Requests exceeding **5 seconds** display a toast notification to the user in Uzbek:

```
⚠️ Server sekin javob bermoqda
So'rov 5.2 soniya davom etdi
```

This provides transparency to users when experiencing slow network conditions.

## Architecture

### Core Module

**`src/lib/performance-monitor.ts`**

Exports:
- `monitorApiRequest(url, method)` - Manual monitoring function
- `withPerformanceMonitoring(fn, label)` - Higher-order wrapper function
- `getPerformanceThresholds()` - Get threshold configuration

### Integration with Axios

**`src/lib/api.ts`**

The Axios client has been enhanced with request/response interceptors:

```typescript
// Request interceptor - Start monitoring
api.interceptors.request.use((config) => {
  const monitor = monitorApiRequest(config.url, config.method);
  config.__performanceMonitor = monitor;
  return config;
});

// Response interceptor - Complete monitoring
api.interceptors.response.use(
  (response) => {
    response.config.__performanceMonitor?.complete();
    return response;
  },
  (error) => {
    error.config?.__performanceMonitor?.complete();
    return Promise.reject(error);
  }
);
```

## Usage

### Automatic Monitoring (Recommended)

All API calls through the `api` instance are automatically monitored:

```typescript
import api from '@/lib/api';

// Automatically monitored - no additional code needed
const courses = await api.get('/courses/student');
const result = await api.post('/assignments/1/submit', data);
```

### Manual Monitoring (Advanced)

For custom operations outside of API calls:

```typescript
import { monitorApiRequest } from '@/lib/performance-monitor';

const monitor = monitorApiRequest('complex-operation', 'CUSTOM');
try {
  // ... perform operations
  await doComplexWork();
  monitor.complete();
} catch (error) {
  monitor.complete();
  throw error;
}
```

### Wrapper Function

For wrapping async functions:

```typescript
import { withPerformanceMonitoring } from '@/lib/performance-monitor';

const fetchData = withPerformanceMonitoring(
  async () => {
    // ... async operations
  },
  'data-fetch-operation'
);

await fetchData(); // Automatically monitored
```

## Configuration

### Performance Thresholds

Current thresholds:
- **Slow Query Warning**: 3000ms (3 seconds)
- **Timeout User Warning**: 5000ms (5 seconds)

These are defined as constants in `performance-monitor.ts`:

```typescript
const SLOW_QUERY_THRESHOLD = 3000;
const TIMEOUT_WARNING_THRESHOLD = 5000;
```

### Accessing Thresholds

```typescript
import { getPerformanceThresholds } from '@/lib/performance-monitor';

const thresholds = getPerformanceThresholds();
console.log(thresholds.slowQueryThreshold); // 3000
console.log(thresholds.timeoutWarningThreshold); // 5000
```

## Testing

### Unit Tests

**`src/lib/__tests__/performance-monitor.test.ts`**

Tests the core monitoring functionality:
- ✅ Records start time
- ✅ Calculates duration
- ✅ Logs warnings for slow requests (>3s)
- ✅ Shows toast for very slow requests (>5s)
- ✅ Handles different HTTP methods
- ✅ Works with wrapper function

### Integration Tests

**`src/lib/__tests__/api-performance-integration.test.ts`**

Tests the Axios interceptor integration:
- ✅ Automatic monitoring of successful requests
- ✅ Warning logs for slow requests
- ✅ Toast notifications for very slow requests
- ✅ Monitoring of failed requests
- ✅ Support for all HTTP methods (GET, POST, PATCH, etc.)
- ✅ Independent tracking of multiple requests

Run tests:
```bash
npm test -- src/lib/__tests__/performance-monitor.test.ts --run
npm test -- src/lib/__tests__/api-performance-integration.test.ts --run
```

## Examples

See `src/lib/performance-monitor.example.ts` for comprehensive usage examples including:
1. Manual monitoring in API service functions
2. Using the wrapper function
3. Monitoring POST requests
4. Automatic monitoring through interceptors
5. When to use manual vs automatic monitoring
6. Complex operations with multiple API calls

## Requirements Validation

This implementation validates the following requirements:

- ✅ **15.1**: Record request start time using `performance.now()`
- ✅ **15.2**: Record request end time when response arrives
- ✅ **15.3**: Calculate request duration (end - start)
- ✅ **15.4**: Log slow queries (>3 seconds) to console
- ✅ **15.5**: Display timeout warning (>5 seconds) to user via toast

## User-Facing Messages

All user-facing messages are in Uzbek (Lotin) as per project requirements:

- Console warning: `"Sekin so'rov aniqlandi"`
- Toast title: `"Server sekin javob bermoqda"`
- Toast description: `"So'rov X.X soniya davom etdi"`

## Performance Impact

The monitoring system has minimal performance overhead:

- Uses native `performance.now()` API (high precision, low overhead)
- Only adds two function calls per request (start/complete)
- Conditional logging/toasting based on thresholds
- No external dependencies beyond existing `sonner` toast library

## Future Enhancements

Potential improvements:
1. Configurable thresholds via environment variables
2. Performance metrics aggregation and reporting
3. Integration with analytics services
4. Request retry with exponential backoff for slow connections
5. Network quality detection and adaptive timeouts
