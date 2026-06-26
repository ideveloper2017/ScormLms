/**
 * Usage Examples for Error Handler Utility
 * 
 * This file demonstrates how to use the centralized error handler
 * in various scenarios throughout the application.
 */

import api from '@/lib/api';
import {
  handleApiError,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  formatValidationErrors,
  withErrorHandler,
} from './error-handler';

// ========================================
// Example 1: Basic API Call Error Handling
// ========================================

export async function fetchUserProfile() {
  try {
    const response = await api.get('/students/me');
    return response.data;
  } catch (error) {
    // Handle error with toast notification
    handleApiError(error, {
      showToast: true,
      redirectOnAuth: true,
    });
    throw error; // Re-throw if you need to handle it upstream
  }
}

// ========================================
// Example 2: Custom Error Message
// ========================================

export async function submitAssignment(id: string, data: any) {
  try {
    const response = await api.post(`/assignments/${id}/submit`, data);
    return response.data;
  } catch (error) {
    // Use custom message instead of API message
    handleApiError(error, {
      showToast: true,
      customMessage: 'Topshiriqni yuborishda xatolik. Qaytadan urinib ko\'ring.',
    });
    throw error;
  }
}

// ========================================
// Example 3: Silent Error Handling (No Toast)
// ========================================

export async function checkNotifications() {
  try {
    const response = await api.get('/notifications/unread/count');
    return response.data;
  } catch (error) {
    // Handle error silently, just log it
    const apiError = handleApiError(error, {
      showToast: false,
      redirectOnAuth: false,
      logToConsole: true,
    });
    return { count: 0 }; // Return default value
  }
}

// ========================================
// Example 4: Retry Functionality
// ========================================

export async function fetchCourses() {
  const performFetch = async () => {
    const response = await api.get('/courses/student');
    return response.data;
  };

  try {
    return await performFetch();
  } catch (error) {
    handleApiError(error, {
      showToast: true,
      includeRetry: true,
      onRetry: () => {
        // Retry the fetch
        window.location.reload();
      },
    });
    throw error;
  }
}

// ========================================
// Example 5: Validation Error Handling
// ========================================

export async function updateProfile(data: any) {
  try {
    const response = await api.put('/students/profile', data);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error, {
      showToast: true,
    });

    // Show detailed validation errors if present
    if (apiError.details) {
      const formattedErrors = formatValidationErrors(apiError.details);
      console.log('Validation errors:', formattedErrors);
    }

    throw error;
  }
}

// ========================================
// Example 6: Checking Error Types
// ========================================

export async function fetchData() {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    if (isNetworkError(error)) {
      // Handle network errors specifically
      console.log('Network issue detected');
    } else if (isAuthError(error)) {
      // Handle authentication errors
      console.log('Authentication issue');
    } else {
      // Handle other errors
      const message = getErrorMessage(error);
      console.log('Error:', message);
    }
    
    handleApiError(error);
    throw error;
  }
}

// ========================================
// Example 7: Using withErrorHandler Wrapper
// ========================================

// Wrap an API function with automatic error handling
const fetchStudentGrades = withErrorHandler(
  async (studentId: string) => {
    const response = await api.get(`/grades/student/${studentId}`);
    return response.data;
  },
  {
    showToast: true,
    customMessage: 'Baholarni yuklashda xatolik',
  }
);

// Now use it without try-catch
export async function getGrades(studentId: string) {
  try {
    return await fetchStudentGrades(studentId);
  } catch (error) {
    // Error already handled by wrapper
    return [];
  }
}

// ========================================
// Example 8: React Query Integration
// ========================================

export function useCourses() {
  return {
    // In your React Query hook
    onError: (error: unknown) => {
      handleApiError(error, {
        showToast: true,
        redirectOnAuth: true,
      });
    },
  };
}

// ========================================
// Example 9: Form Submission with Detailed Error Display
// ========================================

export async function handleFormSubmit(formData: any) {
  try {
    const response = await api.post('/submit', formData);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error, {
      showToast: true,
    });

    // Return structured error for form field display
    if (apiError.details) {
      return {
        success: false,
        fieldErrors: apiError.details,
      };
    }

    return {
      success: false,
      message: apiError.message,
    };
  }
}

// ========================================
// Example 10: Multiple Requests with Consolidated Error Handling
// ========================================

export async function loadDashboardData() {
  const errors: string[] = [];

  // Fetch multiple endpoints
  const [profile, courses, assignments] = await Promise.allSettled([
    api.get('/students/me'),
    api.get('/courses/student/active'),
    api.get('/assignments/student/pending'),
  ]);

  // Handle each result
  if (profile.status === 'rejected') {
    handleApiError(profile.reason, {
      showToast: false,
      customMessage: 'Profil ma\'lumotlarini yuklab bo\'lmadi',
    });
    errors.push('profile');
  }

  if (courses.status === 'rejected') {
    handleApiError(courses.reason, {
      showToast: false,
      customMessage: 'Kurslarni yuklab bo\'lmadi',
    });
    errors.push('courses');
  }

  if (assignments.status === 'rejected') {
    handleApiError(assignments.reason, {
      showToast: false,
      customMessage: 'Topshiriqlarni yuklab bo\'lmadi',
    });
    errors.push('assignments');
  }

  // Show consolidated error if any failed
  if (errors.length > 0) {
    handleApiError(new Error('Ba\'zi ma\'lumotlarni yuklashda xatolik'), {
      showToast: true,
      includeRetry: true,
      onRetry: () => window.location.reload(),
    });
  }

  return {
    profile: profile.status === 'fulfilled' ? profile.value.data : null,
    courses: courses.status === 'fulfilled' ? courses.value.data : [],
    assignments: assignments.status === 'fulfilled' ? assignments.value.data : [],
  };
}
