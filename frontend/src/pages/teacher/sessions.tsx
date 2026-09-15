import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, CloudCog, ExternalLink, Plus, Radio, RefreshCw, Trash2, Users, Video, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi, type TeacherLearningSession, type TeacherLearningSessionPayload } from "@/services/api/teacher-portal-api";

function localInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function displayDate(value: string) {
  return new Date(value).toLocaleString("uz-Latn", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const emptyUrls = { room: "", building: "", liveUrl: "", recordingUrl: "", resourceUrl: "" };

export function TeacherSessions({ managementMode = false }: { managementMode?: boolean }) {
  const [params] = useSearchParams();
  const scopedCourseId = params.get('courseId') || '';
  return <SessionWorkspace key={`${managementMode}:${scopedCourseId}`} managementMode={managementMode} scopedCourseId={scopedCourseId} />;
}

function SessionWorkspace({ managementMode, scopedCourseId }: { managementMode: boolean; scopedCourseId: string }) {
  const now = new Date();
  const [editing, setEditing] = useState<TeacherLearningSession | null>(null);
  const [courseId, setCourseId] = useState(scopedCourseId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"SYNCHRONOUS" | "ASYNCHRONOUS">("SYNCHRONOUS");
  const [sessionType, setSessionType] = useState<TeacherLearningSessionPayload["sessionType"]>("LECTURE");
  const [startsAt, setStartsAt] = useState(localInputValue(now));
  const [endsAt, setEndsAt] = useState(localInputValue(new Date(now.getTime() + 90 * 60_000)));
  const [urls, setUrls] = useState(emptyUrls);
  const [publishNow, setPublishNow] = useState(true);
  const [useProvider, setUseProvider] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sessionsQuery = useQuery({
    queryKey: qk.teacher.sessions(),
    queryFn: () => teacherPortalApi.getLearningSessions(),
  });
  const coursesQuery = useQuery({ queryKey: qk.teacher.courses(), queryFn: teacherPortalApi.getCourses });
  const refresh = () => queryClient.invalidateQueries({ queryKey: qk.teacher.sessions() });

  const resetForm = () => { setEditing(null); setTitle(""); setDescription(""); setUrls(emptyUrls); setUseProvider(false); setPublishNow(true); };
  const editSession = (session: TeacherLearningSession) => {
    setEditing(session); setCourseId(session.courseId); setTitle(session.title); setDescription(session.description);
    setFormat(session.format.toUpperCase() as typeof format); setSessionType(session.sessionType.toUpperCase() as typeof sessionType);
    setStartsAt(localInputValue(new Date(session.startsAt))); setEndsAt(localInputValue(new Date(session.endsAt)));
    setUrls({ room: session.room ?? "", building: session.building ?? "", liveUrl: session.liveUrl ?? "", recordingUrl: session.recordingUrl ?? "", resourceUrl: session.resourceUrl ?? "" });
    setUseProvider(false); setPublishNow(session.status === "published");
    document.getElementById("session-form")?.scrollIntoView({ behavior: "smooth" });
  };
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!coursesQuery.data?.some(course => course.id === courseId && course.status !== 'archived') || (scopedCourseId && courseId !== scopedCourseId)) throw new Error("Mashg'ulot uchun faol kursni tanlang");
      const payload: TeacherLearningSessionPayload = {
        courseId: Number(courseId), title: title.trim(), description: description.trim(), format, sessionType,
        startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(),
        room: urls.room || undefined, building: urls.building || undefined,
        liveUrl: useProvider ? undefined : urls.liveUrl || undefined,
        recordingUrl: urls.recordingUrl || undefined, resourceUrl: urls.resourceUrl || undefined,
        status: useProvider ? "DRAFT" : publishNow ? "PUBLISHED" : "DRAFT",
      };
      const session = editing ? await teacherPortalApi.updateLearningSession(editing.id, payload) : await teacherPortalApi.createLearningSession(payload);
      // A provider failure must not invite creating the already-saved session again.
      let providerError: string | undefined;
      let meeting = null;
      if (!editing && useProvider) {
        try { meeting = await teacherPortalApi.provisionVideoConference(session.id); }
        catch (error) { providerError = error instanceof Error ? error.message : "Videoaloqa yaratilmadi"; }
      }
      return { session, meeting, providerError };
    },
    onSuccess: async ({ meeting, providerError }) => {
      resetForm();
      await refresh();
      toast({
        title: (providerError || meeting?.status === "FAILED") ? "Mashg'ulot saqlandi, provider meeting yaratilmadi" : "Mashg'ulot saqlandi",
        description: (providerError || meeting?.status === "FAILED") ? providerError ?? meeting?.failureMessage ?? undefined : undefined,
        variant: (providerError || meeting?.status === "FAILED") ? "destructive" : "default",
      });
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Mashg'ulot saqlanmadi", description: error.message }),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "PUBLISHED" | "CANCELLED" | "COMPLETED" }) =>
      teacherPortalApi.updateLearningSessionStatus(id, status),
    onSuccess: async () => { await refresh(); toast({ title: "Mashg'ulot holati yangilandi" }); },
    onError: (error: Error) => toast({ variant: "destructive", title: "Holat yangilanmadi", description: error.message }),
  });
  const deleteMutation = useMutation({
    mutationFn: teacherPortalApi.deleteLearningSession,
    onSuccess: async () => { await refresh(); toast({ title: "Draft mashg'ulot o'chirildi" }); },
    onError: (error: Error) => toast({ variant: "destructive", title: "Mashg'ulot o'chirilmadi", description: error.message }),
  });
  const provisionMutation = useMutation({
    mutationFn: teacherPortalApi.provisionVideoConference,
    onSuccess: async (meeting) => {
      await refresh();
      toast({
        title: meeting.status === "READY" ? "Provider meeting tayyor" : "Provider meeting yaratilmadi",
        description: meeting.status === "FAILED" ? meeting.failureMessage ?? undefined : undefined,
        variant: meeting.status === "FAILED" ? "destructive" : "default",
      });
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Provisioning bajarilmadi", description: error.message }),
  });
  const cancelMeetingMutation = useMutation({
    mutationFn: teacherPortalApi.cancelVideoConference,
    onSuccess: async () => { await refresh(); toast({ title: "Provider meeting bekor qilindi" }); },
    onError: (error: Error) => toast({ variant: "destructive", title: "Meeting bekor qilinmadi", description: error.message }),
  });

  const hasDelivery = format === "SYNCHRONOUS"
    ? Boolean(useProvider || urls.liveUrl || urls.room)
    : Boolean(urls.recordingUrl || urls.resourceUrl);
  const datesValid = Boolean(startsAt && endsAt && Number.isFinite(Date.parse(startsAt)) && Number.isFinite(Date.parse(endsAt)) && Date.parse(endsAt) > Date.parse(startsAt));
  const canCreate = Boolean(coursesQuery.data?.some(course => course.id === courseId && course.status !== 'archived') && (!scopedCourseId || courseId === scopedCourseId) && title.trim() && datesValid && (!publishNow || hasDelivery) && !coursesQuery.isError);

  if (sessionsQuery.isLoading) return <div className="p-3 sm:p-6 space-y-4"><Skeleton className="h-9 w-64" /><Skeleton className="h-64" /><Skeleton className="h-48" /></div>;
  if (sessionsQuery.error) return <div className="p-3 sm:p-6"><Card className="border-destructive/50"><CardContent className="py-10 text-center space-y-3"><p>{sessionsQuery.error.message}</p><Button variant="outline" onClick={() => sessionsQuery.refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button></CardContent></Card></div>;

  const sessions = (sessionsQuery.data ?? []).filter(session => !scopedCourseId || session.courseId === scopedCourseId);
  const visibleSessions = sessions.filter(session => (!statusFilter || session.status === statusFilter) &&
    `${session.title} ${session.courseTitle}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">{managementMode ? "Dars jadvalini boshqarish" : "Mashg'ulotlar va dars jadvali"}</h1><p className="text-muted-foreground">{managementMode ? "Kursni tanlang, dars vaqti hamda o'tkazish joyini kiriting va talabalar uchun nashr qiling." : "Jonli dars, video yozuv va mustaqil resurslarni kurs jadvaliga nashr qiling."}</p></div>
      {scopedCourseId && <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm"><span>Kurs: {coursesQuery.data?.find(course => course.id === scopedCourseId)?.title || 'Kurs ma’lumoti mavjud emas'}</span><Link className="text-primary underline" to={`/teacher/courses/${encodeURIComponent(scopedCourseId)}/contents`}>Kursga qaytish</Link><Link className="text-primary underline" to="?">Barcha mashg'ulotlar</Link></div>}
      {scopedCourseId && coursesQuery.isSuccess && !coursesQuery.data.some(course => course.id === scopedCourseId && course.status !== 'archived') && <p role="alert" className="text-sm text-destructive">Kurs mavjud emas yoki arxivlangan. Yangi mashg'ulot yaratish yopiq.</p>}
      {managementMode && <Alert><CalendarDays className="h-4 w-4" /><AlertDescription>Nashr qilingan dars kurs o'qituvchisi va shu kursga faol biriktirilgan talabalar kabinetida ko'rinadi. Draft yozuv talabaga ko'rinmaydi.</AlertDescription></Alert>}
      <Alert><CloudCog className="h-4 w-4" /><AlertDescription>Jonli dars uchun xona yoki tayyor havola kiriting. Videoaloqa xizmati ulangan bo'lsa, havolani shu xizmat orqali yaratish ham mumkin. Mustaqil mashg'ulot uchun yozuv yoki resurs havolasini kiriting.</AlertDescription></Alert>

      <Card id="session-form">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />{editing ? "Mashg‘ulotni tahrirlash" : "Yangi mashg‘ulot"}</CardTitle><CardDescription>Student faqat faol kurs biriktirishi orqali nashrdagi mashg'ulotni ko'radi.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {coursesQuery.isError && <div role="alert">Kurslarni yuklab bo‘lmadi. <Button variant="outline" onClick={() => void coursesQuery.refetch()}>Kurslarni qayta yuklash</Button></div>}
          {!datesValid && <p role="alert" className="text-sm text-destructive">Tugash vaqti boshlanish vaqtidan keyin bo‘lishi kerak.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <Select disabled={Boolean(editing) || Boolean(scopedCourseId) || createMutation.isPending} value={courseId} onValueChange={setCourseId}><SelectTrigger aria-label="Mashg'ulot kursi"><SelectValue placeholder="Kursni tanlang" /></SelectTrigger><SelectContent>{(coursesQuery.data ?? []).filter(course => course.status !== "archived").map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select>
            <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Mashg'ulot nomi" />
            <Select value={format} onValueChange={value => { setFormat(value as typeof format); if (value === "ASYNCHRONOUS") setUseProvider(false); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SYNCHRONOUS">Sinxron — jonli</SelectItem><SelectItem value="ASYNCHRONOUS">Asinxron — mustaqil</SelectItem></SelectContent></Select>
            <Select value={sessionType} onValueChange={value => setSessionType(value as typeof sessionType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LECTURE">Ma'ruza</SelectItem><SelectItem value="LAB">Laboratoriya</SelectItem><SelectItem value="SEMINAR">Seminar</SelectItem><SelectItem value="TUTORIAL">Amaliyot</SelectItem></SelectContent></Select>
            <Input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} title="Boshlanish" />
            <Input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} title="Tugash / mavjudlik oxiri" />
            <Input value={urls.room} onChange={event => setUrls(current => ({ ...current, room: event.target.value }))} placeholder="Xona" />
            <Input value={urls.building} onChange={event => setUrls(current => ({ ...current, building: event.target.value }))} placeholder="Bino" />
            {!editing && format === "SYNCHRONOUS" && <Select value={useProvider ? "provider" : "manual"} onValueChange={value => { setUseProvider(value === "provider"); if (value === "provider") setPublishNow(false); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="provider">Provider orqali xavfsiz provisioning</SelectItem><SelectItem value="manual">Tayyor URLni qo'lda kiritish</SelectItem></SelectContent></Select>}
            <Input disabled={useProvider} value={urls.liveUrl} onChange={event => setUrls(current => ({ ...current, liveUrl: event.target.value }))} placeholder={useProvider ? "Backend provider yaratadi" : "https://... jonli dars"} />
            <Input value={urls.recordingUrl} onChange={event => setUrls(current => ({ ...current, recordingUrl: event.target.value }))} placeholder="https://... video yozuv" />
            <Input value={urls.resourceUrl} onChange={event => setUrls(current => ({ ...current, resourceUrl: event.target.value }))} placeholder="https://... resurs" />
            <Select disabled={useProvider || Boolean(editing)} value={useProvider ? "draft" : publishNow ? "published" : "draft"} onValueChange={value => setPublishNow(value === "published")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Darhol nashr qilish</SelectItem><SelectItem value="draft">Draft saqlash</SelectItem></SelectContent></Select>
          </div>
          <Textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Tavsif va ko'rsatmalar" />
          <div className="flex gap-2"><Button className="gap-2" disabled={!canCreate || createMutation.isPending} onClick={() => createMutation.mutate()}><Plus className="h-4 w-4" />{editing ? "O‘zgarishlarni saqlash" : "Saqlash"}</Button>{editing && <Button variant="outline" disabled={createMutation.isPending} onClick={resetForm}>Tahrirni bekor qilish</Button>}</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Jami mashg'ulot</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{sessions.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Nashr qilingan</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">{sessions.filter(item => item.status === "published").length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Student ochishlari</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-600">{sessions.reduce((sum, item) => sum + item.accessCount, 0)}</CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3"><Input className="max-w-md" aria-label="Jadvaldan qidirish" placeholder="Mashg‘ulot yoki kurs nomi" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Mashg‘ulot holati" className="h-10 rounded border bg-background px-3 text-sm" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">Barcha holatlar</option><option value="draft">Qoralama</option><option value="published">Nashr qilingan</option><option value="completed">Yakunlangan</option><option value="cancelled">Bekor qilingan</option></select><span className="self-center text-sm text-muted-foreground">{visibleSessions.length} ta mashg‘ulot</span></div>
      {visibleSessions.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Tanlangan filtrlar bo‘yicha mashg‘ulot topilmadi.</CardContent></Card>}
      <div className="space-y-3">
        {visibleSessions.map(session => <Card key={session.id}><CardContent className="p-4 space-y-3"><div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3"><div className="space-y-1"><div className="font-semibold flex items-center gap-2">{session.format === "synchronous" ? <Radio className="h-4 w-4 text-red-500" /> : <Video className="h-4 w-4 text-blue-500" />}{session.title}</div><div className="text-sm text-muted-foreground">{session.courseTitle} · {displayDate(session.startsAt)} — {displayDate(session.endsAt)}</div><div className="flex flex-wrap gap-2"><Badge variant="outline">{session.format === "synchronous" ? "Sinxron" : "Asinxron"}</Badge><Badge variant={session.status === "published" ? "default" : "secondary"}>{session.status}</Badge>{session.videoConference && <Badge variant={session.videoConference.status === "READY" ? "default" : session.videoConference.status === "FAILED" ? "destructive" : "outline"}>{session.videoConference.providerCode}: {session.videoConference.status}</Badge>}<Badge variant="outline" className="gap-1"><Users className="h-3 w-3" />{session.accessCount} ochish</Badge></div></div><div className="flex flex-wrap gap-2">{(session.status === "draft" || (session.status === "published" && Date.parse(session.startsAt) > Date.now())) && <span title={session.videoConference?.status === "READY" ? "Avval tayyor videoaloqa uchrashuvini bekor qiling" : undefined}><Button variant="outline" size="sm" disabled={createMutation.isPending || Boolean(editing) || session.videoConference?.status === "READY"} onClick={() => editSession(session)}>Tahrirlash</Button></span>}{session.status === "draft" && session.format === "synchronous" && (!session.videoConference || ["FAILED", "PROVISIONING"].includes(session.videoConference.status)) && <Button size="sm" variant="outline" disabled={provisionMutation.isPending} onClick={() => provisionMutation.mutate(session.id)}><CloudCog className="h-4 w-4 mr-1" />{session.videoConference ? "Qayta urinish" : "Provider meeting"}</Button>}{session.status === "draft" && session.videoConference && ["READY", "FAILED", "PROVISIONING"].includes(session.videoConference.status) && <Button size="sm" variant="ghost" disabled={cancelMeetingMutation.isPending} onClick={() => cancelMeetingMutation.mutate(session.id)}><XCircle className="h-4 w-4 mr-1" />Meetingni bekor qilish</Button>}{session.status === "draft" && <Button size="sm" disabled={statusMutation.isPending || Boolean(editing)} onClick={() => statusMutation.mutate({ id: session.id, status: "PUBLISHED" })}>Nashr qilish</Button>}{session.status === "published" && <Button size="sm" variant="outline" disabled={statusMutation.isPending || Boolean(editing)} onClick={() => statusMutation.mutate({ id: session.id, status: "COMPLETED" })}><CheckCircle2 className="h-4 w-4 mr-1" />Yakunlash</Button>}{session.status === "published" && <Button size="sm" variant="destructive" disabled={statusMutation.isPending || Boolean(editing)} onClick={() => statusMutation.mutate({ id: session.id, status: "CANCELLED" })}>Bekor qilish</Button>}{session.status === "draft" && <Button size="icon" variant="ghost" disabled={deleteMutation.isPending || Boolean(editing)} className="text-destructive" onClick={() => deleteMutation.mutate(session.id)}><Trash2 className="h-4 w-4" /></Button>}</div></div>{session.description && <p className="text-sm">{session.description}</p>}{session.videoConference?.status === "FAILED" && <p className="text-sm text-destructive"><b>{session.videoConference.failureCode}:</b> {session.videoConference.failureMessage} · {session.videoConference.provisionAttempts} urinish</p>}<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">{session.room && <span><CalendarDays className="inline h-4 w-4 mr-1" />{session.building ? `${session.building}, ` : ""}{session.room}</span>}{[session.liveUrl, session.recordingUrl, session.resourceUrl, session.videoConference?.joinUrl, session.videoConference?.hostUrl].filter((url): url is string => Boolean(url)).map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />{url === session.videoConference?.hostUrl ? "Host" : url === session.videoConference?.joinUrl ? "Join" : "Havola"}</a>)}</div></CardContent></Card>)}
      </div>
    </div>
  );
}
