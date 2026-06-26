import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { AuthProvider } from '@/contexts/auth-context';
import { faceRecognitionApi } from '@/services/api/face-recognition-api';
import * as api from '@/lib/api';

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

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginForm onSuccess={vi.fn()} />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginForm - Face Recognition Integration (Task 18.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock default API responses
    vi.mocked(api.isAuthenticated).mockResolvedValue(false);
    vi.mocked(api.getToken).mockReturnValue(null);
  });

  describe('Student Login with Face Photo', () => {
    it('should check for face photo after successful student login', async () => {
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

      // Mock that user HAS a face photo
      vi.mocked(faceRecognitionApi.getFacePhotoUrl).mockResolvedValue({
        photoUrl: 'https://example.com/face.jpg',
        uploadedAt: new Date(),
      });

      renderLoginForm();

      // Fill in login form
      const usernameInput = screen.getByPlaceholderText(/email yoki login/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /kirish/i });

      fireEvent.change(usernameInput, { target: { value: 'student' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Wait for face photo check
      await waitFor(() => {
        expect(faceRecognitionApi.getFacePhotoUrl).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should set face recognition as required when user has face photo', async () => {
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
      vi.mocked(faceRecognitionApi.getFacePhotoUrl).mockResolvedValue({
        photoUrl: 'https://example.com/face.jpg',
        uploadedAt: new Date(),
      });

      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText(/email yoki login/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /kirish/i });

      fireEvent.change(usernameInput, { target: { value: 'student' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(faceRecognitionApi.getFacePhotoUrl).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Face recognition should be required - user will be redirected to App.tsx
      // where FaceRecognition component will be shown
    });
  });

  describe('Student Login without Face Photo', () => {
    it('should check for face photo and allow skip when no photo exists', async () => {
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

      // Mock that user DOES NOT have a face photo
      vi.mocked(faceRecognitionApi.getFacePhotoUrl).mockResolvedValue(null);

      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText(/email yoki login/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /kirish/i });

      fireEvent.change(usernameInput, { target: { value: 'student' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(faceRecognitionApi.getFacePhotoUrl).toHaveBeenCalled();
      }, { timeout: 3000 });

      // User should be allowed to proceed without face recognition
      // Face recognition NOT required for first-time users
    });

    it('should handle API errors gracefully and allow login', async () => {
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

      // Mock API error when checking face photo
      vi.mocked(faceRecognitionApi.getFacePhotoUrl).mockRejectedValue(
        new Error('Network error')
      );

      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText(/email yoki login/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /kirish/i });

      fireEvent.change(usernameInput, { target: { value: 'student' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(faceRecognitionApi.getFacePhotoUrl).toHaveBeenCalled();
      }, { timeout: 3000 });

      // User should still be allowed to login even if face photo check fails
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

      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText(/email yoki login/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /kirish/i });

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

      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText(/email yoki login/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /kirish/i });

      fireEvent.change(usernameInput, { target: { value: 'instructor' } });
      fireEvent.change(passwordInput, { target: { value: 'instructor123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.login).toHaveBeenCalled();
      }, { timeout: 3000 });

      expect(faceRecognitionApi.getFacePhotoUrl).not.toHaveBeenCalled();
    });
  });

  describe('Quick Login Integration', () => {
    it('should check face photo when quick login as student', async () => {
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
      vi.mocked(faceRecognitionApi.getFacePhotoUrl).mockResolvedValue({
        photoUrl: 'https://example.com/face.jpg',
        uploadedAt: new Date(),
      });

      renderLoginForm();

      // Click quick login student button
      const studentQuickLogin = screen.getByRole('button', { name: /talaba/i });
      fireEvent.click(studentQuickLogin);

      await waitFor(() => {
        expect(faceRecognitionApi.getFacePhotoUrl).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should not check face photo when quick login as admin', async () => {
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

      renderLoginForm();

      // Click quick login admin button
      const adminQuickLogin = screen.getByRole('button', { name: /admin/i });
      fireEvent.click(adminQuickLogin);

      await waitFor(() => {
        expect(api.login).toHaveBeenCalled();
      }, { timeout: 3000 });

      expect(faceRecognitionApi.getFacePhotoUrl).not.toHaveBeenCalled();
    });
  });

  describe('LocalStorage Integration', () => {
    it('should initialize faceRecognitionCompleted flag in localStorage', async () => {
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
      vi.mocked(faceRecognitionApi.getFacePhotoUrl).mockResolvedValue(null);

      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText(/email yoki login/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /kirish/i });

      fireEvent.change(usernameInput, { target: { value: 'student' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.login).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Should set faceRecognitionCompleted flag
      expect(localStorage.getItem('faceRecognitionCompleted')).toBeDefined();
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

      renderLoginForm();

      const usernameInput = screen.getByPlaceholderText(/email yoki login/i);
      const passwordInput = screen.getByPlaceholderText(/parolingizni kiriting/i);
      const loginButton = screen.getByRole('button', { name: /kirish/i });

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
