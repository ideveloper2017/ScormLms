import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileQuestion, Plus, Search, Edit, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi, type TeacherQuizQuestion } from "@/services/api/teacher-portal-api";

const DIFFICULTY = {
  EASY: { label: "Oson", cls: "bg-green-100 text-green-800" },
  MEDIUM: { label: "O'rtacha", cls: "bg-yellow-100 text-yellow-800" },
  HARD: { label: "Qiyin", cls: "bg-red-100 text-red-800" },
};

const TYPE_LABEL = {
  SINGLE_CHOICE: "Bir javobli",
  TRUE_FALSE: "Ha/yo'q",
  SHORT_ANSWER: "Qisqa javob",
};

const emptyForm = {
  courseId: "",
  text: "",
  type: "SINGLE_CHOICE" as TeacherQuizQuestion['type'],
  difficulty: "MEDIUM" as TeacherQuizQuestion['difficulty'],
  points: "1",
  options: "",
  correctAnswer: "",
  explanation: "",
};

export function TeacherQuestions() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherQuizQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: courses = [] } = useQuery({
    queryKey: qk.teacher.courses(),
    queryFn: teacherPortalApi.getCourses,
    staleTime: 60_000,
  });
  const { data: questions = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.questions(courseFilter === "all" ? undefined : courseFilter),
    queryFn: () => teacherPortalApi.getQuestions(courseFilter === "all" ? undefined : courseFilter),
    staleTime: 30_000,
  });

  const filtered = questions.filter((question) =>
    !search || question.text.toLowerCase().includes(search.toLowerCase()) ||
    question.courseTitle.toLowerCase().includes(search.toLowerCase())
  );
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, courseId: courseFilter === "all" ? "" : courseFilter });
    setDialogOpen(true);
  };

  const openEdit = (question: TeacherQuizQuestion) => {
    setEditing(question);
    setForm({
      courseId: question.courseId,
      text: question.text,
      type: question.type,
      difficulty: question.difficulty,
      points: String(question.points),
      options: question.options.join("\n"),
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.courseId || !form.text.trim() || !form.correctAnswer.trim()) {
      toast({ variant: "destructive", title: "Kurs, savol va to'g'ri javob majburiy" });
      return;
    }
    const payload = {
      courseId: Number(form.courseId),
      text: form.text.trim(),
      type: form.type,
      difficulty: form.difficulty,
      points: Number(form.points),
      options: form.type === "SINGLE_CHOICE"
        ? form.options.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean)
        : [],
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation.trim() || undefined,
    };
    setSaving(true);
    try {
      if (editing) await teacherPortalApi.updateQuestion(editing.id, payload);
      else await teacherPortalApi.createQuestion(payload);
      await refetch();
      toast({ title: editing ? "Savol yangilandi" : "Savol bankka qo'shildi" });
      setDialogOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Savol saqlanmadi", description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await teacherPortalApi.deleteQuestion(id);
      await refetch();
      toast({ title: "Savol o'chirildi" });
    } catch (e) {
      toast({ variant: "destructive", title: "Savol o'chirilmadi", description: (e as Error).message });
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Savollar banki</h1>
          <p className="text-muted-foreground">Kursga bog'langan va serverda baholanadigan savollar</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Savol qo'shish</Button>
      </div>

      <div className="grid md:grid-cols-[1fr_260px] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Savol yoki kurs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kurslar</SelectItem>
            {courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card className="border-destructive/50"><CardContent className="py-6 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
          <p>Ma'lumotlarni yuklab bo'lmadi</p>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button>
        </CardContent></Card>
      )}
      {!error && !isLoading && filtered.length === 0 && <p className="text-center text-muted-foreground py-10">Savol topilmadi</p>}

      <div className="space-y-3">
        {filtered.map((question) => (
          <Card key={question.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <FileQuestion className="h-5 w-5 mt-1 text-muted-foreground" />
                  <div><CardTitle className="text-base">{question.text}</CardTitle><p className="text-xs text-muted-foreground mt-1">{question.courseTitle}</p></div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(question)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(question.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{TYPE_LABEL[question.type]}</Badge>
              <Badge className={DIFFICULTY[question.difficulty].cls}>{DIFFICULTY[question.difficulty].label}</Badge>
              <Badge variant="outline">{question.points} ball</Badge>
              <span className="text-muted-foreground">To'g'ri javob: <strong>{question.correctAnswer}</strong></span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle><DialogDescription>To'g'ri javob faqat teacher API orqali ko'rinadi.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Kurs</Label><Select value={form.courseId} onValueChange={(v) => set("courseId", v)} disabled={!!editing}><SelectTrigger><SelectValue placeholder="Kursni tanlang" /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Savol matni</Label><Textarea value={form.text} onChange={(e) => set("text", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Turi</Label><Select value={form.type} onValueChange={(v) => set("type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_LABEL).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Qiyinlik</Label><Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(DIFFICULTY).map(([key, value]) => <SelectItem key={key} value={key}>{value.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Ball</Label><Input type="number" min={1} max={1000} value={form.points} onChange={(e) => set("points", e.target.value)} /></div>
            </div>
            {form.type === "SINGLE_CHOICE" && <div><Label>Variantlar (har qatorda bittadan)</Label><Textarea rows={4} value={form.options} onChange={(e) => set("options", e.target.value)} /></div>}
            <div><Label>To'g'ri javob</Label>{form.type === "TRUE_FALSE" ? <Select value={form.correctAnswer} onValueChange={(v) => set("correctAnswer", v)}><SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger><SelectContent><SelectItem value="true">To'g'ri</SelectItem><SelectItem value="false">Noto'g'ri</SelectItem></SelectContent></Select> : <Input value={form.correctAnswer} onChange={(e) => set("correctAnswer", e.target.value)} />}</div>
            <div><Label>Izoh</Label><Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Bekor qilish</Button><Button onClick={save} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
