import type { ProctoringEventType } from '@/services/proctoring-api';

export type VisualSignal = 'FACE_NOT_VISIBLE' | 'MULTIPLE_FACES' | 'HEAD_TURNED';

export function classifyVisualSignal(faceCount: number, noseOffset = 0): VisualSignal | null {
  if (faceCount === 0) return 'FACE_NOT_VISIBLE';
  if (faceCount > 1) return 'MULTIPLE_FACES';
  return Math.abs(noseOffset) > 0.38 ? 'HEAD_TURNED' : null;
}

/** Require continuous observations and limit repeated reports. Never grades an attempt. */
export class SustainedSignal {
  private pending: string | null = null;
  private since = 0;
  private lastEmitted = new Map<string, number>();
  constructor(private durationMs: number, private cooldownMs = 30_000) {}
  observe(signal: string | null, now: number): boolean {
    if (signal !== this.pending) { this.pending = signal; this.since = now; }
    if (!signal || now - this.since < this.durationMs) return false;
    const last = this.lastEmitted.get(signal);
    if (last !== undefined && now - last < this.cooldownMs) return false;
    this.lastEmitted.set(signal, now);
    return true;
  }
}

export function audioRms(samples: Uint8Array): number {
  if (!samples.length) return 0;
  return Math.sqrt(samples.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) / samples.length);
}

export type SensorStatus = 'disabled' | 'initializing' | 'active' | 'unavailable';
type StatusCallback = (sensor: 'audio' | 'visual', status: SensorStatus) => void;

let models: Promise<typeof import('face-api.js')> | undefined;
function loadModels() {
  models ??= import('face-api.js').then(async faceapi => {
    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri('/models'), faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models')]);
    return faceapi;
  }).catch(error => { models = undefined; throw error; });
  return models;
}

/** All frame/audio analysis remains in the browser. Only event types are sent to LMS. */
export function startLocalMonitoring(camera: MediaStream, record: (event: ProctoringEventType) => void, status: StatusCallback): () => void {
  let disposed = false;
  let audioStream: MediaStream | undefined;
  let context: AudioContext | undefined;
  let source: MediaStreamAudioSourceNode | undefined;
  let analyser: AnalyserNode | undefined;
  let audioTimer: number | undefined;
  let visualTimer: number | undefined;
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = camera;
  const report = (event: ProctoringEventType) => { if (!disposed) record(event); };
  const update = (sensor: 'audio' | 'visual', state: SensorStatus) => { if (!disposed) status(sensor, state); };
  const stopAudio = () => {
    window.clearInterval(audioTimer);
    source?.disconnect();
    analyser?.disconnect();
    audioStream?.getTracks().forEach(track => track.stop());
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  };
  update('audio', 'initializing');
  update('visual', 'initializing');

  void (async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (disposed) { stream.getTracks().forEach(track => track.stop()); return; }
      audioStream = stream;
      const track = stream.getAudioTracks()[0];
      if (!track) throw new Error('Microphone track unavailable');
      track.addEventListener('ended', () => { update('audio', 'unavailable'); report('MICROPHONE_STOPPED'); stopAudio(); }, { once: true });
      context = new AudioContext();
      await context.resume();
      if (disposed) { stopAudio(); return; }
      if (context.state !== 'running') throw new Error('Audio context is suspended');
      source = context.createMediaStreamSource(stream);
      analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const gate = new SustainedSignal(2_000);
      let calibrationSum = 0;
      let calibrationCount = 0;
      report('MICROPHONE_STARTED');
      audioTimer = window.setInterval(() => {
        if (disposed || !analyser) return;
        if (context?.state !== 'running' || track.muted || track.readyState !== 'live') {
          update('audio', 'unavailable'); report('MICROPHONE_STOPPED'); stopAudio(); return;
        }
        analyser.getByteTimeDomainData(samples);
        const rms = audioRms(samples);
        if (calibrationCount < 40) { calibrationSum += rms; calibrationCount++; if (calibrationCount === 40) update('audio', 'active'); return; }
        const threshold = Math.max(0.04, calibrationSum / calibrationCount * 3);
        if (gate.observe(rms > threshold ? 'AUDIO_ACTIVITY' : null, Date.now())) report('AUDIO_ACTIVITY');
      }, 250);
    } catch (error) {
      update('audio', 'unavailable');
      report(error instanceof DOMException && error.name === 'NotAllowedError' ? 'MICROPHONE_PERMISSION_DENIED' : 'MICROPHONE_STOPPED');
      stopAudio();
    }
  })();

  void (async () => {
    try {
      const [faceapi] = await Promise.all([loadModels(), video.play()]);
      if (disposed) return;
      const gate = new SustainedSignal(3_000);
      const tick = async () => {
        if (disposed) return;
        try {
          if (camera.getVideoTracks()[0]?.readyState !== 'live') throw new Error('Camera stopped');
          if (video.readyState >= 2 && video.videoWidth > 0) {
            const faces = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })).withFaceLandmarks(true);
            if (disposed) return;
            let offset = 0;
            if (faces.length === 1) {
              const landmarks = faces[0].landmarks;
              const left = landmarks.getLeftEye();
              const right = landmarks.getRightEye();
              const leftX = left.reduce((sum, point) => sum + point.x, 0) / left.length;
              const rightX = right.reduce((sum, point) => sum + point.x, 0) / right.length;
              offset = (landmarks.getNose()[3].x - (leftX + rightX) / 2) / Math.max(1, Math.abs(rightX - leftX));
            }
            update('visual', 'active');
            const signal = classifyVisualSignal(faces.length, offset);
            if (gate.observe(signal, Date.now()) && signal) report(signal);
          }
          visualTimer = window.setTimeout(() => void tick(), 1_000);
        } catch { update('visual', 'unavailable'); report('VISUAL_ANALYSIS_UNAVAILABLE'); }
      };
      void tick();
    } catch { update('visual', 'unavailable'); report('VISUAL_ANALYSIS_UNAVAILABLE'); }
  })();

  return () => {
    disposed = true;
    window.clearTimeout(visualTimer);
    stopAudio();
    video.pause();
    video.srcObject = null;
  };
}
