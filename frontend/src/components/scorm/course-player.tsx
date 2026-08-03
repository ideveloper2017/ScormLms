import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, BookOpen, Loader2, RefreshCw, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { scormApi, scormContentUrl, type ScormAttempt, type ScormLaunch } from "@/services/api/scorm-api";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Boshlanmagan",
  IN_PROGRESS: "Jarayonda",
  COMPLETED: "Yakunlangan",
  PASSED: "Muvaffaqiyatli",
  FAILED: "O'tmagan",
};

export function CoursePlayer() {
  const { id } = useParams();
  const courseId = Number(id);
  const { toast } = useToast();
  const [launch, setLaunch] = useState<ScormLaunch | null>(null);
  const [attempt, setAttempt] = useState<ScormAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const valuesRef = useRef<Record<string, string>>({});
  const dirtyRef = useRef<Record<string, string>>({});
  const attemptIdRef = useRef<number | null>(null);

  const persist = useCallback(async (finish = false) => {
    const attemptId = attemptIdRef.current;
    if (!attemptId) return;
    const values = { ...dirtyRef.current };
    dirtyRef.current = {};
    try {
      const saved = await scormApi.updateRuntime(attemptId, values, finish);
      setAttempt(saved);
    } catch (cause) {
      dirtyRef.current = { ...values, ...dirtyRef.current };
      if (finish) {
        toast({ variant: "destructive", title: "SCORM natijasini saqlashda xato", description: cause instanceof Error ? cause.message : undefined });
      }
    }
  }, [toast]);

  const initializeRuntime = useCallback((item: ScormLaunch) => {
    valuesRef.current = { ...item.runtimeData };
    dirtyRef.current = {};
    attemptIdRef.current = item.attemptId;
  }, []);

  const load = useCallback(async () => {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      setError("Kurs identifikatori noto'g'ri");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const item = await scormApi.launchCourse(courseId);
      initializeRuntime(item);
      setLaunch(item);
      setAttempt(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "SCORM kursni ochib bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [courseId, initializeRuntime]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!launch) return;
    const contentOrigin = new URL(scormContentUrl(launch.launchUrl)).origin;
    const receive = (event: MessageEvent) => {
      if (event.origin !== contentOrigin || event.data?.source !== "SCORM_LMS_BRIDGE" || event.data?.attemptId !== launch.attemptId) return;
      const values = event.data.values as Record<string, string> | undefined;
      if (values) {
        valuesRef.current = { ...valuesRef.current, ...values };
        dirtyRef.current = { ...dirtyRef.current, ...values };
      }
      if (event.data.type === "COMMIT" || event.data.type === "FINISH") void persist(Boolean(event.data.finish));
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [launch, persist]);
  useEffect(() => {
    const interval = window.setInterval(() => { if (Object.keys(dirtyRef.current).length) void persist(false); }, 10_000);
    const flush = () => { if (Object.keys(dirtyRef.current).length) void persist(false); };
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", flush);
      if (Object.keys(dirtyRef.current).length) void persist(false);
    };
  }, [persist]);

  if (loading) return <div className="p-8 flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> SCORM kurs yuklanmoqda...</div>;

  if (error || !launch) return (
    <div className="p-6"><Card className="max-w-2xl mx-auto border-destructive/40"><CardContent className="py-8 text-center space-y-4">
      <AlertCircle className="h-10 w-10 text-destructive mx-auto" /><p>{error ?? "SCORM paket topilmadi"}</p>
      <Button onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" />Qayta urinish</Button>
    </CardContent></Card></div>
  );

  const runtime = attempt?.runtimeData ?? valuesRef.current;
  const score = attempt?.scoreRaw ?? runtime["cmi.score.raw"] ?? runtime["cmi.core.score.raw"] ?? "—";
  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">{launch.title}</h1><p className="text-sm text-muted-foreground flex items-center gap-1"><BookOpen className="h-4 w-4" /> Kurs #{launch.courseId}</p></div>
        <div className="flex gap-2"><Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />{launch.version === "SCORM_2004" ? "SCORM 2004" : "SCORM 1.2"}</Badge><Badge>{STATUS_LABEL[attempt?.status ?? launch.status]}</Badge></div>
      </div>
      <Card><CardContent className="p-0 overflow-hidden rounded-lg"><iframe title={launch.title} src={scormContentUrl(launch.launchUrl)} className="w-full min-h-[72vh] border-0" allow="fullscreen; autoplay" /></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">O'zlashtirish natijasi</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><p className="text-muted-foreground">Holat</p><p className="font-medium">{STATUS_LABEL[attempt?.status ?? launch.status]}</p></div>
        <div><p className="text-muted-foreground">Ball</p><p className="font-medium">{String(score)}</p></div>
        <div><p className="text-muted-foreground">Jarayon</p><p className="font-medium">{attempt?.progressMeasure != null ? `${Math.round(attempt.progressMeasure * 100)}%` : "—"}</p></div>
        <div><p className="text-muted-foreground">Sarflangan vaqt</p><p className="font-medium">{attempt ? `${Math.floor(attempt.totalTimeSeconds / 60)} daqiqa` : "—"}</p></div>
      </CardContent></Card>
    </div>
  );
}
