import { useQuery } from '@tanstack/react-query';
import { Activity, Users, Server, AlertTriangle, CheckCircle, Clock, RefreshCw, Wifi, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { qk } from '@/lib/query-keys';
import { monitorApi } from '@/services/api/monitor-api';

const ALERT_STYLE: Record<string, string> = {
  error:   'border-red-200 bg-red-50 dark:bg-red-950/20',
  warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
  info:    'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
};

const ALERT_BADGE: Record<string, string> = {
  error:   'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info:    'bg-blue-100 text-blue-800',
};

function UsageBar({ label, value, cls = 'bg-blue-500' }: { label: string; value: number; cls?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-16" /></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2].map(i => <Card key={i}><CardContent className="pt-6 space-y-3">{[1,2,3].map(j => <Skeleton key={j} className="h-10 w-full" />)}</CardContent></Card>)}
      </div>
    </div>
  );
}

export function MonitorDashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError, refetch } = useQuery({
    queryKey: qk.monitor.stats(),
    queryFn: monitorApi.getSystemStats,
    refetchInterval: 30_000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: qk.monitor.alerts(),
    queryFn: monitorApi.getAlerts,
    refetchInterval: 30_000,
  });

  if (statsLoading || alertsLoading) return <DashboardSkeleton />;

  if (statsError) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Monitoring Dashboard</h1>
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

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Tizim holati va ishlash ko'rsatkichlari</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />Yangilash
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faol foydalanuvchilar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{stats?.activeUsers?.toLocaleString() ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jami so'rovlar</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalRequests?.toLocaleString() ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats?.uptime ?? 0}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">O'rtacha javob vaqti</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.avgResponseTime ?? 0}ms</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />Resurs holati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar label="CPU yuklamasi" value={stats?.cpuUsage ?? 0} />
            <UsageBar label="Xotira ishlatilishi" value={stats?.memoryUsage ?? 0} />
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Database className="h-4 w-4" />DB ulanishlar
              </span>
              <span className="font-medium">{stats?.dbConnections ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Wifi className="h-4 w-4" />Xato darajasi
              </span>
              <span className={`font-medium ${(stats?.errorRate ?? 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {stats?.errorRate ?? 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />Tizim ogohlantirishlari
            </CardTitle>
            <CardDescription>
              {activeAlerts.length} ta faol ogohlantirish
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                <p className="text-muted-foreground text-sm">Barcha tizimlar normal ishlayapti</p>
              </div>
            ) : (
              activeAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg border ${ALERT_STYLE[alert.type]}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <Badge className={ALERT_BADGE[alert.type]}>
                      {alert.type === 'error' ? 'Xato' : alert.type === 'warning' ? 'Ogohlantirish' : 'Ma\'lumot'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
