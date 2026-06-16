import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary, DefaultErrorFallback, useErrorBoundary } from '../error-boundary';
import React from 'react';

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean; error?: Error }> = ({
  shouldThrow = true,
  error = new Error('Test error message'),
}) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>No error</div>;
};

// Component to test useErrorBoundary hook
const ComponentWithHook: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  const throwError = useErrorBoundary();

  React.useEffect(() => {
    if (shouldThrow) {
      throwError(new Error('Hook error'));
    }
  }, [shouldThrow, throwError]);

  return <div>Component with hook</div>;
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;
  const originalEnv = import.meta.env.DEV;

  beforeEach(() => {
    // Suppress console.error for tests (error boundaries log to console)
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    // Reset environment
    (import.meta.env as any).DEV = originalEnv;
  });

  describe('Component Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render children normally with ThrowError component not throwing', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch error and display default error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Xatolik yuz berdi')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should display user-friendly error message in Uzbek', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Komponent yuklanishida kutilmagan xatolik sodir bo\'ldi')).toBeInTheDocument();
    });

    it('should display error message from thrown error', () => {
      const customError = new Error('Custom error message');
      
      render(
        <ErrorBoundary>
          <ThrowError error={customError} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should provide retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /qayta urinish/i })).toBeInTheDocument();
    });

    it('should provide page refresh button', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /sahifani yangilash/i })).toBeInTheDocument();
    });

    it('should reset error state when retry button is clicked', () => {
      let shouldThrow = true;
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // Error UI should be displayed
      expect(screen.getByText('Xatolik yuz berdi')).toBeInTheDocument();

      // Change shouldThrow to false
      shouldThrow = false;

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /qayta urinish/i });
      fireEvent.click(retryButton);

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );

      // Should show normal content now
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should reload page when refresh button is clicked', () => {
      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByRole('button', { name: /sahifani yangilash/i });
      fireEvent.click(refreshButton);

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('Development Mode Features', () => {
    it('should show error stack in development mode', () => {
      (import.meta.env as any).DEV = true;

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Texnik ma\'lumotlar (faqat development rejimida)')).toBeInTheDocument();
    });

    it('should hide error stack in production mode', () => {
      (import.meta.env as any).DEV = false;

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Texnik ma\'lumotlar (faqat development rejimida)')).not.toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback component when provided', () => {
      const CustomFallback: React.FC<any> = ({ error }) => (
        <div>
          <h1>Custom Error UI</h1>
          <p>{error?.message}</p>
        </div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError error={new Error('Custom fallback test')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      expect(screen.getByText('Custom fallback test')).toBeInTheDocument();
    });
  });

  describe('DefaultErrorFallback Component', () => {
    it('should render with error details', () => {
      const error = new Error('Fallback test error');
      const resetError = vi.fn();

      render(
        <DefaultErrorFallback
          error={error}
          resetError={resetError}
        />
      );

      expect(screen.getByText('Dastur xatoligi')).toBeInTheDocument();
      expect(screen.getByText('Fallback test error')).toBeInTheDocument();
    });

    it('should call resetError when retry button clicked', () => {
      const resetError = vi.fn();
      const error = new Error('Test error');

      render(
        <DefaultErrorFallback
          error={error}
          resetError={resetError}
        />
      );

      const retryButton = screen.getByRole('button', { name: /qayta urinish/i });
      fireEvent.click(retryButton);

      expect(resetError).toHaveBeenCalled();
    });

    it('should navigate to home when home button clicked', () => {
      const resetError = vi.fn();
      const error = new Error('Test error');

      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(
        <DefaultErrorFallback
          error={error}
          resetError={resetError}
        />
      );

      const homeButton = screen.getByRole('button', { name: /bosh sahifaga qaytish/i });
      fireEvent.click(homeButton);

      expect(window.location.href).toBe('/');
    });

    it('should show help text', () => {
      const resetError = vi.fn();
      const error = new Error('Test error');

      render(
        <DefaultErrorFallback
          error={error}
          resetError={resetError}
        />
      );

      expect(screen.getByText('Muammo takrorlansa, texnik yordam bilan bog\'laning')).toBeInTheDocument();
    });
  });

  describe('useErrorBoundary Hook', () => {
    it('should trigger error boundary when hook is used', () => {
      render(
        <ErrorBoundary>
          <ComponentWithHook shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Xatolik yuz berdi')).toBeInTheDocument();
      expect(screen.getByText('Hook error')).toBeInTheDocument();
    });

    it('should not trigger error boundary when hook is not called', () => {
      render(
        <ErrorBoundary>
          <ComponentWithHook shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component with hook')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should work with multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should catch errors from nested components', () => {
      const NestedComponent = () => (
        <div>
          <div>
            <ThrowError />
          </div>
        </div>
      );

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Xatolik yuz berdi')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /qayta urinish/i });
      const refreshButton = screen.getByRole('button', { name: /sahifani yangilash/i });

      expect(retryButton).toBeInTheDocument();
      expect(refreshButton).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Xatolik yuz berdi')).toBeInTheDocument();
    });
  });
});
