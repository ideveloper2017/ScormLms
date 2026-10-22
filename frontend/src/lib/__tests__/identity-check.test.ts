import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startIdentityChecks } from '../identity-check';

describe('startIdentityChecks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom'da video/canvas yo'q — kadr olishni soxtalashtiramiz.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { configurable: true, get: () => 640 });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { configurable: true, get: () => 480 });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['jpeg'], { type: 'image/jpeg' })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('birinchi kadrni 60–90 soniyada, keyingisini server aytgan vaqtda yuboradi va maslahatni uzatadi', async () => {
    const send = vi.fn()
      .mockResolvedValueOnce({ recorded: true, hint: "Yuzingiz kamerada ko'rinsin", nextCheckInSeconds: 150 })
      .mockResolvedValueOnce({ recorded: true, hint: null, nextCheckInSeconds: 200 });
    const onHint = vi.fn();
    const stop = startIdentityChecks({} as MediaStream, send, onHint);

    await vi.advanceTimersByTimeAsync(59_000);
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(31_000);
    expect(send).toHaveBeenCalledTimes(1);
    expect(onHint).toHaveBeenLastCalledWith("Yuzingiz kamerada ko'rinsin");

    await vi.advanceTimersByTimeAsync(150_000);
    expect(send).toHaveBeenCalledTimes(2);
    expect(onHint).toHaveBeenLastCalledWith(null);

    stop();
    await vi.advanceTimersByTimeAsync(600_000);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('tarmoq xatosida test davom etadi va bir daqiqadan keyin qayta uriniladi', async () => {
    const send = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ recorded: true, hint: null, nextCheckInSeconds: 200 });
    const stop = startIdentityChecks({} as MediaStream, send, vi.fn());

    await vi.advanceTimersByTimeAsync(90_000);
    expect(send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(send).toHaveBeenCalledTimes(2);
    stop();
  });
});
