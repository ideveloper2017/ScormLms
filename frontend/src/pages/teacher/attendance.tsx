import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3, Plus, RefreshCw, Trash2, Users, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";

function localInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fmtDate(value: string) {
  return new Date(value).toLocaleString("uz-Latn", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function TeacherAttendance() {
  const now = new Date();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [opensAt, setOpensAt] = useState(localInputValue(now));
  const [closesAt, setClosesAt] = useState(localInputValue(new Date(now.getTime() + 90 * 60_000)));
  const [lateAfter, setLateAfter] = useState("");
  const [minimumSeconds, setMinimumSeconds] = useState("0");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const recordsQuery = useQuery({
    queryKey: qk.teacher.attendance(),
    queryFn: teacherPortalApi.getAttendance,
    staleTime: 60_000,
  });
  const coursesQuery = useQuery({
    queryKey: qk.teacher.courses(),
    queryFn: teacherPortalApi.getCourses,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: qk.teacher.attendance() });
  const createMutation = useMutation({
    mutationFn: () => teacherPortalApi.createAttendanceSession({
      courseId: Number(courseId),
      title: title.trim(),
      opensAt: new Date(opensAt).toISOString(),
      closesAt: new Date(closesAt).toISOString(),
      lateAfter: lateAfter ? new Date(lateAfter).toISOString() : undefined,
      minimumActivitySeconds: Number(minimumSeconds),
    }),
    onSuccess: async () => {
      setTitle("");
      await refresh();
      toast({ title: "Davomat oynasi yaratildi" });
    },
    onError: (cause: Error) => toast({ variant: "destructive", title: "Davomat oynasi yaratilmadi", description: cause.message }),
  });
  const deleteMutation = useMutation({
    mutationFn: teacherPortalApi.deleteAttendanceSession,
    onSuccess: async () => { await refresh(); toast({ title: "Davomat oynasi o'chirildi" }); },
    onError: (cause: Error) => toast({ variant: "destructive", title: "Davomat oynasi o'chirilmadi", description: cause.message }),
  });

  const records = recordsQuery.data ?? [];
  const totals = records.reduce(
    (acc, item) => ({ attended: acc.attended + item.present + item.late, absent: acc.absent + item.absent, total: acc.total + item.total }),
    { attended: 0, absent: 0, total: 0 },
  );
  const overallRate = totals.total > 0 ? Math.round(totals.attended / totals.total * 100) : 0;
  const canCreate = Boolean(courseId && title.trim() && opensAt && closesAt && Number(minimumSeconds) >= 0);

  if (recordsQuery.isLoading) return <div className="p-3 sm:p-6 space-y-4"><Skeleton className="h-9 w-40" /><div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(item => <Skeleton key={item} className="h-24" />)}</div><Skeleton className="h-48" /></div>;
  if (recordsQuery.error) return <div className="p-3 sm:p-6 space-y-4"><h1 className="text-2xl font-bold">Davomat</h1><Card className="border-destructive/50"><CardContent className="pt-6 text-center space-y-3"><AlertTriangle className="h-10 w-10 mx-auto text-destructive" /><p>{recordsQuery.error.message}</p><Button variant="outline" onClick={() => recordsQuery.refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button></CardContent></Card></div>;

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Faollik asosidagi davomat</h1><p className="text-muted-foreground">Talaba loginiga emas, belgilangan vaqt oralig'idagi kontent va SCORM hodisalariga asoslanadi.</p></div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock3 className="h-4 w-4" />Yangi davomat oynasi</CardTitle><CardDescription>Shu vaqt ichidagi o'quv resursi faoliyati qatnashish dalili bo'ladi.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-2">
          <Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue placeholder="Kursni tanlang" /></SelectTrigger><SelectContent>{(coursesQuery.data ?? []).filter(course => course.status !== "archived").map(course => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select>
          <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Mashg'ulot nomi" />
          <Input type="datetime-local" value={opensAt} onChange={event => setOpensAt(event.target.value)} title="Boshlanish" />
          <Input type="datetime-local" value={closesAt} onChange={event => setClosesAt(event.target.value)} title="Tugash" />
          <Input type="datetime-local" value={lateAfter} onChange={event => setLateAfter(event.target.value)} title="Kechikish chegarasi (ixtiyoriy)" />
          <Input type="number" min={0} max={86400} value={minimumSeconds} onChange={event => setMinimumSeconds(event.target.value)} placeholder="Minimal soniya" />
          <Button onClick={() => createMutation.mutate()} disabled={!canCreate || createMutation.isPending} className="gap-2"><Plus className="h-4 w-4" />Yaratish</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[{ label: "Davomat oynalari", value: records.length, cls: "" }, { label: "Qatnashgan", value: totals.attended, cls: "text-green-600" }, { label: "Umumiy davomat", value: `${overallRate}%`, cls: "text-blue-600" }].map(item => <Card key={item.label}><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{item.label}</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${item.cls}`}>{item.value}</div></CardContent></Card>)}
      </div>

      {records.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Davomat oynasi yaratilmagan.</CardContent></Card>}
      <div className="space-y-3">
        {records.map(record => {
          const attended = record.present + record.late;
          const rate = record.total > 0 ? Math.round(attended / record.total * 100) : 0;
          return <Card key={record.id}><CardContent className="p-4 space-y-3"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><div className="font-medium">{record.sessionTitle}</div><div className="text-sm text-muted-foreground">{record.courseTitle} · {record.group || "Guruhsiz"} · {fmtDate(record.opensAt)} — {fmtDate(record.closesAt)}</div><div className="text-xs text-muted-foreground mt-1">Minimal faollik: {record.minimumActivitySeconds} soniya</div></div><div className="flex items-center gap-2"><Badge variant={record.status === "open" ? "default" : "secondary"}>{record.status === "scheduled" ? "Rejada" : record.status === "open" ? "Ochiq" : "Yopilgan"}</Badge><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(record.id)}><Trash2 className="h-4 w-4" /></Button></div></div><div className="flex flex-wrap gap-4 text-sm"><span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />{record.present} qatnashdi</span><span className="text-yellow-600 flex items-center gap-1"><Clock3 className="h-4 w-4" />{record.late} kech</span><span className="text-red-600 flex items-center gap-1"><XCircle className="h-4 w-4" />{record.absent} qatnashmadi</span><span className="text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" />{record.pending} kutilmoqda / {record.total} jami</span></div><div><div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Faollik bilan tasdiqlangan davomat</span><span>{rate}%</span></div><Progress value={rate} /></div></CardContent></Card>;
        })}
      </div>
    </div>
  );
}
