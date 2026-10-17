import type { IdentityCheckResult } from '@/services/proctoring-api';

/** Birinchi tekshiruv kamera yoqilgach shu oraliqda (ms), keyingilari server aytgan vaqtda. */
const FIRST_CHECK_MIN_MS = 60_000;
const FIRST_CHECK_MAX_MS = 90_000;
/** Server javob bermasa (tarmoq) — qayta urinish oralig'i. */
const RETRY_MS = 60_000;

function randomBetween(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Joriy kamera kadrini JPEG sifatida oladi (kadr faqat serverga yuboriladi, brauzerda saqlanmaydi). */
export async function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')?.drawImage(video, 0, 0);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85));
}

/**
 * Imtihon davomida davriy shaxs tekshiruvi: tasodifiy vaqtlarda kadr serverga yuboriladi, server uni ro'yxatdagi
 * yuz bilan solishtirib proktoring jurnaliga yozadi. Talabaga faqat yuz ko'rinmaganda maslahat ko'rsatiladi.
 * Qaytarilgan funksiya tekshiruvlarni to'xtatadi.
 */
export function startIdentityChecks(
  camera: MediaStream,
  send: (frame: Blob) => Promise<IdentityCheckResult>,
  onHint: (hint: string | null) => void,
): () => void {
  let stopped = false;
  let timer: number | undefined;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = camera;
  // play() ba'zi muhitlarda promise qaytarmaydi yoki otadi — tekshiruv kamera holatini buzmasligi kerak.
  try {
    const playing = video.play() as Promise<void> | undefined;
    if (playing && typeof playing.catch === 'function') void playing.catch(() => undefined);
  } catch {
    // Kadr olinmasa run() qayta urinadi.
  }

  const schedule = (ms: number) => {
    if (!stopped) timer = window.setTimeout(run, ms);
  };

  const run = async () => {
    if (stopped) return;
    try {
      const frame = await captureFrame(video);
      if (!frame) return schedule(RETRY_MS);
      const result = await send(frame);
      if (stopped) return;
      onHint(result.hint ?? null);
      schedule(Math.max(60, result.nextCheckInSeconds) * 1000);
    } catch {
      // Tarmoq yoki server xatosi — tekshiruv keyinroq qayta uriniladi; test davom etadi.
      schedule(RETRY_MS);
    }
  };

  schedule(randomBetween(FIRST_CHECK_MIN_MS, FIRST_CHECK_MAX_MS));

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    video.srcObject = null;
  };
}
