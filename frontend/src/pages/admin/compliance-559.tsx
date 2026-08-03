import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Scale, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  getDecision559Compliance,
  type ComplianceStatus,
  type RequirementImplementation,
} from "@/services/api/compliance-559-api";

const statusMeta: Record<ComplianceStatus, { label: string; className: string }> = {
  COMPLIANT: { label: "Muvofiq", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  WARNING: { label: "E'tibor kerak", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  NON_COMPLIANT: { label: "Nomuvofiq", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const implementationMeta: Record<RequirementImplementation, { label: string; value: number; className: string }> = {
  IMPLEMENTED: { label: "Joriy etilgan", value: 100, className: "bg-green-100 text-green-800" },
  PARTIAL: { label: "Qisman", value: 50, className: "bg-amber-100 text-amber-800" },
  NOT_IMPLEMENTED: { label: "Joriy etilmagan", value: 0, className: "bg-red-100 text-red-800" },
};

export function AdminCompliance559() {
  const query = useQuery({
    queryKey: ["compliance", "559"],
    queryFn: getDecision559Compliance,
    staleTime: 30_000,
  });

  if (query.isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  }

  if (query.error || !query.data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Ma'lumot yuklanmadi</AlertTitle>
          <AlertDescription>{query.error instanceof Error ? query.error.message : "Noma'lum xatolik"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const data = query.data;
  const implemented = data.requirements.filter((item) => item.implementation === "IMPLEMENTED").length;
  const partial = data.requirements.filter((item) => item.implementation === "PARTIAL").length;
  const readiness = data.requirements.length
    ? Math.round(data.requirements.reduce((sum, item) => sum + implementationMeta[item.implementation].value, 0) / data.requirements.length)
    : 0;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Scale className="h-4 w-4" />Normativ muvofiqlik</div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">559-son qaror monitoringi</h1>
          <p className="mt-1 text-sm text-muted-foreground">2022-yil 3-oktabrdagi qaror talablarining LMS'dagi bajarilish holati</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusMeta[data.overallStatus].className}>{statusMeta[data.overallStatus].label}</Badge>
          <Button variant="outline" size="icon" onClick={() => query.refetch()} title="Yangilash">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Umumiy tayyorgarlik" value={`${readiness}%`} progress={readiness} />
        <MetricCard title="To'liq joriy etilgan" value={`${implemented}/${data.requirements.length}`} />
        <MetricCard title="Qisman joriy etilgan" value={String(partial)} />
        <MetricCard title="Aniqlangan buzilishlar" value={String(data.violations.length)} danger={data.violations.length > 0} />
      </div>

      {data.violations.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-red-500" />Bartaraf etilishi kerak bo'lgan holatlar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.violations.map((item) => (
              <Alert key={`${item.code}-${item.message}`} variant={item.severity === "CRITICAL" ? "destructive" : "default"}>
                <XCircle />
                <AlertTitle>{item.clause}: {item.message}</AlertTitle>
                <AlertDescription>{item.recommendation}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {data.metrics.map((metric) => (
          <Card key={metric.code}>
            <CardHeader className="pb-2"><CardDescription>{metric.label}</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2">
                <span className="text-3xl font-bold">{metric.currentValue.toFixed(metric.currentValue % 1 ? 1 : 0)}</span>
                <span className="text-xs text-muted-foreground">{metric.limitValue != null ? `limit: ${metric.limitValue}` : metric.unit}</span>
              </div>
              {metric.limitValue != null && <Progress className="mt-3" value={Math.min(100, metric.currentValue / metric.limitValue * 100)} />}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Qaror komponentlari</CardTitle>
          <CardDescription>10-11 va 24-31-bandlarda belgilangan platforma imkoniyatlari</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {data.requirements.map((item) => {
            const meta = implementationMeta[item.implementation];
            return (
              <div key={item.code} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.component}</p>
                    <p className="text-xs text-muted-foreground">{item.clause}</p>
                  </div>
                  <Badge className={meta.className}>{meta.label}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.requirement}</p>
                <Progress className="mt-3" value={meta.value} />
                {item.route && <Button asChild variant="link" className="mt-2 h-auto p-0"><Link to={item.route}>Modulga o'tish <ExternalLink className="ml-1 h-3 w-3" /></Link></Button>}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Masofaviy yo'nalishlar qabul nazorati</CardTitle><CardDescription>Bakalavriat - 300, magistratura - 30; AKT yo'nalishlari va xorijiy talabalar uchun istisnolar hisobga olinadi</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {data.programs.length === 0 ? <p className="text-sm text-muted-foreground">Masofaviy yo'nalish sozlanmagan.</p> : data.programs.map((program) => (
            <div key={program.programId} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-medium">{program.programName}</p><p className="text-xs text-muted-foreground">{program.degreeLevel}{program.informationTechnologyProgram ? " · AKT istisnosi" : ""}</p></div>
              <div className="flex items-center gap-3"><span className="text-sm">{program.localDistanceStudents} / {program.admissionLimit ?? "cheklanmagan"}</span>{program.status === "COMPLIANT" ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, progress, danger = false }: { title: string; value: string; progress?: number; danger?: boolean }) {
  return <Card><CardHeader className="pb-2"><CardDescription>{title}</CardDescription></CardHeader><CardContent><div className={`text-3xl font-bold ${danger ? "text-red-600" : ""}`}>{value}</div>{progress != null && <Progress className="mt-3" value={progress} />}</CardContent></Card>;
}
