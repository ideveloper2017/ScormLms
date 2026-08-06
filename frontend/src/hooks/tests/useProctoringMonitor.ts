import { useCallback, useEffect, useRef, useState } from 'react';
import {
  keepaliveProctoringEvents,
  recordProctoringEvents,
  type ProctoringClientEvent,
  type ProctoringEventType,
} from '@/services/proctoring-api';

export type ProctoringCameraStatus = 'disabled' | 'initializing' | 'active' | 'stopped' | 'denied';

interface Options {
  enabled: boolean;
  testId?: string;
  attemptId?: string;
}

const MAX_CLIENT_QUEUE = 5_000;
const MAX_BATCH = 50;

function eventId(): string {
  const webCrypto = globalThis.crypto;
  if (!webCrypto) throw new Error('Secure UUID generator is unavailable');
  if (typeof webCrypto.randomUUID === 'function') return webCrypto.randomUUID();
  const bytes = webCrypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

export function useProctoringMonitor({ enabled, testId, attemptId }: Options) {
  const [cameraStatus, setCameraStatus] = useState<ProctoringCameraStatus>(enabled ? 'initializing' : 'disabled');
  const [queuedEvents, setQueuedEvents] = useState(0);
  const [restartKey, setRestartKey] = useState(0);
  const flushRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    if (!enabled || !testId || !attemptId) {
      setCameraStatus('disabled');
      setQueuedEvents(0);
      return;
    }

    const storageKey = `proctoring-events:${attemptId}`;
    let disposed = false;
    let flushing = false;
    let stream: MediaStream | null = null;
    let queue: ProctoringClientEvent[] = [];
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) queue = (JSON.parse(stored) as ProctoringClientEvent[]).slice(-MAX_CLIENT_QUEUE);
    } catch {
      sessionStorage.removeItem(storageKey);
    }

    const persist = () => {
      try {
        if (queue.length) sessionStorage.setItem(storageKey, JSON.stringify(queue));
        else sessionStorage.removeItem(storageKey);
      } catch {
        // Monitoring continues in memory if browser storage is unavailable/full.
      }
      if (!disposed) setQueuedEvents(queue.length);
    };

    const flush = async () => {
      if (flushing || queue.length === 0 || !navigator.onLine) return;
      flushing = true;
      const batch = queue.slice(0, MAX_BATCH);
      try {
        await recordProctoringEvents(testId, attemptId, batch);
        const delivered = new Set(batch.map((item) => item.clientEventId));
        queue = queue.filter((item) => !delivered.has(item.clientEventId));
        persist();
      } catch {
        // Queue remains in sessionStorage and is retried on the next interval/online event.
      } finally {
        flushing = false;
      }
    };
    flushRef.current = flush;

    const record = (type: ProctoringEventType) => {
      queue.push({ clientEventId: eventId(), type, occurredAt: new Date().toISOString() });
      queue = queue.slice(-MAX_CLIENT_QUEUE);
      persist();
      void flush();
    };

    const onVisibility = () => record(document.hidden ? 'TAB_HIDDEN' : 'TAB_VISIBLE');
    const onBlur = () => record('WINDOW_BLURRED');
    const onFocus = () => record('WINDOW_FOCUSED');
    const onOffline = () => record('NETWORK_OFFLINE');
    const onOnline = () => {
      record('NETWORK_ONLINE');
      void flush();
    };
    const onPageHide = () => {
      record('PAGE_EXIT');
      const pending = queue.slice(0, MAX_BATCH);
      const delivery = keepaliveProctoringEvents(testId, attemptId, pending);
      if (delivery) void delivery.catch(() => undefined);
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    window.addEventListener('pagehide', onPageHide);

    setCameraStatus('initializing');
    const mediaRequest = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      : Promise.reject(new Error('Camera API is unavailable'));
    mediaRequest
      .then((mediaStream) => {
        if (disposed) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = mediaStream;
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (!videoTrack) {
          setCameraStatus('stopped');
          record('CAMERA_STOPPED');
          return;
        }
        videoTrack.addEventListener('ended', () => {
          if (disposed) return;
          setCameraStatus('stopped');
          record('CAMERA_STOPPED');
        }, { once: true });
        setCameraStatus('active');
        record('CAMERA_STARTED');
      })
      .catch(() => {
        if (disposed) return;
        setCameraStatus('denied');
        record('CAMERA_PERMISSION_DENIED');
      });

    const heartbeat = window.setInterval(() => record('HEARTBEAT'), 30_000);
    const retry = window.setInterval(() => void flush(), 5_000);
    persist();
    void flush();

    return () => {
      void flush();
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pagehide', onPageHide);
      window.clearInterval(heartbeat);
      window.clearInterval(retry);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [enabled, testId, attemptId, restartKey]);

  const flush = useCallback(() => flushRef.current(), []);
  const restartCamera = useCallback(() => setRestartKey((value) => value + 1), []);
  return { cameraStatus, queuedEvents, flush, restartCamera };
}
