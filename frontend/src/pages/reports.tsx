import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Download, Filter, TrendingUp, Users, BookOpen,
  GraduationCap, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { qk } from '@/lib/query-keys';
import { reportsApi } from '@/services/api/reports-api';

const SCORE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

function DashSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16" /></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>)}
      </div>
    </div>
  );
}

export function Reports() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: qk.reports.academic(),
    queryFn: reportsApi.getAcademicStats,
    staleTime: 300_000,
  });

  const { data: monthly = [], isLoading: monthlyLoading } = useQuery({
    queryKey: qk.reports.monthly(),
    queryFn: reportsApi.getMonthlyData,
    staleTime: 300_000,
  });

  const { data: courseCompletion = [], isLoading: coursesLoading } = useQuery({
    queryKey: qk.reports.courses(),
    queryFn: reportsApi.getCourseCompletion,
    staleTime: 300_000,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: qk.reports.list(),
    queryFn: reportsApi.getReports,
    staleTime: 120_000,
  });

  const isLoading = statsLoading || monthlyLoading || coursesLoading || reportsLoading;

  if (isLoading) return <DashSkeleton />;

  if (statsError) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Hisobotlar</h1>
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

  // build pie chart data from monthly avg scores
  const scoreRanges = [
    { range: '90-100', count: 0, color: '#10b981' },
    { range: '80-89',  count: 0, color: '#3b82f6' },
    { range: '70-79',  count: 0, color: '#f59e0b' },
    { range: '60-69',  count: 0, color: '#ef4444' },
    { range: '<60',    count: 0, color: '#6b7280' },
  ];
  monthly.forEach(m => {
    const s = m.avgScore;
    if (s >= 90)      scoreRanges[0].count++;
    else if (s >= 80) scoreRanges[1].count++;
    else if (s >= 70) scoreRanges[2].count++;
    else if (s >= 60) scoreRanges[3].count++;
    else              scoreRanges[4].count++;
  });

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Hisobotlar</h1>
          <p className="text-muted-foreground">LMS platformasi bo'yicha batafsil tahlil va statistika</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="last-month">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Vaqt oralig'i" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-week">Oxirgi hafta</SelectItem>
              <SelectItem value="last-month">Oxirgi oy</SelectItem>
              <SelectItem value="last-quarter">Oxirgi chorak</SelectItem>
              <SelectItem value="last-year">Oxirgi yil</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" />Filter</Button>
          <Button className="gap-2"><Download className="h-4 w-4" />Eksport</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'GPA',              value: stats?.gpa?.toFixed(2) ?? '—',            icon: GraduationCap, cls: 'text-cyan-600',   cardCls: 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20'       },
          { label: 'Faol kurslar',     value: stats?.coursesActive ?? 0,                icon: BookOpen,     cls: 'text-violet-600', cardCls: 'border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20' },
          { label: 'Yakunlangan',      value: stats?.coursesCompleted ?? 0,             icon: GraduationCap, cls: 'text-pink-600',   cardCls: 'border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20'         },
          { label: "O'rtacha ball",    value: `${stats?.avgScore?.toFixed(1) ?? 0}%`,   icon: BarChart3,    cls: 'text-orange-600', cardCls: 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20' },
        ].map(({ label, value, icon: Icon, cls, cardCls }) => (
          <Card key={label} className={`border-2 hover:shadow-xl transition-all duration-300 hover:scale-105 ${cardCls}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>{label}</span>
                <Icon className={`h-4 w-4 ${cls}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-1 ${cls}`}>{value}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />Yangilangan
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Oylik O'zlashtirish</CardTitle>
            <CardDescription>Ball va davomat statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">Ma'lumot yo'q</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore"   stroke="#3b82f6" strokeWidth={2} name="O'rtacha ball" />
                  <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} name="Davomat %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kurs Yakunlash</CardTitle>
            <CardDescription>Kurslar bo'yicha yakunlash statistikasi</CardDescription>
          </CardHeader>
          <CardContent>
            {courseCompletion.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">Ma'lumot yo'q</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseCompletion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="courseTitle" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completion" fill="#10b981" name="Yakunlash %" />
                  <Bar dataKey="avgScore"   fill="#3b82f6" name="O'rtacha ball" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score distribution pie */}
        <Card>
          <CardHeader>
            <CardTitle>Ball Taqsimoti</CardTitle>
            <CardDescription>Oylik natijalar</CardDescription>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <p className="text-center text-muted-foreground py-12 text-sm">Ma'lumot yo'q</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={scoreRanges} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="count">
                      {scoreRanges.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {scoreRanges.map(item => (
                    <div key={item.range} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.range}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Course completion top */}
        <Card>
          <CardHeader>
            <CardTitle>Eng Yaxshi Kurslar</CardTitle>
            <CardDescription>Yuqori o'zlashtirish</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {courseCompletion.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Ma'lumot yo'q</p>
            ) : courseCompletion.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div>
                  <div className="font-medium text-sm">{c.courseTitle}</div>
                  <div className="text-xs text-muted-foreground">{c.students} talaba</div>
                </div>
                <Badge variant="secondary">{c.completion}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ready reports */}
        <Card>
          <CardHeader>
            <CardTitle>Tayyor Hisobotlar</CardTitle>
            <CardDescription>Yuklab olish uchun tayyor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">Hisobot yo'q</p>
            ) : reports.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.period}</div>
                </div>
                {r.status === 'ready' ? (
                  <Button size="sm" variant="outline" className="shrink-0 h-7 gap-1">
                    <Download className="h-3 w-3" />
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {r.status === 'generating' ? 'Tayyorlanmoqda' : 'Xato'}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
