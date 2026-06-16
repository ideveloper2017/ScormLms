/**
 * Performance Monitor Usage Examples
 * 
 * This file demonstrates how to use the performance monitoring system
 * that was implemented for Task 16.1.
 * 
 * The performance monitor automatically tracks all API requests made
 * through the Axios instance and:
 * - Records request start and end times (Requirements 15.1, 15.2)
 * - Calculates request duration (Requirement 15.3)
 * - Logs slow queries (>3 seconds) to console (Requirement 15.4)
 * - Shows toast warnings for very slow queries (>5 seconds) (Requirement 15.5)
 */

import api from './api';
import { monitorApiRequest, withPerformanceMonitoring } from './performance-monitor';

// ============================================================================
// AUTOMATIC MONITORING (Preferred Approach)
// ============================================================================

/**
 * EXAMPLE 1: Automatic monitoring via Axios interceptors
 * 
 * All API calls through the `api` instance are automatically monitored.
 * No additional code is needed!
 */
async function automaticMonitoringExample() {
  // This request is automatically monitored
  const response = await api.get('/api/v1/courses/student');
  
  // If the request takes >3 seconds, a console warning will be logged:
  // [Performance] Sekin so'rov: GET /api/v1/courses/student
  // Davomiyligi: 3.50s
  
  // If the request takes >5 seconds, a toast notification will be shown:
  // "Server sekin javob bermoqda"
  // "So'rov 5.2 soniya davom etdi"
  
  return response.data;
}

// ============================================================================
// MANUAL MONITORING (Advanced Use Cases)
// ============================================================================

/**
 * EXAMPLE 2: Manual monitoring for custom operations
 * 
 * Use this when you need to monitor operations outside of Axios
 * or want more control over the monitoring process.
 */
async function manualMonitoringExample() {
  // Start monitoring
  const monitor = monitorApiRequest('/api/v1/custom-operation', 'OPERATION');
  
  try {
    // Perform some time-consuming operation
    await someAsyncOperation();
    
    // Complete timing when response arrives (success or error)
    monitor.complete();
  } catch (error) {
    // Always complete the monitor, even on error
    monitor.complete();
    throw error;
  }
}

/**
 * EXAMPLE 3: Wrapper function for any async operation
 * 
 * The `withPerformanceMonitoring` wrapper makes it easy to monitor
 * any async operation without manually calling complete().
 */
async function wrapperMonitoringExample() {
  const data = await withPerformanceMonitoring(
    async () => {
      // Your async operation
      const result = await fetch('https://api.example.com/data');
      return result.json();
    },
    'External API Call'
  );
  
  return data;
}

// ============================================================================
// REAL-WORLD USAGE EXAMPLES
// ============================================================================

/**
 * EXAMPLE 4: Monitoring course fetching
 */
export async function fetchCoursesWithMonitoring() {
  // Automatically monitored via Axios interceptor
  const response = await api.get('/api/v1/courses/student', {
    params: { status: 'active' }
  });
  
  return response.data;
}

/**
 * EXAMPLE 5: Monitoring assignment submission
 */
export async function submitAssignmentWithMonitoring(
  assignmentId: string,
  data: { answer: string }
) {
  // Automatically monitored via Axios interceptor
  const response = await api.post(
    `/api/v1/assignments/${assignmentId}/submit`,
    data
  );
  
  return response.data;
}

/**
 * EXAMPLE 6: Monitoring complex operations with multiple API calls
 */
export async function complexOperationWithMonitoring() {
  const monitor = monitorApiRequest('Complex Dashboard Load', 'OPERATION');
  
  try {
    // Multiple API calls
    const [courses, assignments, grades] = await Promise.all([
      api.get('/api/v1/courses/student'),
      api.get('/api/v1/assignments/student/pending'),
      api.get('/api/v1/grades/student'),
    ]);
    
    // Process data
    const dashboardData = {
      courses: courses.data,
      assignments: assignments.data,
      grades: grades.data,
    };
    
    monitor.complete();
    return dashboardData;
  } catch (error) {
    monitor.complete();
    throw error;
  }
}

// ============================================================================
// WHAT HAPPENS AUTOMATICALLY
// ============================================================================

/**
 * When you make an API request, the following happens automatically:
 * 
 * 1. Request Interceptor (in api.ts):
 *    - Calls performance.now() to record start time
 *    - Creates a monitor instance
 *    - Stores monitor in request config
 * 
 * 2. Request Execution:
 *    - Your API call executes normally
 *    - User sees loading states in the UI
 * 
 * 3. Response/Error Interceptor (in api.ts):
 *    - Calls performance.now() to record end time
 *    - Calculates duration (end - start)
 *    - Calls monitor.complete()
 * 
 * 4. Performance Analysis (in performance-monitor.ts):
 *    - If duration > 3000ms: Logs console warning with URL and duration
 *    - If duration > 5000ms: Shows toast notification to user (in Uzbek)
 * 
 * All of this happens transparently without any additional code in your
 * components or API service functions!
 */

// ============================================================================
// CONSOLE OUTPUT EXAMPLES
// ============================================================================

/**
 * For a slow request (3-5 seconds):
 * 
 * Console Output:
 * [Performance] Sekin so'rov: GET /api/v1/courses/student
 * Davomiyligi: 3.75s
 */

/**
 * For a very slow request (>5 seconds):
 * 
 * Console Output:
 * [Performance] Sekin so'rov: POST /api/v1/tests/123/submit
 * Davomiyligi: 5.42s
 * 
 * Toast Notification (shown to user):
 * Title: "Server sekin javob bermoqda"
 * Description: "So'rov 5.4 soniya davom etdi"
 * Duration: 4000ms (4 seconds)
 */

// Helper function for example
async function someAsyncOperation() {
  await new Promise(resolve => setTimeout(resolve, 1000));
}
