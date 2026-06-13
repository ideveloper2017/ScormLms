import { useState } from "react";
import {
  ClipboardList, Clock, Upload, CheckCircle2, AlertCircle,
  Circle, Search, Filter, ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Assignment {
  id: number;
  title: string;
  course: string;
  description: string;
  dueDate: string;
  status: "pending" | "in-progress" | "submitted" | "graded" | "overdue";
  priority: "high" | "medium" | "low";
  maxScore: number;
  score?: number;
  fileRequired: boolean;
}

const ASSIGNMENTS: Assignment[] = [
  { id: 1, title: "JavaScript loyiha: To-do ilova", course: "Dasturlash asoslari", description: "React va TypeScript yordamida To-do ilovani yarating", dueDate: "2025-06-20", status: "in-progress", priority: "high", maxScore: 100, fileRequired: true },
  { id: 2, title: "SQL so'rovlar to'plami", course: "Ma'lumotlar bazasi", description: "50 ta SQL so'rovni bajarish va natijalarni taqdim etish", dueDate: "2025-06-18", status: "submitted", priority: "medium", maxScore: 50, fileRequired: true },
  { id: 3, title: "Algoritm tahlili", course: "Algoritmlar nazariyasi", description: "Berilgan algoritmlarning vaqt va xotira murakkabligini tahlil qiling", dueDate: "2025-06-15", status: "graded", priority: "high", maxScore: 80, score: 72, fileRequired: false },
  { id: 4, title: "Web sahifa dizayni", course: "Web dasturlash", description: "HTML/CSS yordamida responsiv web sahifa yarating", dueDate: "2025-06-25", status: "pending", priority: "medium", maxScore: 60, fileRequired: true },
  { id: 5, title: "Fizik laboratoriya hisoboti", course: "Fizika", description: "O'tkazilgan laboratoriya ishining hisobotini yozing", dueDate: "2025-06-10", status: "overdue", priority: "high", maxScore: 40, fileRequired: true },
  { id: 6, title: "Matematik isbot", course: "Matematik tahlil", description: "Berilgan teoremalarni isbotlang", dueDate: "2025-06-28", status: "pending", priority: "low", maxScore: 30, fileRequired: false },
  { id: 7, title: "Inglizcha esse", course: "Ingliz tili", description: "Sun'iy intellekt haqida 500 so'zli esse yozing", dueDate: "2025-06-22", status: "pending", priority: "medium", maxScore: 20, fileRequired: true },
];

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:     { label: "Kutilmoqda",   cls: "bg-slate-100  text-slate-600  dark:bg-slate-800/40  dark:text-slate-300",   icon: Circle       },
  "in-progress":{ label: "Bajarilmoqda", cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300",    icon: Clock        },
  submitted:   { label: "Topshirildi",  cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",  icon: Upload       },
  graded:      { label: "Baholandi",    cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300",   icon: CheckCircle2 },
  overdue:     { label: "Muddati o'tdi", cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300",     icon: AlertCircle  },
};

const PRIORITY_CLS: Record<string, string> = {
  high:   "bg-red-100    text-red-700   dark:bg-red-900/30   dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  low:    "bg-green-100  text-green-700 dark:bg-green-900/30  dark:text-green-300",
};
const PRIORITY_LABEL: Record<string, string> = { high: "Yuqori", medium: "O'rta", low: "Past" };

function daysLeft(dateStr: string) {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return diff;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("uz-Latn", { day: "2-digit", month: "short", year: "numeric" });
}

export function StudentAssignments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = ASSIGNMENTS.filter((a) => {
    const t = search.toLowerCase();
    const matchSearch = !t || a.title.toLowerCase().includes(t) || a.course.toLowerCase().includes(t);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:    ASSIGNMENTS.length,
    pending:  ASSIGNMENTS.filter((a) => a.status === "pending" || a.status === "in-progress").length,
    overdue:  ASSIGNMENTS.filter((a) => a.status === "overdue").length,
    done:     ASSIGNMENTS.filter((a) => a.status === "submitted" || a.status === "graded").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Topshiriqlar</h1>
          <p className="text-muted-foreground">Barcha kurslar bo'yicha topshiriqlar</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jami", value: stats.total, cls: "" },
          { label: "Kutilmoqda", value: stats.pending, cls: "text-blue-600" },
          { label: "Muddati o'tdi", value: stats.overdue, cls: "text-red-600" },
          { label: "Bajarildi", value: stats.done, cls: "text-green-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Topshiriq yoki kurs nomi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === "all" ? "Barcha holat" : STATUS_META[statusFilter]?.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>Barcha holat</DropdownMenuItem>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <DropdownMenuItem key={k} onClick={() => setStatusFilter(k)}>{v.label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Assignment list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Topshiriq topilmadi</div>
        )}
        {filtered.map((a) => {
          const meta = STATUS_META[a.status];
          const Icon = meta.icon;
          const days = daysLeft(a.dueDate);
          const isOverdue = a.status === "overdue";

          return (
            <Card key={a.id} className={isOverdue ? "border-red-200 dark:border-red-900/50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`} />
                    <div>
                      <CardTitle className="text-base leading-tight">{a.title}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{a.course}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={PRIORITY_CLS[a.priority] + " text-xs"}>{PRIORITY_LABEL[a.priority]}</Badge>
                    <Badge className={meta.cls + " text-xs"}>{meta.label}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{a.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Muddat: {fmtDate(a.dueDate)}
                    </span>
                    {!isOverdue && a.status !== "graded" && a.status !== "submitted" && (
                      <span className={days <= 2 ? "text-red-600 font-medium" : days <= 5 ? "text-yellow-600" : ""}>
                        {days > 0 ? `${days} kun qoldi` : "Bugun!"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.status === "graded" && a.score != null && (
                      <span className="text-sm font-semibold">
                        {a.score}/{a.maxScore} ball
                        <span className={`ml-1 ${a.score / a.maxScore >= 0.9 ? "text-green-600" : a.score / a.maxScore >= 0.75 ? "text-blue-600" : "text-red-600"}`}>
                          ({Math.round(a.score / a.maxScore * 100)}%)
                        </span>
                      </span>
                    )}
                    {(a.status === "pending" || a.status === "in-progress") && (
                      <Button size="sm" className="gap-1.5 h-8">
                        {a.fileRequired ? <><Upload className="h-3.5 w-3.5" />Topshirish</> : <>Ochish</>}
                      </Button>
                    )}
                  </div>
                </div>
                {a.status === "in-progress" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Bajarilish</span><span>65%</span>
                    </div>
                    <Progress value={65} className="h-1.5" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}