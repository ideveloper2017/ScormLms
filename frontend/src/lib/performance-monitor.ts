import { toast } from 'sonner';

/**
 * Performance thresholds (in milliseconds)
 * Requirement 15.4: Log slow queries (>3 seconds)
 * Requirement 15.5: Display timeout warning (>5 seconds)
 */
const SLOW_QUERY_THRESHOLD = 3000; // 3 seconds
const TIMEOUT_WARNING_THRESHOLD = 5000; // 5 seconds

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitorConfig {
  slowQueryThreshold?: number;
  timeoutWarningThreshold?: number;
  enableConsoleLogging?: boolean;
  enableToastWarnings?: boolean;
}

const defaultConfig: Required<PerformanceMonitorConfig> = {
  slowQueryThreshold: SLOW_QUERY_THRESHOLD,
  timeoutWarningThreshold: TIMEOUT_WARNING_THRESHOLD,
  enableConsoleLogging: true,
  enableToastWarnings: true,
};

let config: Required<PerformanceMonitorConfig> = { ...defaultConfig };

/**
 * Configure performance monitoring thresholds
 */
export function configurePerformanceMonitoring(options: PerformanceMonitorConfig): void {
  config = { ...config, ...options };
}

/**
 * Get current performance thresholds
 */
export function getPerformanceThresholds(): Required<PerformanceMonitorConfig> {
  return { ...config };
}

/**
 * Performance monitor instance for a single API request
 */
export interface PerformanceMonitor {
  complete: () => void;
}

/**
 * Monitor an API request's performance
 * 
 * Requirement 15.1: Record request start time
 * Requirement 15.2: Record request end time
 * Requirement 15.3: Calculate request duration
 * Requirement 15.4: Log slow queries (>3 seconds) to console
 * Requirement 15.5: Display timeout warning (>5 seconds) to user
 * 
 * @param url - The API endpoint URL
 * @param method - The HTTP method (GET, POST, etc.)
 * @returns PerformanceMonitor instance with complete() method
 * 
 * @example
 * ```typescript
 * const monitor = monitorApiRequest('/api/v1/courses', 'GET');
 * // ... make API call
 * monitor.complete();
 * ```
 */
export function monitorApiRequest(url: string, method: string = 'GET'): PerformanceMonitor {
  // Requirement 15.1: Record request start time
  const startTime = performance.now();
  
  return {
    complete: () => {
      // Requirement 15.2: Record request end time
      const endTime = performance.now();
      
      // Requirement 15.3: Calculate request duration
      const duration = endTime - startTime;
      
      // Requirement 15.4: Log slow queries (>3 seconds) to console
      if (duration > config.slowQueryThreshold && config.enableConsoleLogging) {
        console.warn(
          `[Performance] Sekin so'rov: ${method} ${url}`,
          `Davomiyligi: ${(duration / 1000).toFixed(2)}s`
        );
      }
      
      // Requirement 15.5: Display timeout warning (>5 seconds) to user
      if (duration > config.timeoutWarningThreshold && config.enableToastWarnings) {
        toast.warning('Server sekin javob bermoqda', {
          description: `So'rov ${(duration / 1000).toFixed(1)} soniya davom etdi`,
          duration: 4000,
        });
      }
    },
  };
}

/**
 * Wrapper function to monitor any async API operation
 * 
 * @param operation - The async operation to monitor
 * @param label - A label for the operation (for logging)
 * @returns The result of the operation
 * 
 * @example
 * ```typescript
 * const data = await withPerformanceMonitoring(
 *   () => api.get('/api/v1/courses'),
 *   'GET /api/v1/courses'
 * );
 * ```
 */
export async function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> {
  const monitor = monitorApiRequest(label, 'OPERATION');
  
  try {
    const result = await operation();
    monitor.complete();
    return result;
  } catch (error) {
    monitor.complete();
    throw error;
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(0)}ms`;
  }
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

/**
 * Reset configuration to defaults
 */
export function resetPerformanceMonitoring(): void {
  config = { ...defaultConfig };
}
