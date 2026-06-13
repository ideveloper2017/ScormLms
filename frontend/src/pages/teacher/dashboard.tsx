import { useNavigate } from "react-router-dom";
import {
  BookOpen, Users, ClipboardList, FileQuestion, MessageCircle,
  CalendarDays, TrendingUp, CheckCircle2, Clock, Plus,
  ArrowRight, Star, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";

const STATS = {
  activeCourses:       4,
  totalStudents:       156,
  pendingAssignments:  12,
  todayLessons:        3,
  avgTestScore:        76,
  studentProgress:     68,
  unreadMessages:      5,
  newSubmissions:      8,
};

const TODAY_LESSONS = [
  { time: "08:00–09:20", subject: "JavaScript Asoslari",    room: "B-105", group: "CS-22-01", students: 24, type: "Ma'ruza"   },
  { time: "11:00–12:20", subject: "React Development",      room: "Lab-2", group: "CS-22-02", students: 18, type: "Amaliyot" },
  { time: "14:00–15:20", subject: "Node.js Backend",        room: "B-201", group: "CS-21-03", students: 22, type: "Seminar"  },
];

const RECENT_SUBMISSIONS = [
  { id: 1, student: "Alisher K.",  assignment: "JavaScript Loyiha", course: "JS Asoslari",   submittedAt: "30 daqiqa oldin", status: "pending" },
  { id: 2, student: "Malika T.",   assignment: "React Component",   course: "React Dev",      submittedAt: "2 soat oldin",    status: "pending" },
  { id: 3, student: "Bobur R.",    assignment: "SQL so'rovlar",     course: "Ma'lumotlar bazasi", submittedAt: "3 soat oldin",  status: "pending" },
  { id: 4, student: "Dilnoza Y.",  assignment: "JS Loyiha",         course: "JS Asoslari",   submittedAt: "5 soat oldin",    status: "graded"  },
];

const COURSE_PROGRESS = [
  { name: "JS Asoslari",  students: 45, progress: 85, avgScore: 88 },
  { name: "React Dev",    students: 32, progress: 72, avgScore: 82 },
  { name: "Node.js",      students: 28, progress: 60, avgScore: 75 },
  { name: "TypeScript",   students: 51, progress: 45, avgScore: 79 },
];

const WEEKLY_ACTIVITY = [
  { day: "Dush", submissions: 8,  tests: 12 },
  { day: "Sesh", submissions: 15, tests: 8  },
  { day: "Chor", submissions: 6,  tests: 20 },
  { day: "Pay",  submissions: 12, tests: 5  },
  { day: "Jum",  submissions: 20, tests: 15 },
];

export function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">O'qituvchi Dashboard</h1>
          <p className="text-muted-foreground">Bugun, {new Date().toLocaleDateString("uz-Latn", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate("/teacher/courses/create")}>
            <Plus className="h-4 w-4" />Yangi kurs
          </Button>
          <Button className="gap-2" onClick={() => navigate("/teacher/assignments/create")}>
            <Plus className="h-4 w-4" />Topshiriq
          </Button>
        </div>
      </div>

      {/* 6 ta metrik */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Kurslar",          value: STATS.activeCourses,      sub: `${STATS.totalStudents} talaba`, icon: BookOpen,     cls: "text-blue-600",   href: "/teacher/courses"     },
          { label: "Tekshirilmagan",   value: STATS.pendingAssignments, sub: "topshiriqlar",                  icon: ClipboardList, cls: "text-orange-600", href: "/teacher/assignments" },
          { label: "Bugungi darslar",  value: STATS.todayLessons,       sub: "reja bo'yicha",                 icon: CalendarDays,  cls: "text-green-600",  href: "/teacher/attendance"  },
          { label: "Test natijalari",  value: `${STATS.avgTestScore}%`, sub: "o'rtacha ball",                 icon: FileQuestion,  cls: "text-purple-600", href: "/teacher/tests"       },
          { label: "Talabalar progressi", value: `${STATS.studentProgress}%`, sub: "o'rtacha",              icon: TrendingUp,    cls: "text-teal-600",   href: "/teacher/students"    },
          { label: "Yangi xabarlar",   value: STATS.unreadMessages,     sub: "o'qilmagan",                    icon: MessageCircle, cls: "text-red-600",    href: "/teacher/messages"    },
        ].map(({ label, value, sub, icon: Icon, cls, href }) => (
          <Card
            key={label}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(href)}
          >
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
            {TODAY_LESSONS.map((lesson, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className="text-center min-w-[70px]">
                  <div className="text-xs font-semibold">{lesson.time.split("–")[0]}</div>
                  <div className="text-xs text-muted-foreground">{lesson.time.split("–")[1]}</div>
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

        {/* Tekshirilishi kerak topshiriqlar */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-500" />
                Yangi topshiriqlar
                {STATS.newSubmissions > 0 && (
                  <Badge className="bg-orange-500 text-white text-xs">{STATS.newSubmissions}</Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate("/teacher/assignments")}>
                Barchasi <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {RECENT_SUBMISSIONS.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    {sub.student.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{sub.student}</div>
                  <div className="text-xs text-muted-foreground truncate">{sub.assignment} · {sub.course}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">{sub.submittedAt}</div>
                  {sub.status === "pending" ? (
                    <Badge className="bg-orange-100 text-orange-800 text-xs mt-0.5">Tekshirish</Badge>
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

      {/* Kurslar progress + haftalik faollik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kurslar va talabalar progressi */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />Talabalar progressi
            </CardTitle>
            <CardDescription>Kurs bo'yicha o'rtacha o'zlashtirish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {COURSE_PROGRESS.map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{c.students} talaba</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    <span className="font-semibold">{c.avgScore}%</span>
                  </div>
                </div>
                <Progress value={c.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">Kurs jarayoni: {c.progress}%</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Haftalik faollik grafigi */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-purple-500" />Haftalik faollik
            </CardTitle>
            <CardDescription>Topshiriqlar va testlar bo'yicha</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={WEEKLY_ACTIVITY} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="submissions" fill="#f97316" radius={[3, 3, 0, 0]} name="Topshiriqlar" />
                <Bar dataKey="tests"       fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Testlar"      />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}