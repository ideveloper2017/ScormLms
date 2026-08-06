import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ExternalLink, Plus, Radio, RefreshCw, Trash2, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi, type TeacherLearningSessionPayload } from "@/services/api/teacher-portal-api";

function localInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function displayDate(value: string) {
  return new Date(value).toLocaleString("uz-Latn", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const emptyUrls = { room: "", building: "", liveUrl: "", recordingUrl: "", resourceUrl: "" };

export function TeacherSessions() {
  const now = new Date();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"SYNCHRONOUS" | "ASYNCHRONOUS">("SYNCHRONOUS");
  const [sessionType, setSessionType] = useState<TeacherLearningSessionPayload["sessionType"]>("LECTURE");
  const [startsAt, setStartsAt] = useState(localInputValue(now));
  const [endsAt, setEndsAt] = useState(localInputValue(new Date(now.getTime() + 90 * 60_000)));
  const [urls, setUrls] = useState(emptyUrls);
  const [publishNow, setPublishNow] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sessionsQuery = useQuery({
    queryKey: qk.teacher.sessions(),
    queryFn: () => teacherPortalApi.getLearningSessions(),
  });
  const coursesQuery = useQuery({ queryKey: qk.teacher.courses(), queryFn: teacherPortalApi.getCourses });
  const refresh = () => queryClient.invalidateQueries({ queryKey: qk.teacher.sessions() });

  const createMutation = useMutation({
    mutationFn: () => teacherPortalApi.createLearningSession({
      courseId: Number(courseId),
      title: title.trim(),
      description: description.trim(),
      format,
      sessionType,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      room: urls.room || undefined,
      building: urls.building || undefined,
      liveUrl: urls.liveUrl || undefined,
      recordingUrl: urls.recordingUrl || undefined,
      resourceUrl: urls.resourceUrl || undefined,
      status: publishNow ? "PUBLISHED" : "DRAFT",
    }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setUrls(emptyUrls);
      await refresh();
      toast({ title: "Mashg'ulot saqlandi" });
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

  const hasDelivery = format === "SYNCHRONOUS"
    ? Boolean(urls.liveUrl || urls.room)
    : Boolean(urls.recordingUrl || urls.resourceUrl);
  const canCreate = Boolean(courseId && title.trim() && startsAt && endsAt && hasDelivery);

  if (sessionsQuery.isLoading) return <div className="p-3 sm:p-6 space-y-4"><Skeleton className="h-9 w-64" /><Skeleton className="h-64" /><Skeleton className="h-48" /></div>;
  if (sessionsQuery.error) return <div className="p-3 sm:p-6"><Card className="border-destructive/50"><CardContent className="py-10 text-center space-y-3"><p>{sessionsQuery.error.message}</p><Button variant="outline" onClick={() => sessionsQuery.refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button></CardContent></Card></div>;

  const sessions = sessionsQuery.data ?? [];
  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Mashg'ulotlar va dars jadvali</h1><p className="text-muted-foreground">Jonli dars, video yozuv va mustaqil resurslarni kurs jadvaliga nashr qiling.</p></div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />Yangi mashg'ulot</CardTitle><CardDescription>Student faqat faol kurs biriktirishi orqali nashrdagi mashg'ulotni ko'radi.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Kursni tanlang" /></SelectTrigger><SelectContent>{(coursesQuery.data ?? []).filter(course => course.status !== "archived").map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select>
            <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Mashg'ulot nomi" />
            <Select value={format} onValueChange={value => setFormat(value as typeof format)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SYNCHRONOUS">Sinxron — jonli</SelectItem><SelectItem value="ASYNCHRONOUS">Asinxron — mustaqil</SelectItem></SelectContent></Select>
            <Select value={sessionType} onValueChange={value => setSessionType(value as typeof sessionType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LECTURE">Ma'ruza</SelectItem><SelectItem value="LAB">Laboratoriya</SelectItem><SelectItem value="SEMINAR">Seminar</SelectItem><SelectItem value="TUTORIAL">Amaliyot</SelectItem></SelectContent></Select>
            <Input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} title="Boshlanish" />
            <Input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} title="Tugash / mavjudlik oxiri" />
            <Input value={urls.room} onChange={event => setUrls(current => ({ ...current, room: event.target.value }))} placeholder="Xona" />
            <Input value={urls.building} onChange={event => setUrls(current => ({ ...current, building: event.target.value }))} placeholder="Bino" />
            <Input value={urls.liveUrl} onChange={event => setUrls(current => ({ ...current, liveUrl: event.target.value }))} placeholder="https://... jonli dars" />
            <Input value={urls.recordingUrl} onChange={event => setUrls(current => ({ ...current, recordingUrl: event.target.value }))} placeholder="https://... video yozuv" />
            <Input value={urls.resourceUrl} onChange={event => setUrls(current => ({ ...current, resourceUrl: event.target.value }))} placeholder="https://... resurs" />
            <Select value={publishNow ? "published" : "draft"} onValueChange={value => setPublishNow(value === "published")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Darhol nashr qilish</SelectItem><SelectItem value="draft">Draft saqlash</SelectItem></SelectContent></Select>
          </div>
          <Textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Tavsif va ko'rsatmalar" />
          <Button className="gap-2" disabled={!canCreate || createMutation.isPending} onClick={() => createMutation.mutate()}><Plus className="h-4 w-4" />Saqlash</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Jami mashg'ulot</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{sessions.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Nashr qilingan</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">{sessions.filter(item => item.status === "published").length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Student ochishlari</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-600">{sessions.reduce((sum, item) => sum + item.accessCount, 0)}</CardContent></Card>
      </div>

      {sessions.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Mashg'ulot hali yaratilmagan.</CardContent></Card>}
      <div className="space-y-3">
        {sessions.map(session => <Card key={session.id}><CardContent className="p-4 space-y-3"><div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3"><div className="space-y-1"><div className="font-semibold flex items-center gap-2">{session.format === "synchronous" ? <Radio className="h-4 w-4 text-red-500" /> : <Video className="h-4 w-4 text-blue-500" />}{session.title}</div><div className="text-sm text-muted-foreground">{session.courseTitle} · {displayDate(session.startsAt)} — {displayDate(session.endsAt)}</div><div className="flex flex-wrap gap-2"><Badge variant="outline">{session.format === "synchronous" ? "Sinxron" : "Asinxron"}</Badge><Badge variant={session.status === "published" ? "default" : "secondary"}>{session.status}</Badge><Badge variant="outline" className="gap-1"><Users className="h-3 w-3" />{session.accessCount} ochish</Badge></div></div><div className="flex flex-wrap gap-2">{session.status === "draft" && <Button size="sm" onClick={() => statusMutation.mutate({ id: session.id, status: "PUBLISHED" })}>Nashr qilish</Button>}{session.status === "published" && <Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ id: session.id, status: "COMPLETED" })}><CheckCircle2 className="h-4 w-4 mr-1" />Yakunlash</Button>}{session.status === "published" && <Button size="sm" variant="destructive" onClick={() => statusMutation.mutate({ id: session.id, status: "CANCELLED" })}>Bekor qilish</Button>}{session.status === "draft" && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(session.id)}><Trash2 className="h-4 w-4" /></Button>}</div></div>{session.description && <p className="text-sm">{session.description}</p>}<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">{session.room && <span><CalendarDays className="inline h-4 w-4 mr-1" />{session.building ? `${session.building}, ` : ""}{session.room}</span>}{[session.liveUrl, session.recordingUrl, session.resourceUrl].filter(Boolean).map(url => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />Havola</a>)}</div></CardContent></Card>)}
      </div>
    </div>
  );
}
