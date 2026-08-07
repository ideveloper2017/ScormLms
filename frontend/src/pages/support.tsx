import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock3, LifeBuoy, Loader2, MessageSquare, Plus, RefreshCw, Send, ShieldAlert, UserRoundCheck, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supportApi, type CreateSupportTicket, type SupportStatus, type SupportTicket } from '@/services/api/support-api';

const statusLabel: Record<SupportStatus, string> = {
  OPEN: 'Ochiq', IN_PROGRESS: 'Jarayonda', WAITING_REQUESTER: 'Javob kutilmoqda', RESOLVED: 'Yechilgan', CLOSED: 'Yopilgan', CANCELLED: 'Bekor qilingan',
};
const priorityClass: Record<SupportTicket['priority'], string> = {
  LOW: 'bg-slate-100 text-slate-700', NORMAL: 'bg-blue-100 text-blue-700', HIGH: 'bg-amber-100 text-amber-800', URGENT: 'bg-red-100 text-red-800',
};
const initialForm: CreateSupportTicket = { subject: '', description: '', category: 'TECHNICAL', impact: 'LIMITED', courseId: null };

export function SupportPage() {
  const { user } = useAuth();
  const role = (user?.role?.name ?? user?.roles?.[0]?.name ?? '').replace(/^ROLE_/i, '').toUpperCase();
  const manager = ['SUPER_ADMIN', 'ADMIN', 'METODIST'].includes(role);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const value = Number(new URLSearchParams(window.location.search).get('ticket'));
    return Number.isFinite(value) && value > 0 ? value : null;
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateSupportTicket>(initialForm);
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(false);
  const [queueStatus, setQueueStatus] = useState('ALL');
  const [breachedOnly, setBreachedOnly] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [targetStatus, setTargetStatus] = useState('');
  const [resolution, setResolution] = useState('');

  const listKey = ['support', manager ? 'queue' : 'mine', queueStatus, breachedOnly];
  const listQuery = useQuery({
    queryKey: listKey,
    queryFn: () => manager ? supportApi.queue({ status: queueStatus === 'ALL' ? undefined : queueStatus, breachedOnly }) : supportApi.mine(),
  });
  const detailQuery = useQuery({ queryKey: ['support', 'detail', selectedId], queryFn: () => supportApi.detail(selectedId!), enabled: selectedId !== null });
  const metricsQuery = useQuery({ queryKey: ['support', 'metrics'], queryFn: supportApi.metrics, enabled: manager });
  const assigneesQuery = useQuery({ queryKey: ['support', 'assignees'], queryFn: supportApi.assignees, enabled: manager });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['support'] });
  };
  const fail = (title: string) => (error: Error) => toast({ variant: 'destructive', title, description: error.message });
  const createMutation = useMutation({
    mutationFn: () => supportApi.create({ ...form, courseId: form.courseId || null }),
    onSuccess: async detail => { setCreateOpen(false); setForm(initialForm); setSelectedId(detail.ticket.id); await refresh(); toast({ title: `Murojaat yaratildi: ${detail.ticket.ticketCode}` }); },
    onError: fail('Murojaat yaratilmadi'),
  });
  const commentMutation = useMutation({
    mutationFn: () => supportApi.comment(selectedId!, comment.trim(), manager && internal),
    onSuccess: async () => { setComment(''); setInternal(false); await refresh(); },
    onError: fail('Izoh yuborilmadi'),
  });
  const assignMutation = useMutation({
    mutationFn: () => supportApi.assign(selectedId!, Number(assigneeId)),
    onSuccess: async () => { await refresh(); toast({ title: "Mas'ul biriktirildi" }); },
    onError: fail("Mas'ul biriktirilmadi"),
  });
  const statusMutation = useMutation({
    mutationFn: () => supportApi.changeStatus(selectedId!, targetStatus as SupportStatus, resolution.trim() || undefined),
    onSuccess: async () => { setTargetStatus(''); setResolution(''); await refresh(); toast({ title: 'Holat yangilandi' }); },
    onError: fail('Holat yangilanmadi'),
  });
  const cancelMutation = useMutation({ mutationFn: () => supportApi.cancel(selectedId!), onSuccess: refresh, onError: fail('Murojaat bekor qilinmadi') });
  const reopenMutation = useMutation({ mutationFn: () => supportApi.reopen(selectedId!), onSuccess: refresh, onError: fail('Murojaat qayta ochilmadi') });

  const detail = detailQuery.data;
  const items = listQuery.data ?? [];
  const createValid = form.subject.trim().length >= 5 && form.description.trim().length >= 10;
  const statusNeedsResolution = targetStatus === 'RESOLVED';
  const statusValid = Boolean(targetStatus) && (!statusNeedsResolution || resolution.trim().length >= 5);
  const selectedAssignee = assigneeId || (detail?.ticket.assigneeId ? String(detail.ticket.assigneeId) : '');
  const sortedEvents = useMemo(() => detail?.events ?? [], [detail?.events]);

  return (
    <div className="space-y-5 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><LifeBuoy className="h-6 w-6" />Texnik yordam</h1><p className="text-sm text-muted-foreground">Murojaat, mas'ul, javob va yechim SLA nazorati</p></div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Yangi murojaat</Button>
      </div>

      {manager && metricsQuery.data && <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6"><Metric label="Faol" value={metricsQuery.data.totalActive} /><Metric label="Mas'ulsiz" value={metricsQuery.data.unassigned} /><Metric label="Javob SLA buzilgan" value={metricsQuery.data.responseBreached} danger={metricsQuery.data.responseBreached > 0} /><Metric label="Yechim SLA buzilgan" value={metricsQuery.data.resolutionBreached} danger={metricsQuery.data.resolutionBreached > 0} /><Metric label="4 soatda due" value={metricsQuery.data.dueWithinFourHours} /><Metric label="Yechilgan" value={metricsQuery.data.resolved} /></div>}

      <div className="grid min-h-[650px] gap-4 lg:grid-cols-[370px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3"><CardTitle className="text-base">{manager ? 'Support navbati' : 'Mening murojaatlarim'}</CardTitle>{manager && <div className="flex gap-2"><Select value={queueStatus} onValueChange={setQueueStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Barcha holatlar</SelectItem>{Object.entries(statusLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Button size="sm" variant={breachedOnly ? 'destructive' : 'outline'} onClick={() => setBreachedOnly(value => !value)}><ShieldAlert className="mr-1 h-4 w-4" />SLA</Button></div>}</CardHeader>
          <CardContent className="p-0"><ScrollArea className="h-[570px]">{listQuery.isLoading && <Loading text="Murojaatlar yuklanmoqda..." />}{listQuery.error && <ErrorText text={listQuery.error.message} />}{!listQuery.isLoading && items.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Murojaat topilmadi.</p>}<div className="divide-y">{items.map(ticket => <button key={ticket.id} type="button" className={cn('w-full p-4 text-left hover:bg-muted/40', selectedId === ticket.id && 'bg-muted')} onClick={() => { setSelectedId(ticket.id); setAssigneeId(ticket.assigneeId ? String(ticket.assigneeId) : ''); }}><div className="flex items-start justify-between gap-2"><strong className="line-clamp-2 text-sm">{ticket.subject}</strong><Badge variant="outline" className="shrink-0 text-[10px]">{statusLabel[ticket.status]}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{ticket.ticketCode} · {manager ? ticket.requesterName : ticket.assigneeName ?? "Mas'ul kutilmoqda"}</p><div className="mt-2 flex items-center gap-2"><Badge className={priorityClass[ticket.priority]}>{ticket.priority}</Badge><SlaBadge ticket={ticket} /></div></button>)}</div></ScrollArea></CardContent>
        </Card>

        <Card className="overflow-hidden">
          {!selectedId ? <div className="flex h-[650px] items-center justify-center text-center text-muted-foreground"><div><LifeBuoy className="mx-auto mb-3 h-12 w-12" /><p>Murojaatni tanlang yoki yangisini yarating.</p></div></div> : detailQuery.isLoading ? <Loading text="Murojaat ochilmoqda..." /> : detailQuery.error ? <ErrorText text={detailQuery.error.message} /> : detail && <div className="flex h-[650px] flex-col"><CardHeader className="border-b pb-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-lg">{detail.ticket.subject}</CardTitle><Badge>{detail.ticket.ticketCode}</Badge><Badge variant="outline">{statusLabel[detail.ticket.status]}</Badge></div><CardDescription>{detail.ticket.requesterName} · {detail.ticket.courseTitle ?? 'Umumiy murojaat'} · {formatDate(detail.ticket.createdAt)}</CardDescription></div><Badge className={priorityClass[detail.ticket.priority]}>{detail.ticket.priority}</Badge></div><div className="mt-2 grid gap-2 text-xs sm:grid-cols-2"><div className={cn('rounded border p-2', detail.ticket.sla.responseBreached && 'border-red-400 bg-red-50 text-red-800')}><Clock3 className="mr-1 inline h-3.5 w-3.5" />Javob: {formatDate(detail.ticket.sla.responseDueAt)} {detail.ticket.sla.firstRespondedAt && '✓'}</div><div className={cn('rounded border p-2', detail.ticket.sla.resolutionBreached && 'border-red-400 bg-red-50 text-red-800')}><Clock3 className="mr-1 inline h-3.5 w-3.5" />Yechim: {formatDate(detail.ticket.sla.resolutionDueAt)} {detail.ticket.sla.paused && '· pauza'}</div></div></CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col p-0"><ScrollArea className="flex-1 px-4 py-3"><div className="rounded border bg-muted/30 p-3"><strong className="text-sm">Murojaat tavsifi</strong><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{detail.description}</p></div>{detail.resolutionSummary && <div className="mt-3 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900"><CheckCircle2 className="mr-1 inline h-4 w-4" /><strong>Yechim:</strong> {detail.resolutionSummary}</div>}<div className="mt-4 space-y-3">{sortedEvents.map(event => <div key={event.id} className={cn('rounded border p-3', event.visibility === 'INTERNAL' && 'border-amber-300 bg-amber-50/60')}><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium">#{event.sequenceNo} · {event.actorName} · {event.eventType}</span><span className="text-xs text-muted-foreground">{formatDate(event.occurredAt)}</span></div>{event.visibility === 'INTERNAL' && <Badge variant="outline" className="mt-1 text-[10px]">ICHKI</Badge>}{event.body && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{event.body}</p>}{event.fromStatus && <p className="mt-1 text-xs">{event.fromStatus} → {event.toStatus}</p>}</div>)}</div></ScrollArea>
              <div className="space-y-3 border-t p-3">{manager && <div className="grid gap-2 sm:grid-cols-2"><div className="flex gap-2"><Select value={selectedAssignee} onValueChange={setAssigneeId}><SelectTrigger><SelectValue placeholder="Mas'ulni tanlang" /></SelectTrigger><SelectContent>{assigneesQuery.data?.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.fullName} · {item.roleName}</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={!assigneeId || assignMutation.isPending} onClick={() => assignMutation.mutate()}><UserRoundCheck className="h-4 w-4" /></Button></div>{detail.canManage && detail.allowedStatuses.length > 0 && <div className="flex gap-2"><Select value={targetStatus} onValueChange={value => setTargetStatus(value as SupportStatus)}><SelectTrigger><SelectValue placeholder="Yangi holat" /></SelectTrigger><SelectContent>{detail.allowedStatuses.map(value => <SelectItem key={value} value={value}>{statusLabel[value]}</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={!statusValid || statusMutation.isPending} onClick={() => statusMutation.mutate()}><RefreshCw className="h-4 w-4" /></Button></div>}</div>}{statusNeedsResolution && <Textarea rows={2} value={resolution} onChange={event => setResolution(event.target.value)} placeholder="Yechim tavsifi (majburiy)" />}{detail.canComment && <div className="space-y-2"><div className="flex gap-2"><Textarea rows={2} value={comment} onChange={event => setComment(event.target.value)} placeholder="Izoh yoki javob yozing..." /><Button size="icon" className="h-auto" disabled={comment.trim().length < 2 || commentMutation.isPending} onClick={() => commentMutation.mutate()}><Send className="h-4 w-4" /></Button></div>{manager && <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={internal} onChange={event => setInternal(event.target.checked)} />Faqat support xodimlariga ko'rinadigan ichki izoh</label>}</div>}<div className="flex gap-2">{detail.canCancel && <Button variant="destructive" size="sm" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}><XCircle className="mr-1 h-4 w-4" />Bekor qilish</Button>}{detail.canReopen && <Button variant="outline" size="sm" disabled={reopenMutation.isPending} onClick={() => reopenMutation.mutate()}><RefreshCw className="mr-1 h-4 w-4" />Qayta ochish</Button>}</div></div>
            </CardContent></div>}
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Yangi support murojaati</DialogTitle><DialogDescription>Ta'sir darajasidan priority va SLA server tomonidan avtomatik belgilanadi.</DialogDescription></DialogHeader><div className="space-y-3"><div className="space-y-1"><Label>Mavzu</Label><Input maxLength={250} value={form.subject} onChange={event => setForm(current => ({ ...current, subject: event.target.value }))} /></div><div className="space-y-1"><Label>Batafsil tavsif</Label><Textarea rows={5} maxLength={10000} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label>Kategoriya</Label><Select value={form.category} onValueChange={value => setForm(current => ({ ...current, category: value as CreateSupportTicket['category'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TECHNICAL">Texnik</SelectItem><SelectItem value="ACCESS">Kirish/akkaunt</SelectItem><SelectItem value="CONTENT">Kontent</SelectItem><SelectItem value="ASSESSMENT">Baholash</SelectItem><SelectItem value="OTHER">Boshqa</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Ta'sir</Label><Select value={form.impact} onValueChange={value => setForm(current => ({ ...current, impact: value as CreateSupportTicket['impact'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LIMITED">Faqat menga</SelectItem><SelectItem value="MULTIPLE_USERS">Bir nechta userga</SelectItem><SelectItem value="SERVICE_BLOCKED">Xizmat bloklangan</SelectItem><SelectItem value="SECURITY">Xavfsizlik hodisasi</SelectItem></SelectContent></Select></div></div><div className="space-y-1"><Label>Kurs ID (ixtiyoriy)</Label><Input type="number" min={1} value={form.courseId ?? ''} onChange={event => setForm(current => ({ ...current, courseId: event.target.value ? Number(event.target.value) : null }))} /><p className="text-xs text-muted-foreground">Faqat o'zingiz o'qiyotgan yoki boshqarayotgan kursni kiriting.</p></div><Button className="w-full" disabled={!createValid || createMutation.isPending} onClick={() => createMutation.mutate()}>{createMutation.isPending ? 'Yuborilmoqda...' : 'Murojaatni yuborish'}</Button></div></DialogContent></Dialog>
    </div>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) { return <Card className={danger ? 'border-red-400' : ''}><CardHeader className="pb-1"><CardDescription>{label}</CardDescription></CardHeader><CardContent><strong className={cn('text-2xl', danger && 'text-red-600')}>{value}</strong></CardContent></Card>; }
function Loading({ text }: { text: string }) { return <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{text}</div>; }
function ErrorText({ text }: { text: string }) { return <div className="flex items-center justify-center gap-2 p-10 text-sm text-destructive"><AlertTriangle className="h-4 w-4" />{text}</div>; }
function formatDate(value?: string | null): string { return value ? new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—'; }
function SlaBadge({ ticket }: { ticket: SupportTicket }) {
  if (ticket.sla.responseBreached || ticket.sla.resolutionBreached) return <Badge variant="destructive"><ShieldAlert className="mr-1 h-3 w-3" />SLA buzilgan</Badge>;
  if (ticket.sla.paused) return <Badge variant="outline"><Clock3 className="mr-1 h-3 w-3" />SLA pauza</Badge>;
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') return <Badge variant="outline"><CheckCircle2 className="mr-1 h-3 w-3" />Yechilgan</Badge>;
  const seconds = ticket.sla.resolutionRemainingSeconds;
  return <Badge variant="outline"><MessageSquare className="mr-1 h-3 w-3" />{seconds == null ? '—' : seconds <= 0 ? 'due' : `${Math.ceil(seconds / 3600)} soat`}</Badge>;
}
