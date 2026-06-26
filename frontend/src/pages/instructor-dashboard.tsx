import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  BookOpen, Users, BarChart3, Calendar, Plus, Eye, Edit, Settings,
  Clock, Award, CheckCircle, AlertCircle, MessageCircle, Video,
  FileText, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { useAuth } from '@/contexts/auth-context';
import { qk } from '@/lib/query-keys';
import { instructorApi } from '@/services/api/instructor-api';

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-40" /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-16" /></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2].map(i => <Card key={i}><CardContent className="pt-6 space-y-3">{[1,2,3].map(j => <Skeleton key={j} className="h-14 w-full" />)}</CardContent></Card>)}
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, JSX.Element> = {
  active:    <Badge className="bg-green-100 text-green-800">Faol</Badge>,
  completed: <Badge className="bg-blue-100 text-blue-800">Yakunlangan</Badge>,
  draft:     <Badge className="bg-yellow-100 text-yellow-800">Loyiha</Badge>,
};

function TaskTypeIcon({ type }: { type: string }) {
  if (type === 'exam')       return <FileText className="h-4 w-4 text-red-600" />;
  if (type === 'assignment') return <CheckCircle className="h-4 w-4 text-blue-600" />;
  if (type === 'webinar')    return <Video className="h-4 w-4 text-purple-600" />;
  return <Calendar className="h-4 w-4" />;
}

export function InstructorDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: qk.instructor.stats(),
    queryFn: instructorApi.getStats,
    staleTime: 60_000,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: qk.instructor.courses(),
    queryFn: instructorApi.getCourses,
    staleTime: 60_000,
  });

  const { data: submissions = [], isLoading: subsLoading } = useQuery({
    queryKey: qk.instructor.submissions(),
    queryFn: instructorApi.getRecentSubmissions,
    staleTime: 30_000,
  });

  const { data: todayLessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: qk.instructor.todayLessons(),
    queryFn: instructorApi.getTodayLessons,
    staleTime: 60_000,
  });

  const isLoading = statsLoading || coursesLoading || subsLoading || lessonsLoading;

  if (isLoading) return <DashboardSkeleton />;

  if (statsError) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">O'qituvchi Paneli</h1>
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

  const displayName = user?.fullName ?? user?.username ?? "O'qituvchi";
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Xush kelibsiz, {displayName}!</h1>
            <p className="text-muted-foreground">
              {stats?.activeCourses ?? 0} faol kurs • {stats?.totalStudents ?? 0} talaba
            </p>
          </div>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" />Yangi Kurs</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Jami Talabalar',  value: stats?.totalStudents ?? 0,      icon: Users,        sub: 'Barcha kurslarda',  cls: '' },
          { label: 'Faol Kurslar',    value: stats?.activeCourses ?? 0,      icon: BookOpen,     sub: 'Davom etmoqda',     cls: '' },
          { label: 'Yangi topshiriq', value: stats?.pendingAssignments ?? 0, icon: CheckCircle,  sub: 'Tekshirishni kutmoqda', cls: 'text-orange-600' },
          { label: "Bugungi darslar", value: stats?.todayLessons ?? 0,       icon: Calendar,     sub: 'Reja bo\'yicha',   cls: 'text-blue-600' },
        ].map(({ label, value, icon: Icon, sub, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon className="h-4 w-4" />{label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cls}`}>{value}</div>
              <div className="text-xs text-muted-foreground">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Umumiy</TabsTrigger>
          <TabsTrigger value="courses">Kurslarim</TabsTrigger>
          <TabsTrigger value="students">Topshiriqlar</TabsTrigger>
          <TabsTrigger value="schedule">Jadval</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kurslar Jarayoni</CardTitle>
                <CardDescription>Faol kurslar bo'yicha o'zlashtirish</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Kurslar topilmadi</p>
                ) : courses.map(c => (
                  <div key={c.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{c.title}</span>
                      <span className="text-sm text-muted-foreground">{c.progress}%</span>
                    </div>
                    <Progress value={c.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{c.students} talaba</span>
                      <span>O'rtacha: {c.avgGrade}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>So'nggi Topshiriqlar</CardTitle>
                <CardDescription>Tekshirishni kutayotgan topshiriqlar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {submissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Topshiriqlar yo'q</p>
                ) : submissions.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {s.studentName.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.studentName}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.assignmentTitle}</div>
                    </div>
                    <Badge className={s.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                      {s.status === 'pending' ? 'Kutmoqda' : s.status === 'late' ? 'Kechikkan' : 'Baholandi'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Kurslar topilmadi</p>
              </div>
            ) : courses.map(c => (
              <Card key={c.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{c.title}</CardTitle>
                      <CardDescription>{c.students} talaba</CardDescription>
                    </div>
                    {STATUS_BADGE[c.status] ?? <Badge variant="secondary">{c.status}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Kurs jarayoni</span><span>{c.progress}%</span>
                    </div>
                    <Progress value={c.progress} className="h-2" />
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">O'rtacha baho: </span>
                    <span className="font-medium text-green-600">{c.avgGrade}</span>
                  </div>
                  {(c.startDate || c.endDate) && (
                    <div className="text-xs text-muted-foreground">
                      {c.startDate} {c.endDate ? `– ${c.endDate}` : ''}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-1" size="sm"><Eye className="h-4 w-4" />Ko'rish</Button>
                    <Button variant="outline" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm"><Settings className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Submissions */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Topshiriqlar Ro'yxati</CardTitle>
              <CardDescription>Barcha topshiriqlar va ularning holati</CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Topshiriqlar topilmadi</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Talaba</TableHead>
                      <TableHead>Topshiriq</TableHead>
                      <TableHead>Kurs</TableHead>
                      <TableHead>Topshirilgan</TableHead>
                      <TableHead>Holat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.studentName}</TableCell>
                        <TableCell>{s.assignmentTitle}</TableCell>
                        <TableCell className="text-muted-foreground">{s.courseTitle}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{s.submittedAt}</TableCell>
                        <TableCell>
                          <Badge className={
                            s.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            s.status === 'late'    ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {s.status === 'pending' ? 'Kutmoqda' : s.status === 'late' ? 'Kechikkan' : 'Baholandi'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />Bugungi Darslar
              </CardTitle>
              <CardDescription>Bugungi dars jadval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayLessons.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Bugun dars yo'q</p>
              ) : todayLessons.map(lesson => (
                <div key={lesson.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="text-center min-w-[80px]">
                    <div className="text-sm font-semibold">{lesson.time.split('–')[0]?.trim() ?? lesson.time}</div>
                    <div className="text-xs text-muted-foreground">{lesson.time.split('–')[1]?.trim() ?? ''}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{lesson.subject}</div>
                    <div className="text-sm text-muted-foreground">{lesson.group} • {lesson.room}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{lesson.type}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">{lesson.students} talaba</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
