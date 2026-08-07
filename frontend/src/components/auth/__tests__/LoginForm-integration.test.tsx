import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { AuthProvider } from '@/contexts/auth-context';
import { faceRecognitionApi } from '@/services/api/face-recognition-api';
import * as api from '@/lib/api';

const mockGetUserMedia = vi.fn();

Object.defineProperty(global.navigator, 'mediaDevices', {
  configurable: true,
  value: { getUserMedia: mockGetUserMedia },
});

// Mock the face recognition API
vi.mock('@/services/api/face-recognition-api', () => ({
  faceRecognitionApi: {
    getFacePhotoUrl: vi.fn(),
    verifyFaceMatch: vi.fn(),
  },
}));

// Mock the API module
vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual('@/lib/api');
  return {
    ...actual,
    login: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    getToken: vi.fn(),
  };
});

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const renderLoginForm = async () => {
  const result = render(
    <BrowserRouter>
      <AuthProvider>
        <LoginForm onSuccess={vi.fn()} />
      </AuthProvider>
    </BrowserRouter>
  );
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /^kirish$/i })).toBeEnabled();
  });
  return result;
};

describe('LoginForm - credential login with deferred biometric governance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetUserMedia.mockResolvedValue({ getTracks: () => [] });
    
    // Mock default API responses
    vi.mocked(api.isAuthenticated).mockResolvedValue(false);
    vi.mocked(api.getToken).mockReturnValue(null);
  });

  describe('Student login', () => {
    it('does not collect or inspect biometric data during credential login', async () => {
      // Mock successful student login
      const mockLoginResponse = {
        data: {
          success: true,
          message: 'Login successful',
          data: {
            token: 'mock-jwt-token',
            user: {
              id: '1',
              username: 'student',
              email: 'student@test.com',
              roles: [{ name: 'ROLE_STUDENT', code: 'STUDENT' }],
            },
          },
        },
      };
      vi.mocked(api.login).mockResolvedValue(mockLoginResponse as any);

      await renderLoginForm();

      // Fill in login form
      const usernameInput = screen.getByLabelText(/^login$/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /^kirish$/i });

      fireEvent.change(usernameInput, { target: { value: 'student' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.login).toHaveBeenCalled();
      }, { timeout: 3000 });
      expect(faceRecognitionApi.getFacePhotoUrl).not.toHaveBeenCalled();
      expect(faceRecognitionApi.verifyFaceMatch).not.toHaveBeenCalled();
      expect(mockGetUserMedia).not.toHaveBeenCalled();
    });

    it('does not create the removed faceRecognitionCompleted bypass flag', async () => {
      const mockLoginResponse = {
        data: {
          success: true,
          data: {
            token: 'mock-jwt-token',
            user: {
              id: '1',
              username: 'student',
              roles: [{ name: 'ROLE_STUDENT' }],
            },
          },
        },
      };
      vi.mocked(api.login).mockResolvedValue(mockLoginResponse as any);

      await renderLoginForm();

      const usernameInput = screen.getByLabelText(/^login$/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /^kirish$/i });

      fireEvent.change(usernameInput, { target: { value: 'student' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.login).toHaveBeenCalled();
      }, { timeout: 3000 });
      expect(localStorage.getItem('faceRecognitionCompleted')).toBeNull();
    });
  });

  describe('Non-Student Login', () => {
    it('should not check for face photo for non-student users', async () => {
      const mockLoginResponse = {
        data: {
          success: true,
          data: {
            token: 'mock-jwt-token',
            user: {
              id: '1',
              username: 'admin',
              roles: [{ name: 'ROLE_ADMIN' }],
            },
          },
        },
      };
      vi.mocked(api.login).mockResolvedValue(mockLoginResponse as any);

      await renderLoginForm();

      const usernameInput = screen.getByLabelText(/^login$/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /^kirish$/i });

      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.login).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Should NOT check for face photo for non-students
      expect(faceRecognitionApi.getFacePhotoUrl).not.toHaveBeenCalled();
    });

    it('should directly proceed to success for instructors', async () => {
      const mockLoginResponse = {
        data: {
          success: true,
          data: {
            token: 'mock-jwt-token',
            user: {
              id: '2',
              username: 'instructor',
              roles: [{ name: 'ROLE_TEACHER' }],
            },
          },
        },
      };
      vi.mocked(api.login).mockResolvedValue(mockLoginResponse as any);

      await renderLoginForm();

      const usernameInput = screen.getByLabelText(/^login$/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /^kirish$/i });

      fireEvent.change(usernameInput, { target: { value: 'instructor' } });
      fireEvent.change(passwordInput, { target: { value: 'instructor123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.login).toHaveBeenCalled();
      }, { timeout: 3000 });

      expect(faceRecognitionApi.getFacePhotoUrl).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('should not attempt face photo check if login fails', async () => {
      const mockLoginResponse = {
        data: {
          success: false,
          message: 'Invalid credentials',
        },
      };
      vi.mocked(api.login).mockResolvedValue(mockLoginResponse as any);

      await renderLoginForm();

      const usernameInput = screen.getByLabelText(/^login$/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /^kirish$/i });

      fireEvent.change(usernameInput, { target: { value: 'student' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.login).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Should NOT check face photo if login fails
      expect(faceRecognitionApi.getFacePhotoUrl).not.toHaveBeenCalled();
    });
  });
});
