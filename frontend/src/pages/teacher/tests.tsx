import { useState } from "react";
import {
  FileQuestion, Plus, Search, Eye, Edit, Trash2,
  MoreHorizontal, Clock, Users, BarChart3, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface Test {
  id: number;
  title: string;
  course: string;
  group: string;
  questions: number;
  duration: number;
  attempts: number;
  maxAttempts: number;
  avgScore: number;
  passRate: number;
  status: "active" | "draft" | "closed";
  category: "quiz" | "midterm" | "final" | "practice";
}

const TESTS: Test[] = [
  { id: 1, title: "JS Kirish testi",            course: "JavaScript Asoslari", group: "CS-22-01", questions: 20, duration: 30, attempts: 42, maxAttempts: 45, avgScore: 78, passRate: 88, status: "closed",  category: "quiz"     },
  { id: 2, title: "Oraliq nazorat — Funksiyalar", course: "JavaScript Asoslari", group: "CS-22-01", questions: 40, duration: 60, attempts: 30, maxAttempts: 45, avgScore: 74, passRate: 80, status: "closed",  category: "midterm"  },
  { id: 3, title: "React Hooks testi",           course: "React Development",   group: "CS-22-02", questions: 25, duration: 40, attempts: 20, maxAttempts: 32, avgScore: 82, passRate: 92, status: "active",  category: "quiz"     },
  { id: 4, title: "Node.js Amaliy test",         course: "Node.js Backend",     group: "CS-21-03", questions: 30, duration: 45, attempts: 5,  maxAttempts: 28, avgScore: 0,  passRate: 0,  status: "active",  category: "practice" },
  { id: 5, title: "TypeScript Yakuniy imtihon",  course: "TypeScript Advanced", group: "CS-22-04", questions: 60, duration: 90, attempts: 0,  maxAttempts: 51, avgScore: 0,  passRate: 0,  status: "draft",   category: "final"    },
];

const CAT_META: Record<string, { label: string; cls: string }> = {
  quiz:     { label: "Quiz",         cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  midterm:  { label: "Oraliq",       cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  final:    { label: "Yakuniy",      cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300"    },
  practice: { label: "Amaliy",       cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Faol",      cls: "bg-green-100 text-green-800" },
  draft:  { label: "Qoralama",  cls: "bg-slate-100 text-slate-600" },
  closed: { label: "Yopilgan",  cls: "bg-red-100   text-red-800"   },
};

export function TeacherTests({ openCreate = false }: { openCreate?: boolean }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(openCreate);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", course: "", category: "quiz", questions: "20", duration: "30", shuffleQ: true, showResult: true });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = TESTS.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.course.toLowerCase().includes(q);
  });

  const stats = {
    total:   TESTS.length,
    active:  TESTS.filter((t) => t.status === "active").length,
    avgPass: Math.round(TESTS.filter((t) => t.passRate > 0).reduce((s, t) => s + t.passRate, 0) / TESTS.filter((t) => t.passRate > 0).length || 0),
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Test nomi majburiy" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "Test yaratildi", description: form.title });
    setCreateOpen(false);
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testlar</h1>
          <p className="text-muted-foreground">Kurs testlari va imtihonlari boshqaruvi</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />Test yaratish
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Jami testlar",    value: stats.total,          cls: "" },
          { label: "Faol",            value: stats.active,         cls: "text-green-600" },
          { label: "O'rtacha o'tish", value: `${stats.avgPass}%`,  cls: "text-blue-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Test yoki kurs nomi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="space-y-3">
        {filtered.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileQuestion className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base leading-tight">{t.title}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{t.course} · {t.group}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={CAT_META[t.category].cls + " text-xs"}>{CAT_META[t.category].label}</Badge>
                  <Badge className={STATUS_META[t.status].cls + " text-xs"}>{STATUS_META[t.status].label}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" />Natijalar</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" />Tahrirlash</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-4 w-4" />O'chirish</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5" />{t.questions} savol</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t.duration} daqiqa</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t.attempts}/{t.maxAttempts} topshirdi</span>
              </div>
              {t.attempts > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>O'tish darajasi</span>
                    <span className="font-semibold text-green-600">{t.passRate}%</span>
                  </div>
                  <Progress value={t.passRate} className="h-1.5" />
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />O'rtacha ball: {t.avgScore}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi Test</DialogTitle>
            <DialogDescription>Test sozlamalarini kiriting</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Test nomi <span className="text-destructive">*</span></Label>
              <Input placeholder="Masalan: JS Oraliq nazorat" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kategoriya</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CAT_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Savollar soni</Label>
                <Input type="number" value={form.questions} onChange={(e) => set("questions", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vaqt (daqiqa)</Label>
              <Input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label>Savollarni aralashtirib berish</Label>
                <Switch checked={form.shuffleQ} onCheckedChange={(v) => set("shuffleQ", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Natijani darhol ko'rsatish</Label>
                <Switch checked={form.showResult} onCheckedChange={(v) => set("showResult", v)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Yaratilmoqda..." : "Test yaratish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}