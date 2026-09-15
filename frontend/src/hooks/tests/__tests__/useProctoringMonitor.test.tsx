import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProctoringMonitor } from '../useProctoringMonitor';
import { startLocalMonitoring } from '@/lib/proctoring-signals';
vi.mock('@/lib/proctoring-signals', () => ({ startLocalMonitoring: vi.fn() }));
import { keepaliveProctoringEvents, recordProctoringEvents } from '@/services/proctoring-api';

vi.mock('@/services/proctoring-api', () => ({
  recordProctoringEvents: vi.fn(),
  keepaliveProctoringEvents: vi.fn(),
}));

describe('useProctoringMonitor', () => {
  let endedListener: (() => void) | undefined;
  const stop = vi.fn();
  const track = {
    stop,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      if (type === 'ended') endedListener = listener;
    }),
  } as unknown as MediaStreamTrack;
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;

  beforeEach(() => {
    vi.clearAllMocks();
    endedListener = undefined;
    sessionStorage.clear();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
      configurable: true,
    });
    vi.mocked(recordProctoringEvents).mockResolvedValue({
      accepted: 1,
      duplicates: 0,
      serverTime: new Date(),
    });
    vi.mocked(keepaliveProctoringEvents).mockReturnValue(null);
  });

  afterEach(() => sessionStorage.clear());

  it('kamerani ishga tushiradi va tab hamda kamera uzilishi hodisalarini yuboradi', async () => {
    const { result, unmount } = renderHook(() => useProctoringMonitor({
      enabled: true,
      testId: '9',
      attemptId: '21',
    }));

    await waitFor(() => expect(result.current.cameraStatus).toBe('active'));
    expect(startLocalMonitoring).not.toHaveBeenCalled();
    await waitFor(() => expect(allTypes()).toContain('CAMERA_STARTED'));

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await waitFor(() => expect(allTypes()).toContain('TAB_HIDDEN'));

    act(() => endedListener?.());
    await waitFor(() => expect(result.current.cameraStatus).toBe('stopped'));
    await waitFor(() => expect(allTypes()).toContain('CAMERA_STOPPED'));

    unmount();
    expect(stop).toHaveBeenCalled();
  });

  it('offline hodisani navbatda saqlaydi va online bolganda yuboradi', async () => {
    const { result } = renderHook(() => useProctoringMonitor({
      enabled: true,
      testId: '9',
      attemptId: '21',
    }));
    await waitFor(() => expect(result.current.cameraStatus).toBe('active'));

    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    act(() => window.dispatchEvent(new Event('offline')));
    await waitFor(() => expect(result.current.queuedEvents).toBeGreaterThan(0));

    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    act(() => window.dispatchEvent(new Event('online')));
    await waitFor(() => expect(allTypes()).toContain('NETWORK_OFFLINE'));
    await waitFor(() => expect(allTypes()).toContain('NETWORK_ONLINE'));
  });

  function allTypes(): string[] {
    return vi.mocked(recordProctoringEvents).mock.calls.flatMap((call) => call[2].map((event) => event.type));
  }

  it('starts local sensors only when opted in and stops them when disabled', async () => {
    const stopSensors = vi.fn();
    vi.mocked(startLocalMonitoring).mockReturnValue(stopSensors);
    const { result, rerender } = renderHook(({ enabled }) => useProctoringMonitor({ enabled, testId: '9', attemptId: '21', localMonitoringEnabled: true }), { initialProps: { enabled: true } });
    await waitFor(() => expect(result.current.cameraStatus).toBe('active'));
    expect(startLocalMonitoring).toHaveBeenCalledOnce();
    rerender({ enabled: false });
    expect(stopSensors).toHaveBeenCalledOnce();
    expect(result.current.sensors).toEqual({ audio: 'disabled', visual: 'disabled' });
  });
});
