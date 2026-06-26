import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileQuestion, Plus, Search, Eye, Edit, Trash2,
  MoreHorizontal, Clock, Users, BarChart3,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:    { label: "Faol",      cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
  upcoming:  { label: "Rejalangan",cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  completed: { label: "Tugagan",   cls: "bg-slate-100  text-slate-600  dark:bg-slate-800/40  dark:text-slate-400"  },
  draft:     { label: "Qoralama",  cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
};

const CAT_META: Record<string, { label: string; cls: string }> = {
  quiz:     { label: "Quiz",    cls: "bg-blue-100   text-blue-800"   },
  midterm:  { label: "Oraliq", cls: "bg-orange-100 text-orange-800" },
  final:    { label: "Yakuniy",cls: "bg-red-100    text-red-800"    },
  practice: { label: "Amaliy", cls: "bg-green-100  text-green-800"  },
};

export function TeacherTests({ openCreate = false }: { openCreate?: boolean }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(openCreate);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "quiz", questions: "20", duration: "30",
    shuffleQ: true, showResult: true,
  });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const { data: tests = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.tests(),
    queryFn: teacherPortalApi.getTests,
    staleTime: 60_000,
  });

  const filtered = tests.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.courseTitle.toLowerCase().includes(q);
  });

  const stats = {
    total:  tests.length,
    active: tests.filter((t) => t.status === "active").length,
    avgScore: (() => {
      const scored = tests.filter(t => (t.avgScore ?? 0) > 0);
      return scored.length ? Math.round(scored.reduce((s, t) => s + (t.avgScore ?? 0), 0) / scored.length) : 0;
    })(),
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Test nomi majburiy" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "Test yaratildi", description: form.title });
    setCreateOpen(false);
    setSaving(false);
  };

  if (isLoading) return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16" /></CardContent></Card>)}
      </div>
      <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
    </div>
  );

  if (error) return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Testlar</h1>
      <Card className="border-destructive/50">
        <CardContent className="pt-6 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-destructive font-medium">Ma'lumotlarni yuklab bo'lmadi</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Qayta urinish</Button>
        </CardContent>
      </Card>
    </div>
  );

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
          { label: "O'rtacha ball",   value: `${stats.avgScore}%`, cls: "text-blue-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Test yoki kurs nomi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Test topilmadi</p>
      )}

      <div className="space-y-3">
        {filtered.map((t) => {
          const sm = STATUS_META[t.status] ?? STATUS_META['draft'];
          return (
            <Card key={t.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FileQuestion className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base leading-tight">{t.title}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{t.courseTitle}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={sm.cls + " text-xs"}>{sm.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" />Natijalar</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><Edit className="h-4 w-4" />Tahrirlash</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4" />O'chirish
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileQuestion className="h-3.5 w-3.5" />{t.questions} savol
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />{t.duration} daqiqa
                  </span>
                  {t.participants !== undefined && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />{t.participants} ishtirokchi
                    </span>
                  )}
                  {(t.avgScore ?? 0) > 0 && (
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5" />O'rtacha: {t.avgScore}%
                    </span>
                  )}
                  <span className="text-muted-foreground">{t.date}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
              <Input
                placeholder="Masalan: JS Oraliq nazorat"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
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
