import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Plus, Search, Users, BarChart3, Eye,
  Edit, Trash2, MoreHorizontal, TrendingUp, Clock,
  AlertTriangle, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { qk } from "@/lib/query-keys";
import { teacherPortalApi, type TeacherCourse } from "@/services/api/teacher-portal-api";


const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:    { label: "Faol",       cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
  draft:     { label: "Qoralama",   cls: "bg-slate-100  text-slate-600  dark:bg-slate-800/40  dark:text-slate-400"  },
  archived:  { label: "Arxivlangan",cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  completed: { label: "Yakunlangan",cls: "bg-gray-100   text-gray-800   dark:bg-gray-800/40   dark:text-gray-300"   },
};

export function TeacherCourses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: courses = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.courses(),
    queryFn: teacherPortalApi.getCourses,
    staleTime: 60_000,
  });

  const filtered = courses.filter((c) => {
    const t = search.toLowerCase();
    return (
      (!t || c.title.toLowerCase().includes(t)) &&
      (statusFilter === "all" || c.status === statusFilter)
    );
  });

  const stats = {
    active:   courses.filter((c) => c.status === "active").length,
    students: courses.filter((c) => c.status === "active").reduce((s, c) => s + c.students, 0),
    avgScore: (() => { const scored = courses.filter(c => (c.avgScore ?? 0) > 0); return scored.length ? Math.round(scored.reduce((s, c) => s + (c.avgScore ?? 0), 0) / scored.length) : 0; })(),
  };

  if (isLoading) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <Card key={i}><CardContent className="pt-6 space-y-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-16 w-full" /></CardContent></Card>)}
      </div>
    </div>
  );

  if (error) return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Mening Kurslarim</h1>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Mening Kurslarim</h1>
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
                      <CardDescription className="text-xs mt-0.5">{course.groupName}</CardDescription>
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
                    <div className="font-semibold">—</div>
                    <div className="text-muted-foreground">Modul</div>
                  </div>
                  <div>
                    <div className="font-semibold">—</div>
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
                    {(course.avgScore ?? 0) > 0 && (
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
