import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2, XCircle, Users, AlertTriangle, RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { qk } from "@/lib/query-keys";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("uz-Latn", { day: "2-digit", month: "short", year: "numeric" });
}

export function TeacherAttendance() {
  const { data: records = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.teacher.attendance(),
    queryFn: teacherPortalApi.getAttendance,
    staleTime: 60_000,
  });

  const totals = records.reduce(
    (acc, r) => ({ present: acc.present + r.present, absent: acc.absent + r.absent, total: acc.total + r.total }),
    { present: 0, absent: 0, total: 0 },
  );

  if (isLoading) return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16" /></CardContent></Card>)}
      </div>
      <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
    </div>
  );

  if (error) return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Davomat</h1>
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

  const overallRate = totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Davomat</h1>
        <p className="text-muted-foreground">Darslar bo'yicha davomat tarixi</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Jami darslar",  value: records.length,    cls: "" },
          { label: "Jami keldi",    value: totals.present,    cls: "text-green-600" },
          { label: "Umumiy davomat",value: `${overallRate}%`, cls: "text-blue-600" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      {records.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Davomat ma'lumotlari topilmadi</p>
      )}

      <div className="space-y-3">
        {records.map((r, i) => {
          const rate = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{r.courseTitle}</div>
                    <div className="text-sm text-muted-foreground">{r.group} · {fmtDate(r.date)}</div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />{r.present} keldi
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />{r.absent} kelmadi
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />{r.total} jami
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Davomat</span>
                    <span className="font-medium">{rate}%</span>
                  </div>
                  <Progress value={rate} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
