import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { startTest } from '@/services/test-api';
import {
  issueProctoringChallenge,
  verifyProctoringChallenge,
  type ProctoringChallenge,
} from '@/services/proctoring-api';

type Step = 'camera' | 'center' | 'movement' | 'verifying';

export function ProctoringSession() {
  const params = useParams();
  const testId = params.testId ?? params.id;
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>('camera');
  const [challenge, setChallenge] = useState<ProctoringChallenge | null>(null);
  const [centerFrame, setCenterFrame] = useState<Blob | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false,
    }).then((stream) => {
      if (!active) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    }).catch(() => setError("Kameraga ruxsat berilmadi. Brauzer sozlamasidan kamerani yoqing."));

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capture = async (): Promise<Blob> => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth) {
      throw new Error('Kamera kadri hali tayyor emas');
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Kadrni tayyorlab bo‘lmadi');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) throw new Error('Kadrni JPEG formatiga o‘tkazib bo‘lmadi');
    return blob;
  };

  const begin = async () => {
    if (!testId) return setError('Test identifikatori topilmadi');
    setError(null);
    try {
      setChallenge(await issueProctoringChallenge(testId));
      setCenterFrame(null);
      setStep('center');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Challenge yaratilmadi');
    }
  };

  const saveCenter = async () => {
    setError(null);
    try {
      setCenterFrame(await capture());
      setStep('movement');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Markaziy kadr olinmadi');
    }
  };

  const verifyAndStart = async () => {
    if (!testId || !challenge || !centerFrame) return;
    setStep('verifying');
    setError(null);
    try {
      const movementFrame = await capture();
      await verifyProctoringChallenge(testId, challenge, centerFrame, movementFrame);
      const session = await startTest(testId);
      navigate(`/student/tests/${testId}/session`, { replace: true, state: { session } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Proktoring tekshiruvi bajarilmadi');
      setChallenge(null);
      setCenterFrame(null);
      setStep('camera');
    }
  };

  const directionLabel = challenge?.direction === 'left' ? 'chapga' : 'o‘ngga';

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-600" /> Shaxsni tasdiqlash
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Proktorli test boshlanishidan oldin server yuz mosligini va bir martalik faol harakatni tekshiradi.
        </p>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Kamera tekshiruvi</CardTitle>
              <CardDescription>Xom kadrlar tekshiruv uchun yuboriladi; ushbu oqim ularni fayl sifatida saqlamaydi.</CardDescription>
            </div>
            <Badge variant={cameraReady ? 'secondary' : 'outline'}>
              {cameraReady ? 'Kamera tayyor' : 'Kutilmoqda'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative overflow-hidden rounded-lg bg-black aspect-video">
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-[12%] rounded-[45%] border-2 border-dashed border-white/70" />
          </div>

          <div className="rounded-lg border p-4 text-sm">
            {step === 'camera' && <p>Yuzingiz yorug‘ va aniq ko‘rinsin. Ko‘zoynak yoki yuzni to‘suvchi buyumlarni olib tashlang.</p>}
            {step === 'center' && <p>Yuzingizni oval markaziga joylashtiring va birinchi kadrni oling.</p>}
            {step === 'movement' && (
              <p className="font-medium">Endi boshingizni va yuzingizni kadr ichida <span className="text-blue-600">{directionLabel}</span> siljiting, so‘ng tekshirishni bosing.</p>
            )}
            {step === 'verifying' && <p>Server kadrlar, foydalanuvchi mosligi va so‘ralgan harakatni tekshirmoqda…</p>}
          </div>

          {challenge && (
            <p className="text-xs text-muted-foreground">
              Challenge {challenge.expiresAt.toLocaleTimeString('uz-UZ')} gacha amal qiladi.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {step === 'camera' && (
              <Button onClick={begin} disabled={!cameraReady} className="gap-2">
                <Camera className="h-4 w-4" /> Tekshiruvni boshlash
              </Button>
            )}
            {step === 'center' && (
              <Button onClick={saveCenter} className="gap-2"><Camera className="h-4 w-4" /> Markaziy kadrni olish</Button>
            )}
            {step === 'movement' && (
              <Button onClick={verifyAndStart} className="gap-2"><CheckCircle2 className="h-4 w-4" /> Tekshirish va testni boshlash</Button>
            )}
            {step === 'verifying' && (
              <Button disabled className="gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Tekshirilmoqda</Button>
            )}
            {step !== 'camera' && step !== 'verifying' && (
              <Button variant="outline" onClick={begin} className="gap-2"><RefreshCw className="h-4 w-4" /> Qayta boshlash</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription>
          Bu bosqich faqat test oldi identifikatsiya va faol harakat challenge’idir; u uzluksiz ko‘z, ovoz yoki ekran monitoringi sifatida talqin qilinmaydi.
        </AlertDescription>
      </Alert>
    </div>
  );
}
