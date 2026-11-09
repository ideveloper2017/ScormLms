import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock3, Eye, Loader2, Plug, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { integrationApi, type IntegrationEvent, type IntegrationEventStatus } from '@/services/api/integration-api';
import { HemisSyncPanel } from '@/components/admin/hemis-sync-panel';
import { statusLabel } from '@/lib/status-labels';

const statuses: Array<{ value: IntegrationEventStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Barcha holatlar' },
  { value: 'PENDING', label: 'Navbatda' },
  { value: 'PROCESSING', label: 'Bajarilmoqda' },
  { value: 'FAILED', label: 'Qayta urinish kutilmoqda' },
  { value: 'SUCCEEDED', label: 'Muvaffaqiyatli' },
  { value: 'DEAD_LETTER', label: 'Yuborilmadi' },
];

const statusMeta: Record<IntegrationEventStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Navbatda', variant: 'secondary' },
  PROCESSING: { label: 'Bajarilmoqda', variant: 'outline' },
  FAILED: { label: 'Qayta urinish kutilmoqda', variant: 'destructive' },
  SUCCEEDED: { label: 'Muvaffaqiyatli', variant: 'default' },
  DEAD_LETTER: { label: 'Yuborilmadi', variant: 'destructive' },
};

export function AdminIntegrations() {
  const [status, setStatus] = useState<IntegrationEventStatus | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const metrics = useQuery({ queryKey: ['integration-metrics'], queryFn: integrationApi.metrics, refetchInterval: 15_000 });
  const events = useQuery({
    queryKey: ['integration-events', status],
    queryFn: () => integrationApi.events({ status: status === 'ALL' ? undefined : status, limit: 200 }),
    refetchInterval: 15_000,
  });
  const detail = useQuery({
    queryKey: ['integration-event', selectedId],
    queryFn: () => integrationApi.detail(selectedId!),
    enabled: selectedId !== null,
  });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['integration-metrics'] }),
      queryClient.invalidateQueries({ queryKey: ['integration-events'] }),
      queryClient.invalidateQueries({ queryKey: ['integration-event'] }),
    ]);
  };
  const process = useMutation({
    mutationFn: () => integrationApi.processDue(100),
    onSuccess: async result => {
      await refresh();
      toast({ title: `${result.selected} ta xabar ko'rib chiqildi`, description: `${result.succeeded} tasi yuborildi, ${result.retryScheduled} tasi keyinroq qayta uriniladi, ${result.deadLetter} tasi yuborilmadi.` });
    },
    onError: (error: Error) => toast({ title: "Navbatni ishlab bo'lmadi", description: error.message, variant: 'destructive' }),
  });
  const retry = useMutation({
    mutationFn: integrationApi.retry,
    onSuccess: async () => { await refresh(); toast({ title: "Xabar qayta navbatga qo'yildi" }); },
    onError: (error: Error) => toast({ title: "Qayta yuborib bo'lmadi", description: error.message, variant: 'destructive' }),
  });

  const data = metrics.data;
  return (
    <div className="space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tashqi tizimlarga yuborish nazorati</h1>
          <p className="text-muted-foreground">Tashqi tizimlarga yuboriladigan xabarlar shu yerda kuzatiladi. Xato bo'lsa tizim o'zi qayta urinadi; bir necha urinishdan keyin ham ketmagan xabar “Yuborilmadi” holatida qoladi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refresh()}><RefreshCw className="h-4 w-4" />Yangilash</Button>
          {data?.canManage && <Button className="gap-2" disabled={process.isPending} onClick={() => process.mutate()}>
            {process.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Navbatdagi xabarlarni yuborish
          </Button>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Jami" value={data?.total} icon={Plug} />
        <Metric label="Navbatda" value={data?.pending} icon={Clock3} />
        <Metric label="Qayta urinishda" value={data?.failed} icon={RefreshCw} />
        <Metric label="Muvaffaqiyatli" value={data?.succeeded} icon={CheckCircle2} />
        <Metric label="Yuborilmadi" value={data?.deadLetter} icon={AlertCircle} danger />
        <Metric label="Muvaffaqiyat ulushi" value={data ? `${data.successRate.toFixed(1)}%` : undefined} icon={ShieldCheck} />
      </div>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="pt-5 text-sm">
          <strong>Eslatma:</strong> hozircha faqat e'lonlarni elektron pochta va telefonga bildirishnoma orqali yuborish ishlaydi. Vazirlik va ta'lim sifati tizimlari bilan aloqa rasmiy ulanish ma'lumotlari berilgandan keyin yoqiladi.
        </CardContent>
      </Card>

      <HemisSyncPanel />

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Xabarlar</CardTitle><CardDescription>Xabar matni va shaxsiy ma'lumotlar bu yerda ko'rsatilmaydi — faqat xabar turi, holati va yuborish natijasi.</CardDescription></div>
          <Select value={status} onValueChange={value => setStatus(value as IntegrationEventStatus | 'ALL')}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>{statuses.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {(metrics.isLoading || events.isLoading) && <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Yuklanmoqda...</div>}
          {(metrics.error || events.error) && <div className="rounded border border-destructive/30 p-4 text-sm text-destructive">{(metrics.error ?? events.error)?.message}</div>}
          {!events.isLoading && events.data?.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">Tanlangan holatda xabar yo'q.</div>}
          <div className="space-y-2">
            {events.data?.map(event => <EventRow key={event.id} event={event} onOpen={() => setSelectedId(event.id)} onRetry={() => retry.mutate(event.id)} retrying={retry.isPending} />)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedId !== null} onOpenChange={open => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Yuborish urinishlari</DialogTitle><DialogDescription>Xabarning holati va har bir yuborish urinishi.</DialogDescription></DialogHeader>
          {detail.isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>}
          {detail.error && <p className="text-sm text-destructive">{detail.error.message}</p>}
          {detail.data && <>
            <div className="grid gap-2 rounded border p-3 text-sm sm:grid-cols-2">
              <span><strong>Kalit:</strong> {detail.data.event.eventKey}</span>
              <span><strong>Tashqi tizim:</strong> {detail.data.event.connector}</span>
              <span><strong>Obyekt:</strong> {detail.data.event.aggregateType} #{detail.data.event.aggregateId}</span>
              <span><strong>Urinish:</strong> {detail.data.event.attemptCount}/{detail.data.event.maxAttempts}</span>
            </div>
            <ScrollArea className="h-80 rounded border">
              <div className="divide-y">{detail.data.attempts.map(attempt => <div key={attempt.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[80px_150px_1fr]">
                <strong>#{attempt.sequence}</strong><Badge variant={attempt.outcome === 'SUCCESS' ? 'default' : 'destructive'} className="w-fit">{statusLabel(attempt.outcome)}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(attempt.completedAt)} · {attempt.durationMs} ms{attempt.errorMessage && <><br /><span className="text-destructive">{attempt.errorMessage}</span></>}</span>
              </div>)}</div>
            </ScrollArea>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, icon: Icon, danger = false }: { label: string; value?: number | string; icon: React.ElementType; danger?: boolean }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><Icon className={`h-7 w-7 ${danger ? 'text-destructive' : 'text-primary'}`} /><div><div className="text-xl font-bold">{value ?? '—'}</div><div className="text-xs text-muted-foreground">{label}</div></div></CardContent></Card>;
}

function EventRow({ event, onOpen, onRetry, retrying }: { event: IntegrationEvent; onOpen: () => void; onRetry: () => void; retrying: boolean }) {
  const meta = statusMeta[event.status];
  return <div className="grid gap-2 rounded border p-3 text-sm lg:grid-cols-[1.2fr_1fr_120px_120px_auto] lg:items-center">
    <div><strong>{event.connector}</strong><p className="text-xs text-muted-foreground">{event.eventKey}</p></div>
    <div className="text-xs text-muted-foreground">{event.aggregateType} #{event.aggregateId}<br />{formatDate(event.createdAt)}</div>
    <Badge variant={meta.variant} className="w-fit">{meta.label}</Badge>
    <span className="text-xs">Urinish {event.attemptCount}/{event.maxAttempts}{event.lastErrorCode && <><br /><span className="text-destructive">{event.lastErrorCode}</span></>}</span>
    <div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Yuborish urinishlarini ko'rish" onClick={onOpen}><Eye className="h-4 w-4" /></Button>{event.canRetry && <Button size="icon" variant="outline" aria-label="Qayta yuborish" disabled={retrying} onClick={onRetry}><RotateCcw className="h-4 w-4" /></Button>}</div>
  </div>;
}

function formatDate(value?: string | null): string {
  return value ? new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
}
