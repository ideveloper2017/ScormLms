import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users, BookOpen, GraduationCap, Shield, Monitor, Activity, AlertTriangle, Settings,
  Plus, BarChart3, Award, CheckCircle, Database, Server, FileText, UserCog, TrendingUp, RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Progress } from '@/components/ui/progress.tsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { qk } from '@/lib/query-keys';
import { adminStatsApi } from '@/services/api/admin-stats-api';

const ROLE_CONFIG: Record<string, {
  title: string; description: string;
  showUsers: boolean; showSystem: boolean; showSecurity: boolean; showUptimeCard: boolean;
}> = {
  SUPER_ADMIN: {
    title: 'Super Admin Dashboard', description: 'Tizim boshqaruvi, foydalanuvchilar va xavfsizlik',
    showUsers: true, showSystem: true, showSecurity: true, showUptimeCard: true,
  },
  ADMIN: {
    title: 'Admin Dashboard', description: "Foydalanuvchilar va ta'lim jarayonini boshqarish",
    showUsers: true, showSystem: false, showSecurity: false, showUptimeCard: false,
  },
  METODIST: {
    title: 'Metodist Dashboard', description: "O'quv dasturi va talabalar monitoringi",
    showUsers: false, showSystem: false, showSecurity: false, showUptimeCard: false,
  },
};
const DEFAULT_CONFIG = ROLE_CONFIG['ADMIN'];

function DashSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-7 sm:h-9 w-48 sm:w-72" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-4 sm:pt-6"><Skeleton className="h-7 sm:h-8 w-12 sm:w-16" /></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {[1,2].map(i => <Card key={i}><CardContent className="pt-4 sm:pt-6 space-y-3">{[1,2,3].map(j => <Skeleton key={j} className="h-10 w-full" />)}</CardContent></Card>)}
      </div>
    </div>
  );
}

function activityIcon(type: string) {
  if (type === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (type === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  return <Activity className="h-4 w-4 text-blue-600" />;
}

function alertBorderCls(type: string) {
  if (type === 'warning') return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
  if (type === 'success') return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
  if (type === 'error')   return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
  return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  const rawRole = (user as any)?.role?.name || user?.roles?.[0]?.name || '';
  const normRole = rawRole.replace(/^ROLE_/i, '').toUpperCase();
  const cfg = ROLE_CONFIG[normRole] ?? DEFAULT_CONFIG;
  const isSuperAdmin = normRole === 'SUPER_ADMIN';
  const isAdmin      = normRole === 'ADMIN';
  const isMetodist   = normRole === 'METODIST';

  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: qk.adminStats.system(),
    queryFn: adminStatsApi.getSystemStats,
    staleTime: 60_000,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: qk.adminStats.activity(),
    queryFn: adminStatsApi.getRecentActivities,
    staleTime: 30_000,
  });

  const { data: monthlyMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: qk.adminStats.users(),
    queryFn: adminStatsApi.getMonthlyMetrics,
    staleTime: 300_000,
  });

  const { data: topInstructors = [], isLoading: instructorsLoading } = useQuery({
    queryKey: qk.teachers(),
    queryFn: adminStatsApi.getTopInstructors,
    staleTime: 300_000,
  });

  const isLoading = statsLoading || activitiesLoading;

  if (isLoading) return <DashSkeleton />;

  if (statsError) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{cfg.title}</h1>
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

  const tabCount = 2 + (cfg.showUsers ? 1 : 0) + (cfg.showSystem ? 1 : 0) + (cfg.showSecurity ? 1 : 0);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{cfg.title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{cfg.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9" onClick={() => navigate('/admin/settings')}>
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Sozlamalar
            </Button>
          )}
          {(isSuperAdmin || isAdmin) && (
            <Button size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9" onClick={() => navigate('/admin/users')}>
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Yangi Foydalanuvchi
            </Button>
          )}
          {isMetodist && (
            <Button size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9" onClick={() => navigate('/admin/courses')}>
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />Yangi Kurs
            </Button>
          )}
        </div>
      </div>

      {/* 4 ta asosiy metrika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" />Jami Talabalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.totalStudents ?? 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Faol tizim</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCog className="h-4 w-4 text-purple-500" />Jami O'qituvchilar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTeachers ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {(stats?.totalUsers ?? 0) - (stats?.totalStudents ?? 0) - (stats?.totalTeachers ?? 0)} xodim
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-500" />Faol Kurslar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCourses ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Jami {stats?.totalCourses ?? 0} ta kursdan</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" />Faol Testlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeExams ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Jami {stats?.totalExams ?? 0} ta imtihondan</div>
          </CardContent>
        </Card>
      </div>

      {/* Kontent va o'zlashtirish */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />Kontent To'ldirilganlik Darajasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold">{stats?.contentCompletion ?? 0}%</span>
              <span className="text-xs text-muted-foreground">o'rtacha</span>
            </div>
            <Progress value={stats?.contentCompletion ?? 0} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />O'zlashtirish Ko'rsatkichlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold">{stats?.avgAchievement ?? 0}%</span>
              <span className="text-xs text-muted-foreground">o'rtacha ball</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>O'tish darajasi</span>
                <span className="font-semibold text-green-600">{stats?.passRate ?? 0}%</span>
              </div>
              <Progress value={stats?.passRate ?? 0} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Super admin uptime cards */}
      {cfg.showUptimeCard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Server className="h-4 w-4" />Tizim Holati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.systemUptime ?? 0}%</div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />SCORM Paketlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.scormPackages ?? 0}</div>
              <div className="text-xs text-muted-foreground">Server yuklanishi: {stats?.serverLoad ?? 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />Jami Foydalanuvchilar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.totalUsers ?? 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{(stats?.activeUsers ?? 0).toLocaleString()} faol</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 pb-1">
          <TabsList className="grid w-full min-w-max" style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(100px, 1fr))` }}>
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Umumiy</TabsTrigger>
            {cfg.showUsers    && <TabsTrigger value="users" className="text-xs sm:text-sm">Foydalanuvchilar</TabsTrigger>}
            {cfg.showSystem   && <TabsTrigger value="system" className="text-xs sm:text-sm">Tizim</TabsTrigger>}
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">Tahlil</TabsTrigger>
            {cfg.showSecurity && <TabsTrigger value="security" className="text-xs sm:text-sm">Xavfsizlik</TabsTrigger>}
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />Tizim Ishlashi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Server yuklanganligi</span>
                    <span className="text-sm">{stats?.serverLoad ?? 0}%</span>
                  </div>
                  <Progress value={stats?.serverLoad ?? 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SCORM Engine</span>
                    <Badge className="bg-green-100 text-green-800">Faol</Badge>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Proctoring AI</span>
                    <Badge className="bg-blue-100 text-blue-800">Ishlayapti</Badge>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>So'nggi Faoliyatlar</CardTitle>
                <CardDescription>Tizim faolligi va foydalanuvchi harakatlari</CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Faoliyat yo'q</p>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 5).map(activity => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {activity.username?.slice(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            {activityIcon(activity.type)}
                            <span className="font-medium text-sm">{activity.action}</span>
                          </div>
                          {activity.details && <p className="text-sm text-muted-foreground">{activity.details}</p>}
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users */}
        {cfg.showUsers && (
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Foydalanuvchi Statistikasi</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ['Jami foydalanuvchilar', (stats?.totalUsers ?? 0).toLocaleString()],
                    ['Faol foydalanuvchilar', (stats?.activeUsers ?? 0).toLocaleString()],
                    ["O'qituvchilar", stats?.totalTeachers ?? 0],
                    ['Talabalar', (stats?.totalStudents ?? 0).toLocaleString()],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm">{label}</span>
                      <span className="font-bold">{val}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Eng Yaxshi O'qituvchilar</CardTitle>
                  <CardDescription>Faol o'qituvchilar</CardDescription>
                </CardHeader>
                <CardContent>
                  {instructorsLoading ? (
                    <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
                  ) : topInstructors.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">O'qituvchilar topilmadi</p>
                  ) : (
                    <div className="space-y-3">
                      {topInstructors.slice(0, 5).map(ins => (
                        <div key={ins.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {ins.fullName?.split(' ').map(n => n[0]).join('').slice(0,2) ?? 'T'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">{ins.fullName}</div>
                              {ins.departmentName && (
                                <div className="text-xs text-muted-foreground">{ins.departmentName}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {ins.totalStudents !== undefined && <div>{ins.totalStudents} talaba</div>}
                            {ins.totalCourses  !== undefined && <div>{ins.totalCourses} kurs</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* System — super_admin */}
        {cfg.showSystem && (
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />Ma'lumotlar Bazasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Server yuklanishi</span>
                    <span className="font-bold">{stats?.serverLoad ?? 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Uptime</span>
                    <span className="font-bold text-green-600">{stats?.systemUptime ?? 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Holat</span>
                    <Badge className="bg-green-100 text-green-800">Sog'lom</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />SCORM Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Versiya</span>
                    <span className="font-bold">2004 4th Edition</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Faol paketlar</span>
                    <span className="font-bold">{stats?.scormPackages ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Holat</span>
                    <Badge className="bg-green-100 text-green-800">Faol</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tizim Statistikasi</CardTitle>
              <CardDescription>Oylik o'sish va faollik ko'rsatkichlari</CardDescription>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : monthlyMetrics.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">Statistika ma'lumoti yo'q</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users"   stroke="#3b82f6" strokeWidth={2} name="Foydalanuvchilar" />
                    <Line type="monotone" dataKey="courses" stroke="#10b981" strokeWidth={2} name="Kurslar" />
                    <Line type="monotone" dataKey="exams"   stroke="#f59e0b" strokeWidth={2} name="Imtihonlar" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Jami talabalar',    value: (stats?.totalStudents ?? 0).toLocaleString(), cls: 'text-blue-600'   },
              { label: "O'qituvchilar",     value: stats?.totalTeachers ?? 0,                    cls: 'text-purple-600' },
              { label: 'Kurs yakunlash',    value: `${stats?.contentCompletion ?? 0}%`,          cls: 'text-green-600'  },
              { label: "O'tish darajasi",   value: `${stats?.passRate ?? 0}%`,                   cls: 'text-orange-600' },
            ].map(({ label, value, cls }) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${cls}`}>{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Security — super_admin */}
        {cfg.showSecurity && (
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />Xavfsizlik Holati
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ['Faol sessiyalar',         (stats?.activeUsers ?? 0).toString()],
                    ['Jami foydalanuvchilar',   (stats?.totalUsers ?? 0).toLocaleString()],
                    ['Tizim uptime',            `${stats?.systemUptime ?? 0}%`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm">{label}</span>
                      <span className="font-bold">{val}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audit Loglar</CardTitle>
                  <CardDescription>So'nggi tizim hodisalari</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">Log yo'q</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 5).map(a => (
                        <div key={a.id} className={`p-3 border-l-4 rounded-r-lg ${alertBorderCls(a.type)}`}>
                          <div className="font-medium text-sm">{a.action}</div>
                          {a.details && <div className="text-xs text-muted-foreground">{a.details}</div>}
                          <div className="text-xs text-muted-foreground mt-0.5">{a.timestamp}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
