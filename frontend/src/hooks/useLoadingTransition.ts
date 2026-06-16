/**
 * Loading Transition Hook
 * 
 * Implements AC 9.5, 9.6, 9.7 from Requirements:
 * - 9.5: Transition from Loading_State to data display within 200 milliseconds
 * - 9.6: Animate the transition smoothly
 * - 9.7: Display for minimum 300 milliseconds to avoid flashing
 * 
 * This hook ensures loading states are displayed for at least 300ms to prevent
 * flickering, then transitions smoothly to the data display state.
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useQuery(...);
 * const showLoading = useLoadingTransition(isLoading);
 * 
 * if (showLoading) return <Skeleton />;
 * return <DataDisplay data={data} />;
 * ```
 */

import { useState, useEffect, useRef } from 'react';

interface UseLoadingTransitionOptions {
  /**
   * Minimum time to display loading state (in milliseconds)
   * @default 300
   */
  minDisplayTime?: number;
  
  /**
   * Delay before starting fade-out transition (in milliseconds)
   * This allows for smooth transition timing
   * @default 0
   */
  transitionDelay?: number;
}

/**
 * Hook to manage loading state transitions with minimum display time
 * 
 * Ensures loading states are displayed for at least `minDisplayTime` milliseconds
 * to avoid flashing when API responses are very fast (<300ms).
 * 
 * @param isLoading - The loading state from React Query or other data fetching
 * @param options - Configuration options
 * @returns Boolean indicating whether to show loading state
 */
export function useLoadingTransition(
  isLoading: boolean,
  options: UseLoadingTransitionOptions = {}
): boolean {
  const { minDisplayTime = 300, transitionDelay = 0 } = options;
  
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // When loading starts, record the start time
    if (isLoading && !loadingStartTimeRef.current) {
      loadingStartTimeRef.current = Date.now();
      setShowLoading(true);
    }

    // When loading finishes, ensure minimum display time
    if (!isLoading && loadingStartTimeRef.current) {
      const elapsedTime = Date.now() - loadingStartTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      if (remainingTime > 0) {
        // Still need to show loading for minimum time
        timeoutRef.current = setTimeout(() => {
          setShowLoading(false);
          loadingStartTimeRef.current = null;
        }, remainingTime + transitionDelay);
      } else {
        // Minimum time already elapsed, transition immediately
        if (transitionDelay > 0) {
          timeoutRef.current = setTimeout(() => {
            setShowLoading(false);
            loadingStartTimeRef.current = null;
          }, transitionDelay);
        } else {
          setShowLoading(false);
          loadingStartTimeRef.current = null;
        }
      }
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, minDisplayTime, transitionDelay]);

  return showLoading;
}

/**
 * Hook variant that also provides a fade state for custom animations
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useQuery(...);
 * const { showLoading, isFading } = useLoadingTransitionWithFade(isLoading);
 * 
 * if (showLoading) {
 *   return <div className={isFading ? 'opacity-0' : 'opacity-100'}><Skeleton /></div>;
 * }
 * return <div className="animate-fade-in"><DataDisplay data={data} /></div>;
 * ```
 */
export function useLoadingTransitionWithFade(
  isLoading: boolean,
  options: UseLoadingTransitionOptions = {}
) {
  const { minDisplayTime = 300, transitionDelay = 200 } = options;
  
  const [showLoading, setShowLoading] = useState(isLoading);
  const [isFading, setIsFading] = useState(false);
  const loadingStartTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // When loading starts, record the start time
    if (isLoading && !loadingStartTimeRef.current) {
      loadingStartTimeRef.current = Date.now();
      setShowLoading(true);
      setIsFading(false);
    }

    // When loading finishes, ensure minimum display time and fade out
    if (!isLoading && loadingStartTimeRef.current) {
      const elapsedTime = Date.now() - loadingStartTimeRef.current;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      // Start fade-out animation
      const fadeStartDelay = remainingTime;
      setTimeout(() => {
        setIsFading(true);
      }, fadeStartDelay);

      // Remove loading state after fade completes
      timeoutRef.current = setTimeout(() => {
        setShowLoading(false);
        setIsFading(false);
        loadingStartTimeRef.current = null;
      }, fadeStartDelay + transitionDelay);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, minDisplayTime, transitionDelay]);

  return { showLoading, isFading };
}
