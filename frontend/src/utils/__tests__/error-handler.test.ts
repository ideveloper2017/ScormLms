import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError } from 'axios';
import {
  handleApiError,
  formatValidationErrors,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  isValidationError,
  clearAuthData,
} from '../error-handler';
import { toast } from '@/hooks/use-toast';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('error-handler utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleApiError', () => {
    it('should handle 401 unauthorized errors', () => {
      const error = new AxiosError('Unauthorized', '401', undefined, undefined, {
        status: 401,
        data: { message: 'Token expired' },
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      } as any);

      const result = handleApiError(error, {
        showToast: false,
        redirectOnAuth: false,
        logToConsole: false,
      });

      expect(result.status).toBe(401);
      expect(result.message).toContain('Avtorizatsiya');
    });

    it('should handle 403 forbidden errors', () => {
      const error = new AxiosError('Forbidden', '403', undefined, undefined, {
        status: 403,
        data: { message: 'Access denied' },
        statusText: 'Forbidden',
        headers: {},
        config: {} as any,
      } as any);

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
      });

      expect(result.status).toBe(403);
      expect(result.message).toContain('ruxsat');
    });

    it('should handle 404 not found errors', () => {
      const error = new AxiosError('Not Found', '404', undefined, undefined, {
        status: 404,
        data: { message: 'Resource not found' },
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
      } as any);

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
      });

      expect(result.status).toBe(404);
      expect(result.message).toContain('topilmadi');
    });

    it('should handle 422 validation errors', () => {
      const error = new AxiosError('Validation Error', '422', undefined, undefined, {
        status: 422,
        data: {
          message: 'Validation failed',
          details: {
            email: ['Email is required'],
            password: ['Password too short'],
          },
        },
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as any,
      } as any);

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
      });

      expect(result.status).toBe(422);
      expect(result.details).toEqual({
        email: ['Email is required'],
        password: ['Password too short'],
      });
    });

    it('should handle 500 server errors', () => {
      const error = new AxiosError('Server Error', '500', undefined, undefined, {
        status: 500,
        data: { message: 'Internal server error' },
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      } as any);

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
      });

      expect(result.status).toBe(500);
      expect(result.message).toContain('Server xatosi');
    });

    it('should handle network timeout errors', () => {
      const error = new AxiosError('Timeout', 'ECONNABORTED');
      error.code = 'ECONNABORTED';

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
      });

      expect(result.message).toContain('vaqti tugadi');
    });

    it('should handle network connection errors', () => {
      const error = new AxiosError('Network Error', 'ERR_NETWORK');
      error.code = 'ERR_NETWORK';

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
      });

      expect(result.message).toContain("bog'lanib bo'lmadi");
    });

    it('should show toast notification when enabled', () => {
      const error = new Error('Test error');

      handleApiError(error, {
        showToast: true,
        logToConsole: false,
      });

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Xatolik',
          variant: 'destructive',
        })
      );
    });

    it('should use custom error message when provided', () => {
      const error = new Error('Original error');

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
        customMessage: 'Custom error message',
      });

      expect(result.message).toBe('Custom error message');
    });

    it('should handle standard JavaScript errors', () => {
      const error = new Error('Standard error message');

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
      });

      expect(result.message).toBe('Standard error message');
    });

    it('should extract error code from API response', () => {
      const error = new AxiosError('Error', '400', undefined, undefined, {
        status: 400,
        data: { message: 'Bad request', code: 'INVALID_INPUT' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      } as any);

      const result = handleApiError(error, {
        showToast: false,
        logToConsole: false,
      });

      expect(result.code).toBe('INVALID_INPUT');
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors correctly', () => {
      const details = {
        email: ['Email is required', 'Email must be valid'],
        password: ['Password is too short'],
      };

      const result = formatValidationErrors(details);

      expect(result).toContain('email:');
      expect(result).toContain('Email is required');
      expect(result).toContain('Email must be valid');
      expect(result).toContain('password:');
      expect(result).toContain('Password is too short');
    });

    it('should return empty string for no details', () => {
      const result = formatValidationErrors(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty details object', () => {
      const result = formatValidationErrors({});
      expect(result).toBe('');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from AxiosError', () => {
      const error = new AxiosError('Network error', 'ERR_NETWORK', undefined, undefined, {
        status: 500,
        data: { message: 'Server error message' },
        statusText: 'Error',
        headers: {},
        config: {} as any,
      } as any);

      const message = getErrorMessage(error);
      expect(message).toBe('Server error message');
    });

    it('should extract message from standard Error', () => {
      const error = new Error('Standard error');
      const message = getErrorMessage(error);
      expect(message).toBe('Standard error');
    });

    it('should handle string errors', () => {
      const message = getErrorMessage('String error');
      expect(message).toBe('String error');
    });

    it('should handle unknown error types', () => {
      const message = getErrorMessage({ unknown: 'object' });
      expect(message).toContain('xatolik');
    });
  });

  describe('isNetworkError', () => {
    it('should return true for ERR_NETWORK errors', () => {
      const error = new AxiosError('Network Error', 'ERR_NETWORK');
      error.code = 'ERR_NETWORK';
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for ECONNABORTED errors', () => {
      const error = new AxiosError('Timeout', 'ECONNABORTED');
      error.code = 'ECONNABORTED';
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return true for errors without response', () => {
      const error = new AxiosError('No response');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should return false for HTTP errors with response', () => {
      const error = new AxiosError('Server Error', '500', undefined, undefined, {
        status: 500,
        data: {},
        statusText: 'Error',
        headers: {},
        config: {} as any,
      } as any);
      expect(isNetworkError(error)).toBe(false);
    });

    it('should return false for non-AxiosError', () => {
      const error = new Error('Standard error');
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('should return true for 401 errors', () => {
      const error = new AxiosError('Unauthorized', '401', undefined, undefined, {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      } as any);
      expect(isAuthError(error)).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = new AxiosError('Forbidden', '403', undefined, undefined, {
        status: 403,
        data: {},
        statusText: 'Forbidden',
        headers: {},
        config: {} as any,
      } as any);
      expect(isAuthError(error)).toBe(false);
    });

    it('should return false for non-AxiosError', () => {
      const error = new Error('Standard error');
      expect(isAuthError(error)).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for 422 errors', () => {
      const error = new AxiosError('Validation Error', '422', undefined, undefined, {
        status: 422,
        data: {},
        statusText: 'Unprocessable Entity',
        headers: {},
        config: {} as any,
      } as any);
      expect(isValidationError(error)).toBe(true);
    });

    it('should return false for other status codes', () => {
      const error = new AxiosError('Not Found', '404', undefined, undefined, {
        status: 404,
        data: {},
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
      } as any);
      expect(isValidationError(error)).toBe(false);
    });

    it('should return false for non-AxiosError', () => {
      const error = new Error('Standard error');
      expect(isValidationError(error)).toBe(false);
    });
  });

  describe('clearAuthData', () => {
    it('should remove all auth-related items from localStorage', () => {
      const removeItemMock = vi.spyOn(localStorage, 'removeItem');

      clearAuthData();

      expect(removeItemMock).toHaveBeenCalledWith('token');
      expect(removeItemMock).toHaveBeenCalledWith('refreshToken');
      expect(removeItemMock).toHaveBeenCalledWith('tokenExpiresAt');
      expect(removeItemMock).toHaveBeenCalledWith('user');
      expect(removeItemMock).toHaveBeenCalledTimes(4);
    });
  });
});
