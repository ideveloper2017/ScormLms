import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileQuestion, Plus, Search, Trash2, Clock, Users, BarChart3, AlertTriangle, RefreshCw, Eye, CheckCircle2, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi, type TeacherQuizAttempt, type TeacherTest } from "@/services/api/teacher-portal-api";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Faol", cls: "bg-green-100 text-green-800" },
  upcoming: { label: "Rejalangan", cls: "bg-blue-100 text-blue-800" },
  completed: { label: "Tugagan", cls: "bg-slate-100 text-slate-700" },
  draft: { label: "Qoralama", cls: "bg-yellow-100 text-yellow-800" },
};

const initialForm = {
  title: "",
  courseId: "",
  instructions: "",
  opensAt: "",
  closesAt: "",
  duration: "30",
  allowedAttempts: "1",
  passingPercentage: "60",
  shuffleQuestions: true,
  showResult: true,
  proctoring: false,
  proctorIds: [] as string[],
  questionIds: [] as string[],
};

export function TeacherTests({ openCreate = false }: { openCreate?: boolean }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(openCreate);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [attemptsFor, setAttemptsFor] = useState<TeacherTest | null>(null);
  const [proctorsFor, setProctorsFor] = useState<TeacherTest | null>(null);
  const [selectedProctorIds, setSelectedProctorIds] = useState<string[]>([]);
  const [savingProctors, setSavingProctors] = useState(false);

  const { data: tests = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.tests(),
    queryFn: teacherPortalApi.getTests,
    staleTime: 30_000,
  });
  const { data: courses = [] } = useQuery({
    queryKey: qk.teacher.courses(),
    queryFn: teacherPortalApi.getCourses,
    staleTime: 60_000,
  });
  const { data: questions = [] } = useQuery({
    queryKey: qk.teacher.questions(form.courseId || undefined),
    queryFn: () => teacherPortalApi.getQuestions(form.courseId || undefined),
    enabled: !!form.courseId,
  });
  const { data: proctorCandidates = [] } = useQuery({
    queryKey: [...qk.teacher.tests(), "proctor-candidates"],
    queryFn: teacherPortalApi.getProctorCandidates,
    staleTime: 60_000,
  });
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: [...qk.teacher.tests(), "attempts", attemptsFor?.id],
    queryFn: () => teacherPortalApi.getTestAttempts(attemptsFor!.id),
    enabled: !!attemptsFor,
  });

  const filtered = tests.filter((test) => {
    const query = search.toLowerCase();
    return !query || test.title.toLowerCase().includes(query) || test.courseTitle.toLowerCase().includes(query);
  });
  const set = (key: keyof typeof form, value: string | boolean | string[]) =>
    setForm((current) => ({ ...current, [key]: value } as typeof current));

  const toggleQuestion = (id: string) => set(
    "questionIds",
    form.questionIds.includes(id) ? form.questionIds.filter((item) => item !== id) : [...form.questionIds, id],
  );

  const create = async () => {
    if (!form.title.trim() || !form.courseId || !form.opensAt || !form.closesAt || form.questionIds.length === 0) {
      toast({ variant: "destructive", title: "Nomi, kursi, vaqt oynasi va kamida bitta savol majburiy" });
      return;
    }
    setSaving(true);
    try {
      await teacherPortalApi.createTest({
        courseId: Number(form.courseId),
        title: form.title.trim(),
        instructions: form.instructions.trim(),
        opensAt: new Date(form.opensAt).toISOString(),
        closesAt: new Date(form.closesAt).toISOString(),
        durationMinutes: Number(form.duration),
        allowedAttempts: Number(form.allowedAttempts),
        passingPercentage: Number(form.passingPercentage),
        shuffleQuestions: form.shuffleQuestions,
        showResult: form.showResult,
        proctoring: form.proctoring,
        proctorIds: form.proctorIds.map(Number),
        questionIds: form.questionIds.map(Number),
        status: "PUBLISHED",
      });
      await refetch();
      toast({ title: "Test yaratildi", description: form.title });
      setForm(initialForm);
      setCreateOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Test yaratilmadi", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const saveProctors = async () => {
    if (!proctorsFor) return;
    setSavingProctors(true);
    try {
      await teacherPortalApi.updateTestProctors(proctorsFor.id, selectedProctorIds);
      await refetch();
      setProctorsFor(null);
      toast({ title: "Proktorlar yangilandi" });
    } catch (e) {
      toast({ variant: "destructive", title: "Proktorlar yangilanmadi", description: (e as Error).message });
    } finally {
      setSavingProctors(false);
    }
  };

  const changeStatus = async (test: TeacherTest) => {
    try {
      await teacherPortalApi.updateTestStatus(test.id, test.status === "active" ? "CLOSED" : "PUBLISHED");
      await refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Holat o'zgarmadi", description: (e as Error).message });
    }
  };

  const remove = async (id: string) => {
    try {
      await teacherPortalApi.deleteTest(id);
      await refetch();
      toast({ title: "Test o'chirildi" });
    } catch (e) {
      toast({ variant: "destructive", title: "Test o'chirilmadi", description: (e as Error).message });
    }
  };

  if (isLoading) return <div className="p-6 space-y-4"><Skeleton className="h-9 w-40" />{[1, 2, 3].map((id) => <Skeleton key={id} className="h-24 w-full" />)}</div>;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div><h1 className="text-2xl md:text-3xl font-bold">Testlar</h1><p className="text-muted-foreground">Serverda baholanadigan kurs testlari</p></div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Test yaratish</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Jami</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{tests.length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Faol</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">{tests.filter((item) => item.status === "active").length}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Urinishlar</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-600">{tests.reduce((sum, item) => sum + (item.participants ?? 0), 0)}</CardContent></Card>
      </div>

      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-10" placeholder="Test yoki kurs..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {error && <Card className="border-destructive"><CardContent className="py-6 text-center"><AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-2" /><Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button></CardContent></Card>}

      <div className="space-y-3">
        {filtered.map((test) => {
          const status = STATUS_META[test.status] ?? STATUS_META.draft;
          return <Card key={test.id}>
            <CardHeader className="pb-2"><div className="flex justify-between gap-3"><div className="flex gap-3"><FileQuestion className="h-5 w-5 mt-1 text-muted-foreground" /><div><CardTitle className="text-base">{test.title}</CardTitle><CardDescription>{test.courseTitle}</CardDescription></div></div><Badge className={status.cls}>{status.label}</Badge></div></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>{test.questions} savol / {test.totalPoints} ball</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{test.duration} daqiqa</span><span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{test.participants ?? 0} ishtirokchi</span>{test.avgScore != null && <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" />{test.avgScore}%</span>}<span>{new Date(test.date).toLocaleString("uz-Latn")}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setAttemptsFor(test)}><Eye className="h-4 w-4 mr-1" />Natijalar</Button>
                {test.proctoring && <Button size="sm" variant="outline" onClick={() => { setProctorsFor(test); setSelectedProctorIds(test.proctorIds ?? []); }}><Shield className="h-4 w-4 mr-1" />Proktorlar ({test.proctorIds?.length ?? 0})</Button>}
                <Button size="sm" variant="outline" onClick={() => changeStatus(test)}><CheckCircle2 className="h-4 w-4 mr-1" />{test.status === "active" ? "Yopish" : "Nashr qilish"}</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(test.id)}><Trash2 className="h-4 w-4 mr-1" />O'chirish</Button>
              </div>
            </CardContent>
          </Card>;
        })}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Yangi test</DialogTitle><DialogDescription>Vaqt, urinish va baholash qoidalarini belgilang.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid md:grid-cols-2 gap-3"><div><Label>Test nomi</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div><div><Label>Kurs</Label><Select value={form.courseId} onValueChange={(v) => { setForm((current) => ({ ...current, courseId: v, questionIds: [] })); }}><SelectTrigger><SelectValue placeholder="Kursni tanlang" /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label>Ko'rsatma</Label><Textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} /></div>
            <div className="grid md:grid-cols-2 gap-3"><div><Label>Ochilish vaqti</Label><Input type="datetime-local" value={form.opensAt} onChange={(e) => set("opensAt", e.target.value)} /></div><div><Label>Yopilish vaqti</Label><Input type="datetime-local" value={form.closesAt} onChange={(e) => set("closesAt", e.target.value)} /></div></div>
            <div className="grid grid-cols-3 gap-3"><div><Label>Davomiylik</Label><Input type="number" min={1} value={form.duration} onChange={(e) => set("duration", e.target.value)} /></div><div><Label>Urinishlar</Label><Input type="number" min={1} max={20} value={form.allowedAttempts} onChange={(e) => set("allowedAttempts", e.target.value)} /></div><div><Label>O'tish foizi</Label><Input type="number" min={0} max={100} value={form.passingPercentage} onChange={(e) => set("passingPercentage", e.target.value)} /></div></div>
            <div className="space-y-2"><Label>Savollar</Label>{!form.courseId && <p className="text-sm text-muted-foreground">Avval kursni tanlang.</p>}{form.courseId && questions.length === 0 && <p className="text-sm text-muted-foreground">Bu kursda savol yo'q. Savollar bankidan qo'shing.</p>}{questions.map((question) => <label key={question.id} className="flex items-start gap-3 rounded border p-3 cursor-pointer"><Checkbox checked={form.questionIds.includes(question.id)} onCheckedChange={() => toggleQuestion(question.id)} /><span className="text-sm flex-1">{question.text}<span className="block text-xs text-muted-foreground">{question.points} ball · {question.difficulty}</span></span></label>)}</div>
            <div className="grid md:grid-cols-3 gap-3"><label className="flex items-center justify-between border rounded p-3"><Label>Aralashtirish</Label><Switch checked={form.shuffleQuestions} onCheckedChange={(value) => set("shuffleQuestions", value)} /></label><label className="flex items-center justify-between border rounded p-3"><Label>Natijani ko'rsatish</Label><Switch checked={form.showResult} onCheckedChange={(value) => set("showResult", value)} /></label><label className="flex items-center justify-between border rounded p-3"><Label>Proktoring</Label><Switch checked={form.proctoring} onCheckedChange={(value) => setForm((current) => ({ ...current, proctoring: value, proctorIds: value ? current.proctorIds : [] }))} /></label></div>
            {form.proctoring && <div className="space-y-2"><Label>Biriktirilgan proktorlar</Label>{proctorCandidates.length === 0 && <p className="text-sm text-muted-foreground">Faol PROCTOR foydalanuvchisi topilmadi. Kurs egasi testni baribir kuzata oladi.</p>}{proctorCandidates.map((proctor) => <label key={proctor.id} className="flex items-center gap-3 rounded border p-3 cursor-pointer"><Checkbox checked={form.proctorIds.includes(proctor.id)} onCheckedChange={() => set("proctorIds", form.proctorIds.includes(proctor.id) ? form.proctorIds.filter((id) => id !== proctor.id) : [...form.proctorIds, proctor.id])} /><span className="text-sm"><span className="font-medium">{proctor.fullName}</span><span className="block text-xs text-muted-foreground">{proctor.username}</span></span></label>)}</div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button><Button onClick={create} disabled={saving}>{saving ? "Yaratilmoqda..." : "Yaratish"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!attemptsFor} onOpenChange={(open) => { if (!open) setAttemptsFor(null); }}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{attemptsFor?.title} — natijalar</DialogTitle><DialogDescription>Har bir urinish server vaqti va balli bilan audit qilinadi.</DialogDescription></DialogHeader><div className="max-h-[60vh] overflow-y-auto space-y-2">{attemptsLoading && <p>Yuklanmoqda...</p>}{attempts.length === 0 && !attemptsLoading && <p className="text-muted-foreground">Hali urinish yo'q</p>}{attempts.map((attempt: TeacherQuizAttempt) => <Card key={attempt.id}><CardContent className="p-3 flex justify-between gap-3"><div><p className="font-medium">{attempt.studentName} · #{attempt.attemptNumber}</p><p className="text-xs text-muted-foreground">{new Date(attempt.startedAt).toLocaleString("uz-Latn")} · {Math.round(attempt.durationSeconds / 60)} daqiqa</p></div><div className="text-right"><p className="font-semibold">{attempt.score}/{attempt.totalPoints} ({attempt.percentage.toFixed(1)}%)</p><Badge className={attempt.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{attempt.passed ? "O'tdi" : "O'tmadi"}</Badge></div></CardContent></Card>)}</div></DialogContent>
      </Dialog>

      <Dialog open={!!proctorsFor} onOpenChange={(open) => { if (!open) setProctorsFor(null); }}>
        <DialogContent><DialogHeader><DialogTitle>{proctorsFor?.title} — proktorlar</DialogTitle><DialogDescription>Faqat tanlangan PROCTOR foydalanuvchilari ushbu test sessiyalari va dalillarini ko‘radi. Kurs egasi ham vakolatli.</DialogDescription></DialogHeader><div className="space-y-2 max-h-[50vh] overflow-y-auto">{proctorCandidates.length === 0 && <p className="text-sm text-muted-foreground">Faol proktor topilmadi</p>}{proctorCandidates.map((proctor) => <label key={proctor.id} className="flex items-center gap-3 rounded border p-3 cursor-pointer"><Checkbox checked={selectedProctorIds.includes(proctor.id)} onCheckedChange={() => setSelectedProctorIds((current) => current.includes(proctor.id) ? current.filter((id) => id !== proctor.id) : [...current, proctor.id])} /><span><span className="font-medium text-sm">{proctor.fullName}</span><span className="block text-xs text-muted-foreground">{proctor.username}</span></span></label>)}</div><DialogFooter><Button variant="outline" onClick={() => setProctorsFor(null)}>Bekor qilish</Button><Button onClick={saveProctors} disabled={savingProctors}>{savingProctors ? "Saqlanmoqda..." : "Saqlash"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
