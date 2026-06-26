import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../api';
import * as performanceMonitor from '../performance-monitor';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

describe('API Performance Integration', () => {
  let mock: MockAdapter;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mock = new MockAdapter(api);
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
    consoleWarnSpy.mockRestore();
  });

  it('should monitor API request performance', async () => {
    const monitorSpy = vi.spyOn(performanceMonitor, 'monitorApiRequest');
    
    mock.onGet('/courses/student').reply(200, {
      success: true,
      data: [{ id: '1', title: 'Test Course' }],
    });

    await api.get('/courses/student');

    expect(monitorSpy).toHaveBeenCalledWith('/courses/student', 'GET');
  });

  it('should complete monitoring on successful response', async () => {
    const completeMock = vi.fn();
    const monitorSpy = vi.spyOn(performanceMonitor, 'monitorApiRequest').mockReturnValue({
      complete: completeMock,
    });

    mock.onGet('/test').reply(200, { success: true });

    await api.get('/test');

    expect(completeMock).toHaveBeenCalled();
    
    monitorSpy.mockRestore();
  });

  it('should complete monitoring on error response', async () => {
    const completeMock = vi.fn();
    const monitorSpy = vi.spyOn(performanceMonitor, 'monitorApiRequest').mockReturnValue({
      complete: completeMock,
    });

    mock.onGet('/error').reply(500, { success: false });

    try {
      await api.get('/error');
    } catch {
      // Expected error
    }

    expect(completeMock).toHaveBeenCalled();
    
    monitorSpy.mockRestore();
  });

  it('should not log warning for fast API requests (<3s)', async () => {
    const mockStartTime = 1000;
    const mockEndTime = 2000; // 1 second
    
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(mockStartTime)
      .mockReturnValueOnce(mockEndTime);

    mock.onGet('/fast').reply(200, { success: true });

    await api.get('/fast');

    // Should not log warning for fast requests
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('should log warning for slow API requests (>3s)', async () => {
    const mockStartTime = 1000;
    const mockEndTime = 4500; // 3.5 seconds
    
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(mockStartTime)
      .mockReturnValueOnce(mockEndTime);

    mock.onGet('/slow').reply(200, { success: true });

    await api.get('/slow');

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Performance] Sekin so\'rov: GET /slow'),
      expect.stringContaining('Davomiyligi: 3.50s')
    );
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it('should show toast warning for very slow API requests (>5s)', async () => {
    const mockStartTime = 1000;
    const mockEndTime = 6200; // 5.2 seconds
    
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(mockStartTime)
      .mockReturnValueOnce(mockEndTime);

    mock.onGet('/very-slow').reply(200, { success: true });

    await api.get('/very-slow');

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(
      'Server sekin javob bermoqda',
      expect.objectContaining({
        description: 'So\'rov 5.2 soniya davom etdi',
        duration: 4000,
      })
    );
  });

  it('should monitor POST requests', async () => {
    const monitorSpy = vi.spyOn(performanceMonitor, 'monitorApiRequest');
    
    mock.onPost('/assignments/1/submit').reply(200, { success: true });

    await api.post('/assignments/1/submit', { answer: 'test' });

    expect(monitorSpy).toHaveBeenCalledWith('/assignments/1/submit', 'POST');
  });

  it('should monitor PUT requests', async () => {
    const monitorSpy = vi.spyOn(performanceMonitor, 'monitorApiRequest');
    
    mock.onPut('/notifications/1/read').reply(200, { success: true });

    await api.put('/notifications/1/read');

    expect(monitorSpy).toHaveBeenCalledWith('/notifications/1/read', 'PUT');
  });

  it('should monitor DELETE requests', async () => {
    const monitorSpy = vi.spyOn(performanceMonitor, 'monitorApiRequest');
    
    mock.onDelete('/courses/1').reply(200, { success: true });

    await api.delete('/courses/1');

    expect(monitorSpy).toHaveBeenCalledWith('/courses/1', 'DELETE');
  });
});
