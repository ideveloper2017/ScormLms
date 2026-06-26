import { useState } from "react";
import {
  FileQuestion, Plus, Search, Edit, Trash2,
  MoreHorizontal, CheckCircle2, Circle, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
  type: "single" | "multiple" | "truefalse" | "text";
  difficulty: "easy" | "medium" | "hard";
  subject: string;
  options?: string[];
  correct?: number | number[];
  points: number;
}

const QUESTIONS: Question[] = [
  { id: 1,  text: "JavaScript'da o'zgaruvchi e'lon qilish uchun qaysi kalit so'z ishlatiladi?",   type: "single",   difficulty: "easy",   subject: "JavaScript", options: ["var", "let", "const", "Hammasi to'g'ri"], correct: 3, points: 1 },
  { id: 2,  text: "Quyidagilardan qaysilari JavaScript'dagi ma'lumot turlari?",                   type: "multiple", difficulty: "easy",   subject: "JavaScript", options: ["String", "Number", "Boolean", "Integer"],  correct: [0,1,2], points: 2 },
  { id: 3,  text: "Arrow function va oddiy function bir xil `this` kontekstiga ega.",              type: "truefalse",difficulty: "medium", subject: "JavaScript", options: ["To'g'ri", "Noto'g'ri"],                    correct: 1, points: 1 },
  { id: 4,  text: "React'da komponent qaysi usul yordamida qayta render qilinadi?",               type: "single",   difficulty: "medium", subject: "React",      options: ["setState", "useState", "forceUpdate", "render"], correct: 1, points: 1 },
  { id: 5,  text: "Node.js ning asosiy xususiyati nima?",                                          type: "text",     difficulty: "hard",   subject: "Node.js",   points: 3 },
  { id: 6,  text: "TypeScript'da `interface` va `type` ning farqi nima?",                          type: "text",     difficulty: "hard",   subject: "TypeScript", points: 3 },
  { id: 7,  text: "Promise va async/await o'rtasidagi farq nima?",                                 type: "single",   difficulty: "medium", subject: "JavaScript", options: ["Sintaksis farqi bor, ammo bir xil ishlaydi", "Promise ko'proq imkoniyat beradi", "async/await ko'proq imkoniyat beradi", "Farq yo'q"], correct: 0, points: 2 },
  { id: 8,  text: "REST API'da HTTP DELETE metodi qanday vazifani bajaradi?",                      type: "single",   difficulty: "easy",   subject: "Node.js",   options: ["Ma'lumot olish", "Ma'lumot yaratish", "Ma'lumot o'chirish", "Ma'lumot yangilash"], correct: 2, points: 1 },
];

const DIFF_META: Record<string, { label: string; cls: string }> = {
  easy:   { label: "Oson",     cls: "bg-green-100  text-green-800"  },
  medium: { label: "O'rtacha", cls: "bg-yellow-100 text-yellow-800" },
  hard:   { label: "Qiyin",    cls: "bg-red-100    text-red-800"    },
};

const TYPE_LABEL: Record<string, string> = {
  single:    "Bir javob",
  multiple:  "Ko'p javob",
  truefalse: "Ha/Yo'q",
  text:      "Matnli",
};

const SUBJECTS = ["JavaScript", "React", "Node.js", "TypeScript", "Barchasi"];

export function TeacherQuestions() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Barchasi");
  const [diff, setDiff] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ text: "", type: "single", difficulty: "easy", subject: "JavaScript", points: "1" });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = QUESTIONS.filter((q) => {
    const t = search.toLowerCase();
    return (
      (!t || q.text.toLowerCase().includes(t)) &&
      (subject === "Barchasi" || q.subject === subject) &&
      (diff === "all" || q.difficulty === diff)
    );
  });

  const bySubject: Record<string, number> = {};
  QUESTIONS.forEach((q) => { bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1; });

  const handleCreate = async () => {
    if (!form.text.trim()) { toast({ variant: "destructive", title: "Savol matni majburiy" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "Savol qo'shildi" });
    setCreateOpen(false);
    setSaving(false);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="py-3 px-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Savol banki xizmati hali real API ga ulanmagan. Ko'rsatilgan ma'lumotlar namunavirus.
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Savol banki</h1>
          <p className="text-muted-foreground">Testlar uchun savollar kutubxonasi</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />Savol qo'shish
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(bySubject).map(([subj, cnt]) => (
          <Card key={subj} className="cursor-pointer hover:bg-muted/40 transition" onClick={() => setSubject(subj)}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{subj}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{cnt}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Savol matni..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={diff} onValueChange={setDiff}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha darajalar</SelectItem>
            {Object.entries(DIFF_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-1 w-6 h-6 text-xs font-bold text-muted-foreground shrink-0 mt-0.5">{i + 1}.</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug">{q.text}</p>
                  {q.options && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, idx) => {
                        const isCorrect = Array.isArray(q.correct) ? q.correct.includes(idx) : q.correct === idx;
                        return (
                          <div key={idx} className={`flex items-center gap-2 text-xs rounded p-1.5 ${isCorrect ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" : "text-muted-foreground"}`}>
                            {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={DIFF_META[q.difficulty].cls + " text-xs"}>{DIFF_META[q.difficulty].label}</Badge>
                    <Badge variant="outline" className="text-xs">{TYPE_LABEL[q.type]}</Badge>
                    <Badge variant="outline" className="text-xs">{q.subject}</Badge>
                    <span className="text-xs text-muted-foreground">{q.points} ball</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" />Tahrirlash</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />O'chirish</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi Savol</DialogTitle>
            <DialogDescription>Savol bank uchun yangi savol qo'shing</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Savol matni <span className="text-destructive">*</span></Label>
              <Textarea rows={3} placeholder="Savol matni..." value={form.text} onChange={(e) => set("text", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Turi</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Qiyinlik</Label>
                <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DIFF_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fan</Label>
                <Select value={form.subject} onValueChange={(v) => set("subject", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.filter((s) => s !== "Barchasi").map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ball</Label>
                <Input type="number" min={1} value={form.points} onChange={(e) => set("points", e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Qo'shilmoqda..." : "Qo'shish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}