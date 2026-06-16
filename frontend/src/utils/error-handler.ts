import { AxiosError } from 'axios';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/types/api.types';

/**
 * Configuration options for error handling behavior
 */
export interface ErrorHandlerOptions {
  /** Whether to show a toast notification for the error */
  showToast?: boolean;
  /** Whether to redirect to login on 401 authentication errors */
  redirectOnAuth?: boolean;
  /** Whether to log the error to the browser console */
  logToConsole?: boolean;
  /** Custom error message to display instead of the API message */
  customMessage?: string;
  /** Whether to include a retry action in the toast */
  includeRetry?: boolean;
  /** Callback function to execute on retry */
  onRetry?: () => void;
}

/**
 * Clears all authentication data from localStorage and redirects to login
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiresAt');
  localStorage.removeItem('user');
};

/**
 * Main error handler function that processes API errors and provides user feedback
 * 
 * @param error - The error object to handle (typically AxiosError or Error)
 * @param options - Configuration options for error handling behavior
 * @returns Structured ApiError object with status, message, code, and details
 * 
 * @example
 * ```typescript
 * try {
 *   await api.get('/students/me');
 * } catch (error) {
 *   const apiError = handleApiError(error, { showToast: true });
 *   console.error(apiError);
 * }
 * ```
 */
export const handleApiError = (
  error: unknown,
  options: ErrorHandlerOptions = {}
): ApiError => {
  const {
    showToast = true,
    redirectOnAuth = true,
    logToConsole = true,
    customMessage,
    includeRetry = false,
    onRetry,
  } = options;

  // Default error structure
  let apiError: ApiError = {
    status: 500,
    message: customMessage || 'Kutilmagan xatolik yuz berdi',
  };

  // Handle Axios errors (HTTP errors)
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data;

    // Extract error message from various possible response structures
    const errorMessage = data?.message || data?.error || error.message;

    apiError = {
      status,
      message: customMessage || errorMessage || 'Xatolik yuz berdi',
      code: data?.code,
      details: data?.details,
    };

    // Handle specific HTTP status codes
    switch (status) {
      case 401:
        apiError.message = "Avtorizatsiya xatosi. Iltimos, qayta kiring.";
        if (redirectOnAuth) {
          clearAuthData();
          // Delay redirect slightly to allow toast to show
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        }
        break;

      case 403:
        apiError.message = "Sizda bu amalni bajarish uchun ruxsat yo'q.";
        break;

      case 404:
        apiError.message = "So'ralgan ma'lumot topilmadi.";
        break;

      case 422:
        apiError.message = data?.message || "Ma'lumotlar validatsiyadan o'tmadi.";
        break;

      case 500:
        apiError.message = "Server xatosi. Iltimos, keyinroq urinib ko'ring.";
        break;

      case 503:
        apiError.message = "Server hozirda ishlamayapti. Iltimos, keyinroq urinib ko'ring.";
        break;
    }

    // Handle network-specific errors
    if (error.code === 'ECONNABORTED') {
      apiError.message = "So'rov vaqti tugadi. Internet aloqangizni tekshiring.";
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      apiError.message = "Server bilan bog'lanib bo'lmadi. Internet aloqangizni tekshiring.";
    }
  } else if (error instanceof Error) {
    // Handle standard JavaScript errors
    apiError.message = customMessage || error.message || 'Xatolik yuz berdi';
  }

  // Show toast notification if enabled
  if (showToast) {
    toast({
      title: 'Xatolik',
      description: apiError.message,
      variant: 'destructive' as const,
    });
  }

  // Log to console in development or if explicitly requested
  if (logToConsole && import.meta.env.DEV) {
    console.error('[API Error]', {
      status: apiError.status,
      message: apiError.message,
      code: apiError.code,
      details: apiError.details,
      originalError: error,
    });
  }

  return apiError;
};

/**
 * Formats validation error details into a readable string
 * 
 * @param details - Object containing field names and their error messages
 * @returns Formatted error string with field names and messages
 * 
 * @example
 * ```typescript
 * const details = {
 *   email: ['Email is required', 'Email must be valid'],
 *   password: ['Password is too short']
 * };
 * const formatted = formatValidationErrors(details);
 * // Returns: "email: Email is required, Email must be valid\npassword: Password is too short"
 * ```
 */
export const formatValidationErrors = (
  details?: Record<string, string[]>
): string => {
  if (!details || Object.keys(details).length === 0) {
    return '';
  }

  return Object.entries(details)
    .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
    .join('\n');
};

/**
 * Extracts a user-friendly error message from various error types
 * 
 * @param error - The error to extract a message from
 * @returns A user-friendly error message string
 * 
 * @example
 * ```typescript
 * const error = new AxiosError('Network error');
 * const message = getErrorMessage(error);
 * console.log(message); // "Network error"
 * ```
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    return data?.message || data?.error || error.message || 'Xatolik yuz berdi';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Noma\'lum xatolik yuz berdi';
};

/**
 * Checks if an error is a network connectivity error
 * 
 * @param error - The error to check
 * @returns true if the error is network-related, false otherwise
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      !error.response
    );
  }
  return false;
};

/**
 * Checks if an error is an authentication error (401)
 * 
 * @param error - The error to check
 * @returns true if the error is a 401 authentication error, false otherwise
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
};

/**
 * Checks if an error is a validation error (422)
 * 
 * @param error - The error to check
 * @returns true if the error is a 422 validation error, false otherwise
 */
export const isValidationError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    return error.response?.status === 422;
  }
  return false;
};

/**
 * Logs an error to the console with consistent formatting
 * Useful for debugging and monitoring
 * 
 * @param context - A string describing where/when the error occurred
 * @param error - The error to log
 * @param additionalData - Optional additional data to log with the error
 */
export const logError = (
  context: string,
  error: unknown,
  additionalData?: Record<string, unknown>
): void => {
  if (import.meta.env.DEV) {
    console.group(`[Error] ${context}`);
    console.error('Error:', error);
    if (additionalData) {
      console.log('Additional Data:', additionalData);
    }
    console.groupEnd();
  }
};

/**
 * Creates a retry function wrapper that handles errors consistently
 * 
 * @param fn - The async function to retry
 * @param options - Error handling options
 * @returns A wrapped function that handles errors and provides retry capability
 * 
 * @example
 * ```typescript
 * const fetchData = withErrorHandler(
 *   async () => api.get('/data'),
 *   { showToast: true, includeRetry: true }
 * );
 * ```
 */
export const withErrorHandler = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ErrorHandlerOptions = {}
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error, {
        ...options,
        onRetry: () => fn(...args),
      });
      throw error;
    }
  };
};
