import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Bell, BookOpen, CalendarDays, CheckCircle2, ClipboardList,
  GraduationCap, Loader2, MessageCircle, Play, RefreshCw, User,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {
  useDashboardStats, useNotificationSummary, useRecentActivity, useRecentCourses,
  useUpcomingAssignments, useUpcomingTests,
} from '@/hooks/dashboard/useDashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));

const statusLabel: Record<string, string> = {
  active: 'Faol', completed: 'Yakunlangan', pending: 'Kutilmoqda', submitted: 'Yuborilgan',
  graded: 'Baholangan', overdue: 'Muddati o‘tgan', upcoming: 'Yaqinlashmoqda', 'in-progress': 'Jarayonda',
};

function EmptyState({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function SectionError({ text }: { text: string }) {
  return <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{text}</div>;
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const statsQuery = useDashboardStats();
  const coursesQuery = useRecentCourses();
  const assignmentsQuery = useUpcomingAssignments();
  const testsQuery = useUpcomingTests();
  const activityQuery = useRecentActivity();
  const notificationsQuery = useNotificationSummary();

  const displayName = user?.fullName?.trim() || user?.username || 'Talaba';
  const initials = displayName.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const stats = statsQuery.data;
  const courses = coursesQuery.data ?? [];
  const firstActiveCourse = courses.find(course => course.status === 'active') ?? courses[0];

  const quickActions = [
    { title: 'Darsni davom ettirish', description: firstActiveCourse ? firstActiveCourse.title : 'Kurslar ro‘yxatini ochish', icon: Play, onClick: () => navigate(firstActiveCourse ? `/student/courses/${firstActiveCourse.id}/learn` : '/student/courses') },
    { title: 'Topshiriqlar', description: `${stats?.pendingAssignments ?? 0} ta bajarilmagan`, icon: ClipboardList, onClick: () => navigate('/student/assignments') },
    { title: 'O‘qituvchi bilan aloqa', description: 'Xabarlar bo‘limini ochish', icon: MessageCircle, onClick: () => navigate('/student/messages') },
    { title: 'Shaxsiy kabinet', description: 'Profil va sozlamalar', icon: User, onClick: () => navigate('/student/profile') },
  ];

  if (statsQuery.isLoading) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (statsQuery.isError) {
    return <div className="p-4 md:p-6"><Card className="border-destructive/40"><CardContent className="flex flex-col items-center gap-3 py-10 text-center"><AlertTriangle className="h-10 w-10 text-destructive" /><div><h1 className="font-semibold">Talaba kabinetini yuklab bo‘lmadi</h1><p className="mt-1 text-sm text-muted-foreground">Server bilan aloqani tekshirib, qayta urinib ko‘ring.</p></div><Button onClick={() => statsQuery.refetch()} disabled={statsQuery.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${statsQuery.isFetching ? 'animate-spin' : ''}`} />Qayta urinish</Button></CardContent></Card></div>;
  }

  const statCards = [
    { label: 'Faol kurslar', value: stats?.activeCourses ?? 0, icon: BookOpen },
    { label: 'Yakunlangan kurslar', value: stats?.completedCourses ?? 0, icon: CheckCircle2 },
    { label: 'Topshiriqlar', value: stats?.pendingAssignments ?? 0, icon: ClipboardList },
    { label: 'Davomat', value: `${Math.round(stats?.attendancePercentage ?? 0)}%`, icon: CalendarDays },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3"><Avatar className="h-14 w-14"><AvatarImage src={user?.photo || ''} alt={displayName} /><AvatarFallback>{initials}</AvatarFallback></Avatar><div className="min-w-0"><h1 className="truncate text-2xl font-bold">Xush kelibsiz, {displayName}!</h1><p className="truncate text-sm text-muted-foreground">Talaba ID: {user?.username ?? '—'}</p></div></div>
        <div className="flex gap-2"><Button variant="outline" className="relative" onClick={() => navigate('/student/notifications')}><Bell className="mr-2 h-4 w-4" /> Bildirishnomalar{(notificationsQuery.data?.unreadCount ?? 0) > 0 && <Badge className="ml-2 min-w-6 justify-center px-1.5">{notificationsQuery.data?.unreadCount}</Badge>}</Button><Button onClick={() => navigate('/student/profile')}><User className="mr-2 h-4 w-4" />Profil</Button></div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground sm:text-sm">{label}</p></div></CardContent></Card>)}
      </div>

      <section><h2 className="mb-3 text-lg font-semibold">Tezkor amallar</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{quickActions.map(({ title, description, icon: Icon, onClick }) => <button key={title} type="button" onClick={onClick} className="rounded-lg border bg-card p-4 text-left transition hover:border-primary/50 hover:shadow-sm"><Icon className="mb-3 h-5 w-5 text-primary" /><p className="font-medium">{title}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{description}</p></button>)}</div></section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Faol kurslar</CardTitle><CardDescription>Sizga biriktirilgan kurslar va o‘zlashtirish darajasi</CardDescription></div><Button variant="outline" size="sm" onClick={() => navigate('/student/courses')}>Barchasi</Button></CardHeader><CardContent>
          {coursesQuery.isLoading ? <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" /> : coursesQuery.isError ? <SectionError text="Kurslarni yuklab bo‘lmadi" /> : courses.length === 0 ? <EmptyState text="Sizga hali kurs biriktirilmagan." /> : <div className="space-y-3">{courses.slice(0, 4).map(course => <div key={course.id} className="rounded-lg border p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="truncate font-medium">{course.title}</h3><Badge variant="secondary">{statusLabel[course.status] ?? course.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{course.instructor || 'O‘qituvchi'}</p><div className="mt-3 flex items-center gap-3"><Progress value={course.progress} className="h-2 flex-1" /><span className="w-10 text-right text-xs font-medium">{course.progress}%</span></div></div><Button size="sm" onClick={() => navigate(`/student/courses/${course.id}/learn`)}><Play className="mr-2 h-4 w-4" />Ochish</Button></div></div>)}</div>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>So‘nggi faoliyat</CardTitle><CardDescription>Tizimda qayd etilgan harakatlar</CardDescription></CardHeader><CardContent>
          {activityQuery.isLoading ? <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" /> : activityQuery.isError ? <SectionError text="Faoliyatni yuklab bo‘lmadi" /> : (activityQuery.data ?? []).length === 0 ? <EmptyState text="Hozircha faoliyat qaydi yo‘q." /> : <div className="space-y-4">{activityQuery.data?.slice(0, 6).map(item => <div key={item.id} className="border-l-2 border-primary/40 pl-3"><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.description}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.timestamp)}</p></div>)}</div>}
        </CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Yaqin topshiriqlar</CardTitle><CardDescription>Bajarilishi kerak bo‘lgan vazifalar</CardDescription></div><Button variant="ghost" size="sm" onClick={() => navigate('/student/assignments')}>Ochish</Button></CardHeader><CardContent>
          {assignmentsQuery.isLoading ? <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" /> : assignmentsQuery.isError ? <SectionError text="Topshiriqlarni yuklab bo‘lmadi" /> : (assignmentsQuery.data ?? []).length === 0 ? <EmptyState text="Yaqin topshiriqlar yo‘q." /> : <div className="space-y-3">{assignmentsQuery.data?.slice(0, 4).map(item => <button type="button" key={item.id} onClick={() => navigate('/student/assignments')} className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-muted/50"><div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.courseName} · {formatDate(item.dueDate)}</p></div><Badge variant={item.status === 'overdue' ? 'destructive' : 'secondary'}>{statusLabel[item.status] ?? item.status}</Badge></button>)}</div>}
        </CardContent></Card>
        <Card><CardHeader className="flex-row items-center justify-between space-y-0"><div><CardTitle>Yaqin testlar</CardTitle><CardDescription>Rejalashtirilgan nazoratlar</CardDescription></div><Button variant="ghost" size="sm" onClick={() => navigate('/student/tests')}>Ochish</Button></CardHeader><CardContent>
          {testsQuery.isLoading ? <Loader2 className="mx-auto my-8 h-6 w-6 animate-spin" /> : testsQuery.isError ? <SectionError text="Testlarni yuklab bo‘lmadi" /> : (testsQuery.data ?? []).length === 0 ? <EmptyState text="Yaqin testlar yo‘q." /> : <div className="space-y-3">{testsQuery.data?.slice(0, 4).map(item => <button type="button" key={item.id} onClick={() => navigate('/student/tests')} className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-muted/50"><div><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.courseName} · {formatDate(item.date)}</p></div><GraduationCap className="h-5 w-5 text-primary" /></button>)}</div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
