import { useQuery } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Users, ClipboardList, FileQuestion, MessageCircle,
  CalendarDays, TrendingUp, CheckCircle2, ArrowRight, Star,
  AlertTriangle, RefreshCw, Plus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";

function DashSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-7 sm:h-9 w-48 sm:w-72" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[1,2,3,4,5,6].map(i => <Card key={i}><CardContent className="pt-3 sm:pt-4"><Skeleton className="h-7 sm:h-8 w-10 sm:w-12" /></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1,2].map(i => <Card key={i}><CardContent className="pt-4 sm:pt-6 space-y-3">{[1,2,3].map(j => <Skeleton key={j} className="h-14 w-full" />)}</CardContent></Card>)}
      </div>
    </div>
  );
}

export function TeacherDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: qk.teacher.stats(),
    queryFn: teacherPortalApi.getDashboardStats,
    staleTime: 60_000,
  });

  const { data: schedule = [], isLoading: scheduleLoading } = useQuery({
    queryKey: qk.teacher.todaySchedule(),
    queryFn: teacherPortalApi.getTodaySchedule,
    staleTime: 60_000,
  });

  const { data: submissions = [], isLoading: subsLoading } = useQuery({
    queryKey: qk.teacher.submissions(),
    queryFn: teacherPortalApi.getSubmissions,
    staleTime: 30_000,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: qk.teacher.courses(),
    queryFn: teacherPortalApi.getCourses,
    staleTime: 60_000,
  });

  const isLoading = statsLoading || scheduleLoading || subsLoading || coursesLoading;

  if (isLoading) return <DashSkeleton />;

  if (statsError) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">O'qituvchi Dashboard</h1>
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-destructive font-medium">Ma'lumotlarni yuklab bo'lmadi</p>
            <p className="text-sm text-muted-foreground">{(statsError as Error).message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const weeklyData = courses.slice(0, 5).map(c => ({
    day: c.title.slice(0, 8),
    progress: c.progress,
    students: c.students,
  }));

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">O'qituvchi Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Bugun, {new Date().toLocaleDateString("uz-Latn", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9" onClick={() => navigate("/teacher/courses/create")}>
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Yangi kurs
          </Button>
          <Button size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9" onClick={() => navigate("/teacher/assignments")}>
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Topshiriq
          </Button>
        </div>
      </div>

      {/* 6 ta metrik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: "Kurslar",            value: stats?.activeCourses ?? 0,       sub: `${stats?.totalStudents ?? 0} talaba`, icon: BookOpen,     cls: "text-blue-600",   href: "/teacher/courses"     },
          { label: "Tekshirilmagan",     value: stats?.pendingSubmissions ?? 0,  sub: "topshiriqlar",                        icon: ClipboardList, cls: "text-orange-600", href: "/teacher/assignments" },
          { label: "Bugungi darslar",    value: stats?.todayLessons ?? 0,        sub: "reja bo'yicha",                       icon: CalendarDays,  cls: "text-green-600",  href: "/teacher/attendance"  },
          { label: "Test natijalari",    value: `${stats?.avgTestScore ?? 0}%`,  sub: "o'rtacha ball",                       icon: FileQuestion,  cls: "text-purple-600", href: "/teacher/tests"       },
          { label: "Yangi topshiriqlar", value: stats?.newSubmissions ?? 0,      sub: "yangi",                               icon: TrendingUp,    cls: "text-teal-600",   href: "/teacher/students"    },
          { label: "Yangi xabarlar",     value: stats?.unreadMessages ?? 0,      sub: "o'qilmagan",                          icon: MessageCircle, cls: "text-red-600",    href: "/teacher/messages"    },
        ].map(({ label, value, sub, icon: Icon, cls, href }) => (
          <Card key={label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(href)}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${cls}`} />{label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-2xl font-bold ${cls}`}>{value}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asosiy grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bugungi darslar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-green-500" />Bugungi darslar
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate("/teacher/attendance")}>
                Davomat <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {schedule.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Bugun dars yo'q</p>
            ) : schedule.map(lesson => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className="text-center min-w-[70px]">
                  <div className="text-xs font-semibold">{lesson.startTime}</div>
                  <div className="text-xs text-muted-foreground">{lesson.endTime}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{lesson.subject}</div>
                  <div className="text-xs text-muted-foreground">{lesson.group} · {lesson.room}</div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-xs">{lesson.type}</Badge>
                  <div className="text-xs text-muted-foreground mt-0.5">{lesson.students} talaba</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Yangi topshiriqlar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-500" />
                Yangi topshiriqlar
                {pendingSubmissions.length > 0 && (
                  <Badge className="bg-orange-500 text-white text-xs">{pendingSubmissions.length}</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate("/teacher/assignments")}>
                Barchasi <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Topshiriqlar yo'q</p>
            ) : submissions.slice(0, 5).map(sub => (
              <div key={sub.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    {sub.studentName.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{sub.studentName}</div>
                  <div className="text-xs text-muted-foreground truncate">{sub.assignmentTitle} · {sub.courseTitle}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">{sub.submittedAt}</div>
                  {sub.status === "pending" ? (
                    <Badge className="bg-orange-100 text-orange-800 text-xs mt-0.5">Tekshirish</Badge>
                  ) : sub.status === "late" ? (
                    <Badge className="bg-red-100 text-red-800 text-xs mt-0.5">Kechikkan</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 text-xs mt-0.5">
                      <CheckCircle2 className="h-3 w-3 mr-0.5" />Baholandi
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Kurslar progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />Talabalar progressi
            </CardTitle>
            <CardDescription>Kurs bo'yicha o'rtacha o'zlashtirish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4 text-sm">Kurslar topilmadi</p>
            ) : courses.map(c => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{c.title}</span>
                    <span className="text-xs text-muted-foreground ml-2">{c.students} talaba</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.avgScore !== undefined && (
                      <>
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-semibold">{c.avgScore}%</span>
                      </>
                    )}
                  </div>
                </div>
                <Progress value={c.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">Kurs jarayoni: {c.progress}%</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Haftalik faollik */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />Kurslar holati
            </CardTitle>
            <CardDescription>Kurslar bo'yicha talabalar soni</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Ma'lumot yo'q</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#3b82f6" radius={[3,3,0,0]} name="Talabalar" />
                  <Bar dataKey="progress" fill="#8b5cf6" radius={[3,3,0,0]} name="Jarayon %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
