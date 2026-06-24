import { useQuery } from '@tanstack/react-query';
import { Shield, Users, AlertTriangle, Clock, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { qk } from '@/lib/query-keys';
import { proctorApi } from '@/services/api/proctor-api';

const SEVERITY_STYLE: Record<string, string> = {
  high:   'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low:    'bg-blue-100 text-blue-800',
};

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  paused:    'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
};

function StatCard({ label, value, icon: Icon, cls = '' }: { label: string; value: React.ReactNode; icon: React.ElementType; cls?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-16" /></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2].map(i => <Card key={i}><CardContent className="pt-6 space-y-3">{[1,2,3].map(j => <Skeleton key={j} className="h-12 w-full" />)}</CardContent></Card>)}
      </div>
    </div>
  );
}

export function ProctorDashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: qk.proctor.stats(),
    queryFn: proctorApi.getStats,
    refetchInterval: 30_000,
  });

  const { data: activeExams = [], isLoading: examsLoading } = useQuery({
    queryKey: qk.proctor.activeExams(),
    queryFn: proctorApi.getActiveExams,
    refetchInterval: 15_000,
  });

  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: qk.proctor.violations(),
    queryFn: proctorApi.getViolations,
    refetchInterval: 15_000,
  });

  if (statsLoading || examsLoading || violationsLoading) return <DashboardSkeleton />;

  if (statsError) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Proktor Dashboard</h1>
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-destructive font-medium">Ma'lumotlarni yuklab bo'lmadi</p>
            <p className="text-sm text-muted-foreground">{(statsError as Error).message}</p>
            <Button variant="outline" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4 mr-2" />Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proktor Dashboard</h1>
          <p className="text-muted-foreground">Imtihon jarayonlarini real-time nazorat qilish</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchStats()}>
          <RefreshCw className="h-4 w-4 mr-2" />Yangilash
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Faol imtihonlar"        value={stats?.activeExams ?? 0}     icon={Shield}        cls="text-blue-600" />
        <StatCard label="Jami talabalar"          value={stats?.totalStudents ?? 0}   icon={Users}         />
        <StatCard label="Qoidabuzarliklar"        value={stats?.violations ?? 0}      icon={AlertTriangle} cls="text-red-600" />
        <StatCard label="Bugun yakunlangan"       value={stats?.completedToday ?? 0}  icon={CheckCircle}   cls="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />Faol imtihonlar
            </CardTitle>
            <CardDescription>{activeExams.length} ta imtihon kuzatilmoqda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeExams.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Hozirda faol imtihon yo'q</p>
            ) : (
              activeExams.map(exam => (
                <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">{exam.course} • {exam.activeStudents}/{exam.totalStudents} talaba</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {exam.violations > 0 && (
                      <Badge className="bg-red-100 text-red-800">{exam.violations} buzarlik</Badge>
                    )}
                    <Badge className={STATUS_STYLE[exam.status]}>
                      {exam.status === 'active' ? 'Faol' : exam.status === 'paused' ? 'Toʻxtatilgan' : 'Yakunlangan'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Violations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />So'nggi qoidabuzarliklar
            </CardTitle>
            <CardDescription>{violations.length} ta qayd etilgan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {violations.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Qoidabuzarlik aniqlanmagan</p>
            ) : (
              violations.map(v => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{v.studentName}</p>
                    <p className="text-xs text-muted-foreground">{v.examTitle} • {v.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={SEVERITY_STYLE[v.severity]}>
                      {v.severity === 'high' ? 'Yuqori' : v.severity === 'medium' ? "O'rta" : 'Past'}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{v.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
