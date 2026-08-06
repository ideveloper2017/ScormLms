import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock, Eye, MessageSquare, RefreshCw, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { qk } from '@/lib/query-keys';
import { proctorApi, type ProctorEvidenceEvent, type ProctoringAppeal } from '@/services/api/proctor-api';

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-800',
  info: 'bg-slate-100 text-slate-700',
};

const TYPE_LABEL: Record<string, string> = {
  session_started: 'Sessiya boshlandi',
  session_ended: 'Sessiya yakunlandi',
  camera_started: 'Kamera ishga tushdi',
  camera_stopped: 'Kamera to‘xtadi',
  camera_permission_denied: 'Kamera ruxsati rad etildi',
  tab_hidden: 'Test tabi yashirildi',
  tab_visible: 'Test tabiga qaytildi',
  window_blurred: 'Oyna fokusni yo‘qotdi',
  window_focused: 'Oynaga fokus qaytdi',
  network_offline: 'Tarmoq uzildi',
  network_online: 'Tarmoq qaytdi',
  heartbeat: 'Monitoring heartbeat',
  page_exit: 'Sahifadan chiqish',
};

function dateTime(value?: string) {
  return value ? new Date(value).toLocaleString('uz-Latn') : '—';
}

function StatCard({ label, value, icon: Icon, className = '' }: {
  label: string;
  value: number;
  icon: React.ElementType;
  className?: string;
}) {
  return <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${className}`}>{value}</div></CardContent></Card>;
}

function TimelineEvent({ event }: { event: ProctorEvidenceEvent }) {
  return <div className="flex items-start justify-between gap-3 rounded-md border p-3">
    <div><p className="text-sm font-medium">{TYPE_LABEL[event.type] ?? event.type}</p><p className="text-xs text-muted-foreground">{dateTime(event.occurredAt)} · {event.source === 'server' ? 'Server' : 'Klient'}</p></div>
    <Badge className={SEVERITY_STYLE[event.severity]}>{event.severity.toUpperCase()}</Badge>
  </div>;
}

export function ProctorDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);
  const [reviewAppeal, setReviewAppeal] = useState<ProctoringAppeal | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'PARTIAL' | 'REJECTED'>('APPROVED');
  const [decision, setDecision] = useState('');
  const stats = useQuery({ queryKey: qk.proctor.stats(), queryFn: proctorApi.getStats, refetchInterval: 30_000 });
  const sessions = useQuery({ queryKey: qk.proctor.sessions(), queryFn: proctorApi.getSessions, refetchInterval: 15_000 });
  const violations = useQuery({ queryKey: qk.proctor.violations(), queryFn: proctorApi.getViolations, refetchInterval: 15_000 });
  const appeals = useQuery({ queryKey: qk.proctor.appeals(), queryFn: proctorApi.getAppeals, refetchInterval: 30_000 });
  const evidence = useQuery({
    queryKey: qk.proctor.evidence(selectedAttempt ?? ''),
    queryFn: () => proctorApi.getEvidence(selectedAttempt!),
    enabled: !!selectedAttempt,
  });

  const review = useMutation({
    mutationFn: () => proctorApi.reviewAppeal(reviewAppeal!.id, reviewStatus, decision.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.proctor.appeals() });
      setReviewAppeal(null);
      setDecision('');
      toast({ title: 'Apellyatsiya qarori saqlandi' });
    },
    onError: (reviewError: Error) => toast({ variant: 'destructive', title: 'Qaror saqlanmadi', description: reviewError.message }),
  });
  const refresh = async () => Promise.all([stats.refetch(), sessions.refetch(), violations.refetch(), appeals.refetch()]);
  const loading = stats.isLoading || sessions.isLoading || violations.isLoading || appeals.isLoading;
  const error = stats.error || sessions.error || violations.error || appeals.error;

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-9 w-64" /><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map((id) => <Skeleton key={id} className="h-28" />)}</div><Skeleton className="h-64" /></div>;

  return <div className="p-3 sm:p-4 md:p-6 space-y-6">
    <div className="flex items-center justify-between gap-3">
      <div><h1 className="text-2xl md:text-3xl font-bold">Proktor monitoringi</h1><p className="text-muted-foreground">Faqat sizga biriktirilgan proktorli test sessiyalari va server dalillari</p></div>
      <Button variant="outline" size="sm" onClick={() => void refresh()}><RefreshCw className="h-4 w-4 mr-2" />Yangilash</Button>
    </div>

    {error && <Card className="border-destructive"><CardContent className="py-6 text-center text-destructive">Ma’lumot yuklanmadi: {(error as Error).message}</CardContent></Card>}

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Faol testlar" value={stats.data?.activeExams ?? 0} icon={Shield} className="text-blue-600" />
      <StatCard label="Kuzatilgan talabalar" value={stats.data?.totalStudents ?? 0} icon={Users} />
      <StatCard label="Risk hodisalari" value={stats.data?.violations ?? 0} icon={AlertTriangle} className="text-red-600" />
      <StatCard label="Bugun yakunlangan" value={stats.data?.completedToday ?? 0} icon={CheckCircle} className="text-green-600" />
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Sessiyalar</CardTitle><CardDescription>Oxirgi 100 ta vakolatli attempt; dalil oynasi 200 ta so‘nggi eventni ko‘rsatadi.</CardDescription></CardHeader>
        <CardContent className="space-y-3 max-h-[560px] overflow-y-auto">
          {(sessions.data ?? []).length === 0 && <p className="py-8 text-center text-muted-foreground">Biriktirilgan sessiya mavjud emas</p>}
          {(sessions.data ?? []).map((session) => <div key={session.attemptId} className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between gap-3"><div><p className="font-medium">{session.studentName}</p><p className="text-xs text-muted-foreground">{session.examTitle} · {session.course}</p></div><Badge className={session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}>{session.status === 'active' ? 'Faol' : session.status === 'timed_out' ? 'Vaqti tugagan' : 'Yakunlangan'}</Badge></div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Boshlandi: {dateTime(session.startedAt)}</span><span>Heartbeat: {dateTime(session.lastHeartbeatAt)}</span></div>
            <div className="flex justify-between items-center"><Badge className={session.riskEvents ? SEVERITY_STYLE.high : SEVERITY_STYLE.info}>{session.riskEvents} risk hodisasi</Badge><Button size="sm" variant="outline" onClick={() => setSelectedAttempt(session.attemptId)}>Dalillar</Button></div>
          </div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" />So‘nggi risk hodisalari</CardTitle><CardDescription>INFO eventlari bu ro‘yxatga kiritilmaydi.</CardDescription></CardHeader>
        <CardContent className="space-y-3 max-h-[560px] overflow-y-auto">
          {(violations.data ?? []).length === 0 && <p className="py-8 text-center text-muted-foreground">Risk hodisasi qayd etilmagan</p>}
          {(violations.data ?? []).map((item) => <button key={item.id} className="w-full text-left rounded-lg border p-3 hover:bg-muted/50" onClick={() => setSelectedAttempt(item.attemptId)}><div className="flex justify-between gap-3"><div><p className="font-medium text-sm">{item.studentName}</p><p className="text-xs text-muted-foreground">{item.examTitle} · {TYPE_LABEL[item.type] ?? item.type}</p></div><Badge className={SEVERITY_STYLE[item.severity]}>{item.severity.toUpperCase()}</Badge></div><p className="text-xs text-muted-foreground mt-2"><Clock className="inline h-3 w-3 mr-1" />{dateTime(item.timestamp)}</p></button>)}
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Proktoring apellyatsiyalari</CardTitle><CardDescription>Faqat vakolatingizdagi testlar. Review asl event, biometrik iz yoki test ballini o'zgartirmaydi.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {(appeals.data ?? []).length === 0 && <p className="py-6 text-center text-muted-foreground">Apellyatsiya mavjud emas</p>}
        {(appeals.data ?? []).map(appeal => <div key={appeal.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{appeal.studentName}</p><p className="text-xs text-muted-foreground">{appeal.examTitle} · {appeal.course} · {new Date(appeal.requestedAt).toLocaleString('uz-Latn')}</p></div><Badge className={appeal.status === 'approved' ? 'bg-green-100 text-green-800' : appeal.status === 'rejected' ? 'bg-red-100 text-red-800' : appeal.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>{appeal.status.toUpperCase()}</Badge></div>
          <p className="text-sm">{appeal.reason}</p>
          <p className="text-xs text-muted-foreground">{appeal.disputedEvents.length} ta risk hodisasi qayta ko'rish uchun tanlangan</p>
          {appeal.decision && <div className="rounded bg-muted p-3 text-sm"><span className="font-medium">Qaror:</span> {appeal.decision}<span className="block text-xs text-muted-foreground mt-1">{appeal.reviewedBy} · {appeal.reviewedAt ? new Date(appeal.reviewedAt).toLocaleString('uz-Latn') : ''}</span></div>}
          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedAttempt(appeal.attemptId)}>Dalillarni ochish</Button>{appeal.status === 'pending' && <Button size="sm" onClick={() => { setReviewAppeal(appeal); setReviewStatus('APPROVED'); setDecision(''); }}>Qo'lda ko'rib chiqish</Button>}</div>
        </div>)}
      </CardContent>
    </Card>

    <Dialog open={!!selectedAttempt} onOpenChange={(open) => { if (!open) setSelectedAttempt(null); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Proktoring dalillari</DialogTitle><DialogDescription>Identity preflight va vaqt tartibidagi server/klient hodisalari. Event mavjudligi avtomatik aybdorlik qarori emas.</DialogDescription></DialogHeader>
        {evidence.isLoading && <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-48" /></div>}
        {evidence.error && <p className="text-destructive">Dalil yuklanmadi: {(evidence.error as Error).message}</p>}
        {evidence.data && <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
            <div><span className="text-muted-foreground">Talaba</span><p className="font-medium">{evidence.data.studentName}</p></div>
            <div><span className="text-muted-foreground">Test</span><p className="font-medium">{evidence.data.examTitle}</p></div>
            <div><span className="text-muted-foreground">Identity mosligi</span><p className="font-medium">{evidence.data.identitySimilarity == null ? '—' : `${(evidence.data.identitySimilarity * 100).toFixed(1)}%`}</p></div>
            <div><span className="text-muted-foreground">Faol harakat</span><p className="font-medium">{evidence.data.challengeDirection === 'left' ? 'Chapga' : 'O‘ngga'} · Δ {evidence.data.movementDelta?.toFixed(3) ?? '—'}</p></div>
            <div><span className="text-muted-foreground">Boshlanish</span><p>{dateTime(evidence.data.startedAt)}</p></div>
            <div><span className="text-muted-foreground">Yakunlanish</span><p>{dateTime(evidence.data.submittedAt)}</p></div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono break-all"><p>center SHA-256: {evidence.data.centerFrameHash ?? '—'}</p><p>movement SHA-256: {evidence.data.challengeFrameHash ?? '—'}</p></div>
          <div className="space-y-2"><h3 className="font-semibold">Event timeline ({evidence.data.events.length})</h3>{evidence.data.events.map((event) => <TimelineEvent key={event.id} event={event} />)}</div>
        </div>}
      </DialogContent>
    </Dialog>

    <Dialog open={!!reviewAppeal} onOpenChange={(open) => { if (!open) setReviewAppeal(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Apellyatsiyani qo'lda ko'rib chiqish</DialogTitle><DialogDescription>{reviewAppeal?.studentName} · {reviewAppeal?.examTitle}. Event mavjudligi avtomatik aybdorlik emas; qaror dalil va talaba izohiga asoslanadi.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="rounded border p-3 text-sm">{reviewAppeal?.reason}</div>
          <div className="grid grid-cols-3 gap-2">{(['APPROVED', 'PARTIAL', 'REJECTED'] as const).map(status => <Button key={status} type="button" variant={reviewStatus === status ? 'default' : 'outline'} onClick={() => setReviewStatus(status)}>{status === 'APPROVED' ? 'Qabul qilish' : status === 'PARTIAL' ? 'Qisman' : 'Rad etish'}</Button>)}</div>
          <Textarea value={decision} onChange={event => setDecision(event.target.value)} maxLength={2000} placeholder="Yakuniy asoslangan qarorni 10-2000 belgi bilan yozing" />
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReviewAppeal(null)}>Bekor qilish</Button><Button onClick={() => review.mutate()} disabled={decision.trim().length < 10 || review.isPending}>{review.isPending ? 'Saqlanmoqda...' : 'Yakuniy qarorni saqlash'}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
