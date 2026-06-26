import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Search, Clock, Star, Eye, AlertTriangle, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi, type TeacherSubmission } from "@/services/api/teacher-portal-api";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Kutilmoqda", cls: "bg-orange-100 text-orange-800" },
  graded:  { label: "Baholandi",  cls: "bg-green-100  text-green-800"  },
  late:    { label: "Kechikkan",  cls: "bg-red-100    text-red-800"    },
};

export function TeacherSubmissions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [grading, setGrading] = useState<TeacherSubmission | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: submissions = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.submissions(),
    queryFn: teacherPortalApi.getSubmissions,
    staleTime: 60_000,
  });

  const filtered = submissions.filter((s) => {
    const t = search.toLowerCase();
    return (
      (!t || s.studentName.toLowerCase().includes(t) || s.assignmentTitle.toLowerCase().includes(t)) &&
      (filter === "all" || s.status === filter)
    );
  });

  const stats = {
    total:   submissions.length,
    pending: submissions.filter((s) => s.status === "pending").length,
    graded:  submissions.filter((s) => s.status === "graded").length,
    late:    submissions.filter((s) => s.status === "late").length,
  };

  const openGrade = (s: TeacherSubmission) => {
    setGrading(s);
    setScore(s.score?.toString() ?? "");
    setFeedback("");
  };

  const handleGrade = async () => {
    if (!score) { toast({ variant: "destructive", title: "Ball kiriting" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "Baholandi", description: `${grading?.studentName} — ${score} ball` });
    setGrading(null);
    setSaving(false);
  };

  if (isLoading) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16" /></CardContent></Card>)}
      </div>
      <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
    </div>
  );

  if (error) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Topshiriqlar</h1>
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
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher/assignments")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold leading-tight">Talabalar topshiriqlari</h1>
          <p className="text-muted-foreground text-sm">Barcha kurslar bo'yicha</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Jami",       value: stats.total,   cls: "" },
          { label: "Kutilmoqda", value: stats.pending, cls: "text-orange-600" },
          { label: "Baholandi",  value: stats.graded,  cls: "text-green-600" },
          { label: "Kechikkan",  value: stats.late,    cls: "text-red-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Talaba yoki topshiriq nomi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="pending">Kutilmoqda</SelectItem>
            <SelectItem value="graded">Baholandi</SelectItem>
            <SelectItem value="late">Kechikkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Topshiriq topilmadi</p>
      )}

      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{s.studentName}</span>
                  <span className="text-xs text-muted-foreground">{s.assignmentTitle}</span>
                  <Badge className={STATUS_META[s.status].cls + " text-xs"}>
                    {STATUS_META[s.status].label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="text-muted-foreground">{s.courseTitle}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />{s.submittedAt}
                  </span>
                  {s.score !== undefined && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <Star className="h-3 w-3" />{s.score} ball
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {s.status !== "graded" ? (
                  <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => openGrade(s)}>
                    <Star className="h-3.5 w-3.5" />Baholash
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => openGrade(s)}>
                    <Eye className="h-3.5 w-3.5" />Ko'rish
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!grading} onOpenChange={(o) => { if (!o) setGrading(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baholash — {grading?.studentName}</DialogTitle>
            <DialogDescription>{grading?.assignmentTitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Ball (0–100)</Label>
              <Input
                type="number" min={0} max={100}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Masalan: 85"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Izoh</Label>
              <Textarea rows={3} placeholder="Talabaga izoh..." value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrading(null)}>Yopish</Button>
            <Button onClick={handleGrade} disabled={saving}>{saving ? "Saqlanmoqda..." : "Baholash"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
