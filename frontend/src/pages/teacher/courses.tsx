import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Plus, Search, Users, BarChart3, Eye,
  Edit, Trash2, MoreHorizontal, TrendingUp, Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  students: number;
  modules: number;
  lessons: number;
  progress: number;
  avgScore: number;
  status: "active" | "draft" | "archived";
  startDate: string;
  endDate: string;
  group: string;
}

const COURSES: Course[] = [
  { id: 1, title: "JavaScript Asoslari",    description: "JavaScript dasturlash tilining asoslarini o'rganish",      subject: "Dasturlash",        students: 45, modules: 8,  lessons: 32, progress: 85, avgScore: 88, status: "active",   startDate: "2025-02-10", endDate: "2025-06-30", group: "CS-22-01" },
  { id: 2, title: "React Development",      description: "React.js bilan zamonaviy web ilovalar yaratish",            subject: "Web dasturlash",    students: 32, modules: 6,  lessons: 24, progress: 72, avgScore: 82, status: "active",   startDate: "2025-03-01", endDate: "2025-07-31", group: "CS-22-02" },
  { id: 3, title: "Node.js Backend",        description: "Node.js va Express yordamida backend API yaratish",         subject: "Backend",           students: 28, modules: 5,  lessons: 20, progress: 60, avgScore: 75, status: "active",   startDate: "2025-03-15", endDate: "2025-08-31", group: "CS-21-03" },
  { id: 4, title: "TypeScript Advanced",    description: "TypeScript'ning ilg'or xususiyatlarini o'rganish",          subject: "Dasturlash",        students: 51, modules: 7,  lessons: 28, progress: 45, avgScore: 79, status: "active",   startDate: "2025-04-01", endDate: "2025-09-30", group: "CS-22-04" },
  { id: 5, title: "Python Asoslari",        description: "Python dasturlash tilini noldan o'rganish",                 subject: "Dasturlash",        students: 0,  modules: 6,  lessons: 24, progress: 0,  avgScore: 0,  status: "draft",    startDate: "2025-07-01", endDate: "2025-12-31", group: "CS-23-01" },
  { id: 6, title: "HTML/CSS Asoslari",      description: "Web dizayn asoslari — HTML va CSS bilan ishlash",           subject: "Web dasturlash",    students: 38, modules: 4,  lessons: 16, progress: 100,avgScore: 91, status: "archived", startDate: "2024-09-01", endDate: "2025-01-31", group: "CS-21-01" },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:   { label: "Faol",       cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
  draft:    { label: "Qoralama",   cls: "bg-slate-100  text-slate-600  dark:bg-slate-800/40  dark:text-slate-400"  },
  archived: { label: "Arxivlangan",cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
};

export function TeacherCourses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = COURSES.filter((c) => {
    const t = search.toLowerCase();
    return (
      (!t || c.title.toLowerCase().includes(t) || c.subject.toLowerCase().includes(t)) &&
      (statusFilter === "all" || c.status === statusFilter)
    );
  });

  const stats = {
    active:   COURSES.filter((c) => c.status === "active").length,
    students: COURSES.filter((c) => c.status === "active").reduce((s, c) => s + c.students, 0),
    avgScore: Math.round(COURSES.filter((c) => c.avgScore > 0).reduce((s, c) => s + c.avgScore, 0) / COURSES.filter((c) => c.avgScore > 0).length),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mening Kurslarim</h1>
          <p className="text-muted-foreground">Barcha dars bergan va yaratgan kurslar</p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/teacher/courses/create")}>
          <Plus className="h-4 w-4" />Yangi kurs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Faol kurslar",   value: stats.active,   cls: "text-green-600" },
          { label: "Jami talabalar", value: stats.students,  cls: "text-blue-600"  },
          { label: "O'rtacha ball",  value: `${stats.avgScore}%`, cls: "text-yellow-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Kurs yoki fan nomi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Holat" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            <SelectItem value="active">Faol</SelectItem>
            <SelectItem value="draft">Qoralama</SelectItem>
            <SelectItem value="archived">Arxiv</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">Kurs topilmadi</div>
        )}
        {filtered.map((course) => {
          const meta = STATUS_META[course.status];
          return (
            <Card key={course.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0">
                      <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">{course.title}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{course.subject} · {course.group}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className={meta.cls + " text-xs"}>{meta.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/teacher/courses/${course.id}`)} className="gap-2">
                          <Eye className="h-4 w-4" />Ko'rish
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
              <CardContent className="flex-1 space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-semibold">{course.modules}</div>
                    <div className="text-muted-foreground">Modul</div>
                  </div>
                  <div>
                    <div className="font-semibold">{course.lessons}</div>
                    <div className="text-muted-foreground">Dars</div>
                  </div>
                  <div>
                    <div className="font-semibold flex items-center justify-center gap-0.5">
                      <Users className="h-3 w-3" />{course.students}
                    </div>
                    <div className="text-muted-foreground">Talaba</div>
                  </div>
                </div>

                {course.status !== "draft" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-1.5" />
                    {course.avgScore > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        O'rtacha: {course.avgScore}%
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-8"
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />Ko'rish
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs h-8"
                    onClick={() => navigate(`/teacher/courses/${course.id}/contents`)}
                  >
                    Kontent
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
