import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Search, CheckCircle2, Clock, FileText,
  Download, Star, MessageSquare, Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

interface Submission {
  id: number;
  student: string;
  group: string;
  submittedAt: string;
  file: string;
  size: string;
  status: "pending" | "graded" | "late";
  score?: number;
  feedback?: string;
}

const MOCK: Submission[] = [
  { id: 1,  student: "Alisher Karimov",  group: "CS-22-01", submittedAt: "2025-06-18 14:32", file: "alisher_loyiha.zip",   size: "2.3 MB", status: "pending" },
  { id: 2,  student: "Malika Tosheva",   group: "CS-22-01", submittedAt: "2025-06-18 16:10", file: "malika_todo.zip",      size: "1.8 MB", status: "graded",  score: 88, feedback: "Juda yaxshi loyiha!"       },
  { id: 3,  student: "Bobur Rahimov",    group: "CS-22-01", submittedAt: "2025-06-18 23:55", file: "bobur_project.zip",   size: "3.1 MB", status: "late"    },
  { id: 4,  student: "Dilnoza Yusupova", group: "CS-22-01", submittedAt: "2025-06-17 09:00", file: "dilnoza_todo.zip",    size: "2.0 MB", status: "graded",  score: 95, feedback: "A'lo darajada!"             },
  { id: 5,  student: "Jasur Mirzayev",   group: "CS-22-01", submittedAt: "2025-06-18 11:45", file: "jasur_work.zip",      size: "1.5 MB", status: "pending" },
  { id: 6,  student: "Nodira Saidova",   group: "CS-22-01", submittedAt: "2025-06-18 13:20", file: "nodira_proj.zip",     size: "2.7 MB", status: "pending" },
  { id: 7,  student: "Sarvar Umarov",    group: "CS-22-01", submittedAt: "2025-06-18 10:05", file: "sarvar_todo_app.zip", size: "1.9 MB", status: "graded",  score: 72, feedback: "Yaxshi, lekin tezkor emas." },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Kutilmoqda",  cls: "bg-orange-100 text-orange-800" },
  graded:  { label: "Baholandi",   cls: "bg-green-100  text-green-800"  },
  late:    { label: "Kechikkan",   cls: "bg-red-100    text-red-800"    },
};

const ASSIGNMENT_TITLES: Record<string, string> = {
  "1": "JavaScript Loyiha: To-do ilova",
  "2": "React Component kutubxona",
  "3": "Node.js REST API yaratish",
};

export function TeacherSubmissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [grading, setGrading] = useState<Submission | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const title = ASSIGNMENT_TITLES[id ?? "1"] ?? "Topshiriq";

  const filtered = MOCK.filter((s) => {
    const t = search.toLowerCase();
    return (
      (!t || s.student.toLowerCase().includes(t)) &&
      (filter === "all" || s.status === filter)
    );
  });

  const stats = {
    total:   MOCK.length,
    pending: MOCK.filter((s) => s.status === "pending").length,
    graded:  MOCK.filter((s) => s.status === "graded").length,
    late:    MOCK.filter((s) => s.status === "late").length,
  };

  const openGrade = (s: Submission) => {
    setGrading(s);
    setScore(s.score?.toString() ?? "");
    setFeedback(s.feedback ?? "");
  };

  const handleGrade = async () => {
    if (!score) { toast({ variant: "destructive", title: "Ball kiriting" }); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    toast({ title: "Baholandi", description: `${grading?.student} — ${score} ball` });
    setGrading(null);
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher/assignments")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">Talabalar topshiriqlari</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Jami",         value: stats.total,   cls: "" },
          { label: "Kutilmoqda",   value: stats.pending, cls: "text-orange-600" },
          { label: "Baholandi",    value: stats.graded,  cls: "text-green-600" },
          { label: "Kechikkan",    value: stats.late,    cls: "text-red-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Talaba ismi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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

      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{s.student}</span>
                  <span className="text-xs text-muted-foreground">{s.group}</span>
                  <Badge className={STATUS_META[s.status].cls + " text-xs"}>{STATUS_META[s.status].label}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{s.file} ({s.size})</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.submittedAt}</span>
                  {s.score !== undefined && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <Star className="h-3 w-3" />{s.score} ball
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <Download className="h-3.5 w-3.5" />Yuklab olish
                </Button>
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
            <DialogTitle>Baholash — {grading?.student}</DialogTitle>
            <DialogDescription>{grading?.file}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Ball (0–100)</Label>
              <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} placeholder="Masalan: 85" />
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