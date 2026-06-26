import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardList, Plus, Search, Eye, Edit, Trash2,
  MoreHorizontal, Clock, Users, CheckCircle2, AlertCircle,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";

const TYPE_META: Record<string, string> = {
  homework: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  project:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  lab:      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  practice: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};
const TYPE_LABEL: Record<string, string> = {
  homework: "Uy vazifasi", project: "Loyiha", lab: "Laboratoriya", practice: "Amaliyot",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "Faol",     cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  draft:  { label: "Qoralama", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400" },
  closed: { label: "Yopilgan", cls: "bg-red-100   text-red-800   dark:bg-red-900/30   dark:text-red-300"   },
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("uz-Latn", { day: "2-digit", month: "short" });
}

export function TeacherAssignments({ openCreate = false }: { openCreate?: boolean }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(openCreate);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", course: "", dueDate: "", maxScore: "100", description: "", type: "homework",
  });

  const { data: assignments = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.assignments(),
    queryFn: teacherPortalApi.getAssignments,
    staleTime: 60_000,
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = assignments.filter((a) => {
    const t = search.toLowerCase();
    return !t || a.title.toLowerCase().includes(t) || a.courseTitle.toLowerCase().includes(t);
  });

  const stats = {
    total:   assignments.length,
    pending: assignments.reduce((s, a) => s + a.pendingGrade, 0),
    graded:  assignments.reduce((s, a) => s + (a.totalSubmissions - a.pendingGrade), 0),
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { toast({ variant: "destructive", title: "Nomi majburiy" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast({ title: "Topshiriq yaratildi", description: form.title });
    setCreateOpen(false);
    setSaving(false);
  };

  if (isLoading) return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16" /></CardContent></Card>)}
      </div>
      <div className="space-y-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Topshiriqlar</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Topshiriqlar</h1>
          <p className="text-muted-foreground">Kurslar bo'yicha topshiriqlar boshqaruvi</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />Topshiriq yaratish
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Jami",           value: stats.total,   cls: "" },
          { label: "Tekshirilmagan", value: stats.pending, cls: "text-orange-600" },
          { label: "Baholangan",     value: stats.graded,  cls: "text-green-600" },
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
          placeholder="Topshiriq yoki kurs nomi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Topshiriq topilmadi</p>
      )}

      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id} className={a.pendingGrade > 0 ? "border-orange-200 dark:border-orange-900/50" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ClipboardList className={`h-5 w-5 mt-0.5 shrink-0 ${a.pendingGrade > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                  <div>
                    <CardTitle className="text-base leading-tight">{a.title}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{a.courseTitle}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={STATUS_META[a.status].cls + " text-xs"}>{STATUS_META[a.status].label}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => navigate(`/teacher/assignments/${a.id}/submissions`)}
                        className="gap-2"
                      >
                        <Eye className="h-4 w-4" />Topshiriqlarni ko'rish
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Edit className="h-4 w-4" />Tahrirlash
                      </DropdownMenuItem>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />Muddat: {fmtDate(a.dueDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />{a.totalSubmissions} topshirdi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {a.pendingGrade > 0 && (
                    <Badge className="bg-orange-100 text-orange-800 gap-1 text-xs">
                      <AlertCircle className="h-3 w-3" />{a.pendingGrade} tekshirilmagan
                    </Badge>
                  )}
                  {a.pendingGrade === 0 && a.totalSubmissions > 0 && (
                    <Badge className="bg-green-100 text-green-800 gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" />Baholandi
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate(`/teacher/assignments/${a.id}/submissions`)}
                  >
                    <Eye className="h-3.5 w-3.5" />Ko'rish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yangi Topshiriq</DialogTitle>
            <DialogDescription>Talabalar uchun topshiriq yarating</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nomi <span className="text-destructive">*</span></Label>
              <Input placeholder="Topshiriq nomi" value={form.title} onChange={(e) => set("title", e.target.value)} />
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
                <Label>Maksimal ball</Label>
                <Input type="number" value={form.maxScore} onChange={(e) => set("maxScore", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Muddat</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tavsif</Label>
              <Textarea
                placeholder="Topshiriq haqida batafsil..."
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Bekor qilish</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Yaratilmoqda..." : "Yaratish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
