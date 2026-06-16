import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { monitorApiRequest, withPerformanceMonitoring, getPerformanceThresholds } from '../performance-monitor';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe('performance-monitor', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Mock performance.now()
    vi.spyOn(performance, 'now');
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('monitorApiRequest', () => {
    it('should create a performance monitor with complete method', () => {
      const monitor = monitorApiRequest('/api/v1/test', 'GET');
      
      expect(monitor).toHaveProperty('complete');
      expect(typeof monitor.complete).toBe('function');
    });

    it('should record start time when monitor is created', () => {
      const mockStartTime = 1000;
      vi.mocked(performance.now).mockReturnValueOnce(mockStartTime);
      
      const monitor = monitorApiRequest('/api/v1/test', 'GET');
      
      expect(performance.now).toHaveBeenCalled();
      expect(monitor).toBeDefined();
    });

    it('should calculate duration when complete is called', () => {
      const mockStartTime = 1000;
      const mockEndTime = 2000;
      
      vi.mocked(performance.now)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      const monitor = monitorApiRequest('/api/v1/test', 'GET');
      monitor.complete();
      
      expect(performance.now).toHaveBeenCalledTimes(2);
    });

    it('should not log warning for fast requests (<3 seconds)', () => {
      const mockStartTime = 1000;
      const mockEndTime = 2500; // 1.5 seconds
      
      vi.mocked(performance.now)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      const monitor = monitorApiRequest('/api/v1/test', 'GET');
      monitor.complete();
      
      expect(console.warn).not.toHaveBeenCalled();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should log console warning for slow requests (>3 seconds)', () => {
      const mockStartTime = 1000;
      const mockEndTime = 4500; // 3.5 seconds
      
      vi.mocked(performance.now)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      const monitor = monitorApiRequest('/api/v1/courses', 'GET');
      monitor.complete();
      
      expect(console.warn).toHaveBeenCalledWith(
        '[Performance] Sekin so\'rov: GET /api/v1/courses',
        'Davomiyligi: 3.50s'
      );
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should show toast warning for very slow requests (>5 seconds)', () => {
      const mockStartTime = 1000;
      const mockEndTime = 6500; // 5.5 seconds
      
      vi.mocked(performance.now)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      const monitor = monitorApiRequest('/api/v1/tests', 'POST');
      monitor.complete();
      
      expect(console.warn).toHaveBeenCalled();
      expect(toast.warning).toHaveBeenCalledWith(
        'Server sekin javob bermoqda',
        expect.objectContaining({
          description: 'So\'rov 5.5 soniya davom etdi',
          duration: 4000,
        })
      );
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      methods.forEach((method) => {
        const monitor = monitorApiRequest('/api/v1/test', method);
        expect(monitor).toBeDefined();
      });
    });

    it('should default to GET method if not provided', () => {
      const mockStartTime = 1000;
      const mockEndTime = 4500; // 3.5 seconds (needs to be >3000ms threshold)
      
      vi.mocked(performance.now)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      const monitor = monitorApiRequest('/api/v1/test');
      monitor.complete();
      
      expect(console.warn).toHaveBeenCalledWith(
        '[Performance] Sekin so\'rov: GET /api/v1/test',
        expect.any(String)
      );
    });
  });

  describe('withPerformanceMonitoring', () => {
    it('should monitor async operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ data: 'test' });
      const mockStartTime = 1000;
      const mockEndTime = 1500;
      
      vi.mocked(performance.now)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      const result = await withPerformanceMonitoring(
        mockOperation,
        'Test Operation'
      );
      
      expect(mockOperation).toHaveBeenCalled();
      expect(result).toEqual({ data: 'test' });
    });

    it('should complete monitoring even if operation fails', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Test error'));
      const mockStartTime = 1000;
      const mockEndTime = 1500;
      
      vi.mocked(performance.now)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      await expect(
        withPerformanceMonitoring(mockOperation, 'Failing Operation')
      ).rejects.toThrow('Test error');
      
      expect(performance.now).toHaveBeenCalledTimes(2);
    });

    it('should log slow operations', async () => {
      const mockOperation = vi.fn().mockResolvedValue({ data: 'test' });
      const mockStartTime = 1000;
      const mockEndTime = 5000; // 4 seconds
      
      vi.mocked(performance.now)
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      await withPerformanceMonitoring(mockOperation, 'Slow Operation');
      
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('getPerformanceThresholds', () => {
    it('should return default thresholds', () => {
      const thresholds = getPerformanceThresholds();
      
      expect(thresholds.slowQueryThreshold).toBe(3000);
      expect(thresholds.timeoutWarningThreshold).toBe(5000);
      expect(thresholds.enableConsoleLogging).toBe(true);
      expect(thresholds.enableToastWarnings).toBe(true);
    });
  });
});
