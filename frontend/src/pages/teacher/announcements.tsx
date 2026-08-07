import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, BarChart3, CheckCircle2, Edit, Loader2, Megaphone, Plus, RefreshCw, Send, Users, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { announcementApi, type Announcement, type AnnouncementChannel, type AnnouncementRequest } from '@/services/api/announcement-api';

const emptyForm: AnnouncementRequest = {
  title: '', body: '', audience: 'COURSE', courseId: null, category: 'INFORMATION', priority: 'NORMAL', channels: ['IN_APP'], actionUrl: '',
};

const statusMeta = {
  DRAFT: { label: 'Qoralama', variant: 'secondary' as const },
  PUBLISHED: { label: 'Chop etilgan', variant: 'default' as const },
  ARCHIVED: { label: 'Arxiv', variant: 'outline' as const },
};

export function TeacherAnnouncements() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [reportId, setReportId] = useState<number | null>(null);
  const [form, setForm] = useState<AnnouncementRequest>(emptyForm);
  const listKey = ['announcements', 'manage'];
  const optionsQuery = useQuery({ queryKey: ['announcements', 'options'], queryFn: announcementApi.options });
  const listQuery = useQuery({ queryKey: listKey, queryFn: announcementApi.manage });
  const reportQuery = useQuery({ queryKey: ['announcements', 'deliveries', reportId], queryFn: () => announcementApi.deliveries(reportId!), enabled: reportId !== null });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['announcements'] });
  const fail = (title: string) => (error: Error) => toast({ variant: 'destructive', title, description: error.message });
  const saveMutation = useMutation({
    mutationFn: () => editing ? announcementApi.update(editing.id, form) : announcementApi.create(form),
    onSuccess: async () => { closeEditor(); await refresh(); toast({ title: editing ? "E'lon yangilandi" : "E'lon qoralamasi yaratildi" }); },
    onError: fail("E'lon saqlanmadi"),
  });
  const publishMutation = useMutation({ mutationFn: announcementApi.publish, onSuccess: async () => { await refresh(); toast({ title: "E'lon chop etildi", description: 'Qabul qiluvchilar va kanal natijalari auditga yozildi.' }); }, onError: fail("E'lon chop etilmadi") });
  const archiveMutation = useMutation({ mutationFn: announcementApi.archive, onSuccess: async () => { await refresh(); toast({ title: "E'lon arxivlandi" }); }, onError: fail("E'lon arxivlanmadi") });
  const retryMutation = useMutation({ mutationFn: announcementApi.retry, onSuccess: async result => { await refresh(); if (reportId) await reportQuery.refetch(); toast({ title: `${result.attempted} ta yetkazish qayta navbatga qo'yildi`, description: "Natija idempotent outbox worker va integratsiya auditida kuzatiladi." }); }, onError: fail('Qayta urinish bajarilmadi') });

  useEffect(() => {
    if (form.audience === 'INSTITUTION' && !optionsQuery.data?.canPublishInstitution) setForm(current => ({ ...current, audience: 'COURSE', courseId: null }));
  }, [form.audience, optionsQuery.data?.canPublishInstitution]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, channels: ['IN_APP'] }); setEditorOpen(true); };
  const openEdit = (item: Announcement) => { setEditing(item); setForm({ title: item.title, body: item.body, audience: item.audience, courseId: item.courseId, category: item.category, priority: item.priority, channels: [...item.channels], actionUrl: item.actionUrl ?? '' }); setEditorOpen(true); };
  const closeEditor = () => { setEditorOpen(false); setEditing(null); setForm({ ...emptyForm, channels: ['IN_APP'] }); };
  const toggleChannel = (channel: AnnouncementChannel) => setForm(current => {
    if (channel === 'IN_APP') return current;
    return { ...current, channels: current.channels.includes(channel) ? current.channels.filter(value => value !== channel) : [...current.channels, channel] };
  });
  const valid = form.title.trim().length >= 3 && form.body.trim().length >= 3 && (form.audience === 'INSTITUTION' || Boolean(form.courseId));
  const items = listQuery.data ?? [];

  return (
    <div className="space-y-5 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Megaphone className="h-6 w-6" />E'lonlar</h1><p className="text-sm text-muted-foreground">Kurs yoki tashkilot auditoriyasiga kuzatiladigan e'lon yuborish</p></div>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Qoralama yaratish</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Jami" value={items.length} />
        <Metric label="Qoralama" value={items.filter(item => item.status === 'DRAFT').length} />
        <Metric label="Chop etilgan" value={items.filter(item => item.status === 'PUBLISHED').length} />
        <Metric label="O'qilgan" value={items.reduce((sum, item) => sum + item.readCount, 0)} />
      </div>

      {listQuery.isLoading && <Loading text="E'lonlar yuklanmoqda..." />}
      {listQuery.error && <ErrorState text={listQuery.error.message} retry={() => listQuery.refetch()} />}
      {!listQuery.isLoading && !listQuery.error && items.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">Hozircha e'lon yaratilmagan.</CardContent></Card>}
      <div className="space-y-3">
        {items.map(item => {
          const channelProblems = item.deliveryStats.reduce((sum, stat) => sum + stat.pending + stat.failed + stat.skipped, 0);
          return <Card key={item.id} className={item.priority === 'URGENT' ? 'border-l-4 border-l-red-500' : item.priority === 'HIGH' ? 'border-l-4 border-l-amber-500' : ''}>
            <CardHeader className="pb-3"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-base">{item.title}</CardTitle><Badge variant={statusMeta[item.status].variant}>{statusMeta[item.status].label}</Badge><Badge variant="outline">{item.audience === 'COURSE' ? item.courseTitle : 'Tashkilot'}</Badge></div><CardDescription className="mt-1">{item.authorName} · {formatDate(item.publishedAt ?? item.createdAt)}</CardDescription></div><div className="flex flex-wrap gap-2">{item.canEdit && <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(item)}><Edit className="h-3.5 w-3.5" />Tahrirlash</Button>}{item.canPublish && <Button size="sm" className="gap-1" disabled={publishMutation.isPending} onClick={() => publishMutation.mutate(item.id)}><Send className="h-3.5 w-3.5" />Chop etish</Button>}{item.status !== 'DRAFT' && <Button size="sm" variant="outline" className="gap-1" onClick={() => setReportId(item.id)}><BarChart3 className="h-3.5 w-3.5" />Yetkazilish</Button>}{item.canRetry && <Button size="sm" variant="outline" className="gap-1" disabled={retryMutation.isPending} onClick={() => retryMutation.mutate(item.id)}><RefreshCw className="h-3.5 w-3.5" />Retry</Button>}{item.canArchive && <Button size="sm" variant="ghost" className="gap-1" disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate(item.id)}><Archive className="h-3.5 w-3.5" />Arxiv</Button>}</div></div></CardHeader>
            <CardContent><p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.body}</p><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary"><Users className="mr-1 h-3 w-3" />{item.recipientCount} qabul qiluvchi</Badge><Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" />{item.readCount} o'qigan</Badge>{item.channels.map(channel => <Badge key={channel} variant="outline">{channel}</Badge>)}{channelProblems > 0 && <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />{channelProblems} muammo</Badge>}</div></CardContent>
          </Card>;
        })}
      </div>

      <Dialog open={editorOpen} onOpenChange={open => { if (!open) closeEditor(); }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? "E'lonni tahrirlash" : "Yangi e'lon qoralamasi"}</DialogTitle><DialogDescription>Chop etishda qabul qiluvchilar ro'yxati snapshot qilinadi. IN_APP kanali majburiy.</DialogDescription></DialogHeader><div className="grid gap-4 py-2"><div className="space-y-1"><Label>Sarlavha</Label><Input maxLength={250} value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} /></div><div className="space-y-1"><Label>Matn</Label><Textarea rows={5} maxLength={10000} value={form.body} onChange={event => setForm(current => ({ ...current, body: event.target.value }))} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label>Auditoriya</Label><Select value={form.audience} onValueChange={value => setForm(current => ({ ...current, audience: value as AnnouncementRequest['audience'], courseId: null }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COURSE">Kurs</SelectItem>{optionsQuery.data?.canPublishInstitution && <SelectItem value="INSTITUTION">Tashkilot</SelectItem>}</SelectContent></Select></div>{form.audience === 'COURSE' && <div className="space-y-1"><Label>Kurs</Label><Select value={form.courseId ? String(form.courseId) : ''} onValueChange={value => setForm(current => ({ ...current, courseId: Number(value) }))}><SelectTrigger><SelectValue placeholder="Kursni tanlang" /></SelectTrigger><SelectContent>{optionsQuery.data?.courses.map(course => <SelectItem key={course.id} value={String(course.id)}>{course.title} · {course.status}</SelectItem>)}</SelectContent></Select></div>}<div className="space-y-1"><Label>Kategoriya</Label><Select value={form.category} onValueChange={value => setForm(current => ({ ...current, category: value as AnnouncementRequest['category'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INFORMATION">Ma'lumot</SelectItem><SelectItem value="DEADLINE">Muddat</SelectItem><SelectItem value="EVENT">Tadbir</SelectItem><SelectItem value="WARNING">Ogohlantirish</SelectItem></SelectContent></Select></div><div className="space-y-1"><Label>Muhimlik</Label><Select value={form.priority} onValueChange={value => setForm(current => ({ ...current, priority: value as AnnouncementRequest['priority'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Past</SelectItem><SelectItem value="NORMAL">Oddiy</SelectItem><SelectItem value="HIGH">Muhim</SelectItem><SelectItem value="URGENT">Shoshilinch</SelectItem></SelectContent></Select></div></div><div className="space-y-1"><Label>Ichki havola (ixtiyoriy)</Label><Input placeholder="/student/courses" value={form.actionUrl ?? ''} onChange={event => setForm(current => ({ ...current, actionUrl: event.target.value }))} /></div><div className="space-y-2"><Label>Yetkazish kanallari</Label><div className="flex flex-wrap gap-4">{(['IN_APP', 'EMAIL', 'PUSH'] as AnnouncementChannel[]).map(channel => <label key={channel} className="flex items-center gap-2 rounded border px-3 py-2 text-sm"><input type="checkbox" checked={form.channels.includes(channel)} disabled={channel === 'IN_APP'} onChange={() => toggleChannel(channel)} />{channel}</label>)}</div><p className="text-xs text-muted-foreground">Email/push provayderi sozlanmagan bo'lsa holat auditda FAILED/SKIPPED bo'lib qoladi.</p></div><Button disabled={!valid || saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? 'Saqlanmoqda...' : 'Qoralamani saqlash'}</Button></div></DialogContent></Dialog>

      <Dialog open={reportId !== null} onOpenChange={open => { if (!open) setReportId(null); }}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Yetkazilish auditi</DialogTitle><DialogDescription>Har bir qabul qiluvchi, kanal, urinish va provayder natijasi.</DialogDescription></DialogHeader>{reportQuery.isLoading ? <Loading text="Hisobot yuklanmoqda..." /> : reportQuery.error ? <ErrorState text={reportQuery.error.message} retry={() => reportQuery.refetch()} /> : reportQuery.data && <><div className="grid grid-cols-3 gap-2">{reportQuery.data.stats.map(stat => <Card key={stat.channel}><CardContent className="p-3 text-xs"><strong>{stat.channel}</strong><p className="mt-1 text-muted-foreground">Yetkazildi: {stat.delivered} · O'qildi: {stat.read}<br />Xato: {stat.failed} · O'tkazildi: {stat.skipped}</p></CardContent></Card>)}</div><ScrollArea className="h-80 rounded border"><div className="divide-y">{reportQuery.data.deliveries.map(delivery => <div key={delivery.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[1fr_100px_110px_1fr]"><strong>{delivery.recipientName}</strong><span>{delivery.channel}</span><Badge variant={delivery.status === 'FAILED' ? 'destructive' : 'outline'} className="w-fit">{delivery.status}</Badge><span className="text-xs text-muted-foreground">Urinish: {delivery.attemptCount} · {delivery.destinationMasked ?? 'manzil yoq'}{delivery.lastError && <><br /><span className="text-destructive">{delivery.lastError}</span></>}</span></div>)}</div></ScrollArea>{reportQuery.data.deliveries.length === 0 && <p className="text-sm text-muted-foreground">E'lon hali chop etilmagan.</p>}<Button variant="outline" className="gap-2" disabled={!reportId || retryMutation.isPending} onClick={() => reportId && retryMutation.mutate(reportId)}><RefreshCw className="h-4 w-4" />Muammoli yetkazishlarni qayta urinish</Button></>}</DialogContent></Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <Card><CardHeader className="pb-1"><CardDescription>{label}</CardDescription></CardHeader><CardContent><strong className="text-2xl">{value}</strong></CardContent></Card>; }
function Loading({ text }: { text: string }) { return <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{text}</div>; }
function ErrorState({ text, retry }: { text: string; retry: () => unknown }) { return <Card><CardContent className="flex items-center gap-3 py-6 text-sm text-destructive"><XCircle className="h-5 w-5" />{text}<Button variant="outline" size="sm" className="ml-auto" onClick={retry}>Qayta urinish</Button></CardContent></Card>; }
function formatDate(value?: string | null): string { return value ? new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'; }
