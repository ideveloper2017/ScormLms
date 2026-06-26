/**
 * Unit Tests for useLoadingTransition Hook
 * 
 * Tests AC 9.5, 9.6, 9.7:
 * - 9.5: Transition from Loading_State to data display within 200 milliseconds
 * - 9.6: Animate the transition smoothly
 * - 9.7: Display for minimum 300 milliseconds to avoid flashing
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLoadingTransition, useLoadingTransitionWithFade } from '../useLoadingTransition';

describe('useLoadingTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return true when isLoading is true', () => {
      const { result } = renderHook(() => useLoadingTransition(true));
      
      expect(result.current).toBe(true);
    });

    it('should return false when isLoading starts as false', () => {
      const { result } = renderHook(() => useLoadingTransition(false));
      
      expect(result.current).toBe(false);
    });
  });

  describe('AC 9.7: Minimum Display Time (300ms)', () => {
    it('should display loading state for minimum 300ms even if loading finishes quickly', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useLoadingTransition(loading),
        { initialProps: { loading: true } }
      );

      // Initially loading
      expect(result.current).toBe(true);

      // Simulate fast API response after 50ms
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Stop loading
      act(() => {
        rerender({ loading: false });
      });

      // Should still show loading (only 50ms elapsed, need 300ms minimum)
      expect(result.current).toBe(true);

      // Advance time to complete minimum display time
      act(() => {
        vi.advanceTimersByTime(250); // 50 + 250 = 300ms
      });

      // Now should hide loading
      expect(result.current).toBe(false);
    });

    it('should transition immediately if loading took longer than 300ms', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useLoadingTransition(loading),
        { initialProps: { loading: true } }
      );

      // Initially loading
      expect(result.current).toBe(true);

      // Simulate slow API response after 400ms
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Stop loading
      act(() => {
        rerender({ loading: false });
      });

      // Should hide loading immediately (already exceeded 300ms)
      expect(result.current).toBe(false);
    });

    it('should prevent flashing for very fast responses (<50ms)', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useLoadingTransition(loading),
        { initialProps: { loading: true } }
      );

      // Simulate very fast response (10ms)
      act(() => {
        vi.advanceTimersByTime(10);
      });
      
      act(() => {
        rerender({ loading: false });
      });

      // Should still show loading
      expect(result.current).toBe(true);

      // Advance to minimum display time
      act(() => {
        vi.advanceTimersByTime(290); // 10 + 290 = 300ms
      });

      expect(result.current).toBe(false);
    });
  });

  describe('Custom Minimum Display Time', () => {
    it('should respect custom minDisplayTime option', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useLoadingTransition(loading, { minDisplayTime: 500 }),
        { initialProps: { loading: true } }
      );

      // Fast response after 100ms
      act(() => {
        vi.advanceTimersByTime(100);
      });
      
      act(() => {
        rerender({ loading: false });
      });

      // Should still show loading
      expect(result.current).toBe(true);

      // Advance to 400ms (not enough for 500ms minimum)
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe(true);

      // Advance to complete 500ms
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current).toBe(false);
    });
  });

  describe('AC 9.5, 9.6: Transition Delay', () => {
    it('should apply transition delay before hiding loading', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useLoadingTransition(loading, { 
          minDisplayTime: 300,
          transitionDelay: 200 
        }),
        { initialProps: { loading: true } }
      );

      // Loading completes after 400ms (exceeds minimum)
      act(() => {
        vi.advanceTimersByTime(400);
      });
      
      act(() => {
        rerender({ loading: false });
      });

      // Should still show loading during transition delay
      expect(result.current).toBe(true);

      // Advance by 100ms (not enough for 200ms delay)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current).toBe(true);

      // Complete transition delay
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current).toBe(false);
    });
  });

  describe('Multiple Loading Cycles', () => {
    it('should handle multiple loading cycles correctly', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useLoadingTransition(loading),
        { initialProps: { loading: false } }
      );

      // First cycle: start loading
      act(() => {
        rerender({ loading: true });
      });
      expect(result.current).toBe(true);

      // Fast response
      act(() => {
        vi.advanceTimersByTime(50);
      });
      act(() => {
        rerender({ loading: false });
      });

      // Complete minimum time
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current).toBe(false);

      // Second cycle: start loading again
      act(() => {
        rerender({ loading: true });
      });
      expect(result.current).toBe(true);

      // Another fast response
      act(() => {
        vi.advanceTimersByTime(50);
      });
      act(() => {
        rerender({ loading: false });
      });

      // Should enforce minimum time again
      expect(result.current).toBe(true);

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current).toBe(false);
    });
  });
});

describe('useLoadingTransitionWithFade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Fade State', () => {
    it('should provide fade state for smooth animations', () => {
      const { result, rerender } = renderHook(
        ({ loading }) => useLoadingTransitionWithFade(loading),
        { initialProps: { loading: true } }
      );

      // Initially loading, not fading
      expect(result.current.showLoading).toBe(true);
      expect(result.current.isFading).toBe(false);

      // Fast response
      act(() => {
        vi.advanceTimersByTime(50);
      });
      act(() => {
        rerender({ loading: false });
      });

      // After minimum display time, should start fading
      act(() => {
        vi.advanceTimersByTime(250); // Complete 300ms minimum
      });

      expect(result.current.showLoading).toBe(true);
      expect(result.current.isFading).toBe(true);

      // After fade completes (default 200ms)
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.showLoading).toBe(false);
      expect(result.current.isFading).toBe(false);
    });
  });
});
