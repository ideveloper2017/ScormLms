import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2, ExternalLink, Pencil, RefreshCw, Scale, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import {
  changeComplianceIssueStatus,
  createComplianceIssue,
  getComplianceIssues,
  getComplianceOwners,
  getDecision559Compliance,
  updateComplianceIssue,
  type ComplianceIssue,
  type ComplianceIssueStatus,
  type ComplianceStatus,
  type ComplianceViolation,
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

const issueStatusMeta: Record<ComplianceIssueStatus, { label: string; className: string }> = {
  OPEN: { label: "Ochiq", className: "bg-red-100 text-red-800" },
  IN_PROGRESS: { label: "Jarayonda", className: "bg-blue-100 text-blue-800" },
  RESOLVED: { label: "Yechim berildi", className: "bg-amber-100 text-amber-800" },
  CLOSED: { label: "Yopildi", className: "bg-green-100 text-green-800" },
};

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

export function AdminCompliance559() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formViolation, setFormViolation] = useState<ComplianceViolation | null>(null);
  const [editingIssue, setEditingIssue] = useState<ComplianceIssue | null>(null);
  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState(tomorrow);
  const [remediationPlan, setRemediationPlan] = useState("");
  const [resolvingIssue, setResolvingIssue] = useState<ComplianceIssue | null>(null);
  const [resolutionEvidence, setResolutionEvidence] = useState("");
  const query = useQuery({
    queryKey: ["compliance", "559"],
    queryFn: getDecision559Compliance,
    staleTime: 30_000,
  });
  const issuesQuery = useQuery({ queryKey: ["compliance", "559", "issues"], queryFn: getComplianceIssues });
  const ownersQuery = useQuery({ queryKey: ["compliance", "559", "owners"], queryFn: getComplianceOwners, enabled: canWrite });

  const refreshIssues = () => queryClient.invalidateQueries({ queryKey: ["compliance", "559", "issues"] });
  const saveIssue = useMutation({
    mutationFn: () => editingIssue
      ? updateComplianceIssue(editingIssue.id, { ownerId: Number(ownerId), dueDate, remediationPlan })
      : createComplianceIssue({ violationCode: formViolation!.code, ownerId: Number(ownerId), dueDate, remediationPlan }),
    onSuccess: async () => {
      setFormViolation(null); setEditingIssue(null); setOwnerId(""); setDueDate(tomorrow()); setRemediationPlan("");
      await refreshIssues();
      toast({ title: "Tuzatish vazifasi saqlandi" });
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Vazifa saqlanmadi", description: error.message }),
  });
  const statusMutation = useMutation({
    mutationFn: ({ issue, status, evidence }: { issue: ComplianceIssue; status: ComplianceIssueStatus; evidence?: string }) =>
      changeComplianceIssueStatus(issue.id, status, evidence),
    onSuccess: async () => {
      setResolvingIssue(null); setResolutionEvidence(""); await refreshIssues();
      toast({ title: "Vazifa holati yangilandi" });
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Holat o'zgarmadi", description: error.message }),
  });

  const openCreate = (violation: ComplianceViolation) => {
    setEditingIssue(null); setFormViolation(violation); setOwnerId(""); setDueDate(tomorrow()); setRemediationPlan(violation.recommendation);
  };
  const openEdit = (issue: ComplianceIssue) => {
    setFormViolation(null); setEditingIssue(issue); setOwnerId(String(issue.ownerId)); setDueDate(issue.dueDate); setRemediationPlan(issue.remediationPlan);
  };

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
  const issues = issuesQuery.data ?? [];
  const activeByViolation = new Map(issues.filter((item) => item.status !== "CLOSED").map((item) => [item.violationCode, item]));

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Scale className="h-4 w-4" />Normativ muvofiqlik</div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">559-son qaror monitoringi</h1>
          <p className="mt-1 text-sm text-muted-foreground">2022-yil 3-oktabrdagi qaror talablarining real modul yozuvlaridan hisoblangan holati</p>
          <p className="mt-1 text-xs text-muted-foreground">Hisoblangan vaqt: {new Date(data.generatedAt).toLocaleString("uz-Latn")}</p>
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
                <AlertDescription className="space-y-2"><p>{item.recommendation}</p>{canWrite && (activeByViolation.has(item.code)
                  ? <Badge variant="outline">Vazifa #{activeByViolation.get(item.code)?.id} ochilgan</Badge>
                  : <Button size="sm" variant="outline" onClick={() => openCreate(item)}>Tuzatish vazifasini ochish</Button>)}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" />Kamchiliklarni tuzatish nazorati</CardTitle>
          <CardDescription>Mas'ul, deadline, reja, yechim dalili va yopilish tekshiruvi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {issuesQuery.isLoading ? <Spinner className="h-5 w-5" /> : issues.length === 0 ? <p className="text-sm text-muted-foreground">Hali tuzatish vazifasi ochilmagan.</p> : issues.map((issue) => (
            <div key={issue.id} className={`rounded-lg border p-4 ${issue.overdue ? "border-red-400" : ""}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-medium">#{issue.id} {issue.title}</span><Badge className={issueStatusMeta[issue.status].className}>{issueStatusMeta[issue.status].label}</Badge>{issue.overdue && <Badge variant="destructive">Muddati o'tgan</Badge>}</div>
                  <p className="text-xs text-muted-foreground">{issue.clause} · Mas'ul: {issue.ownerName} · Deadline: {issue.dueDate}</p>
                  <p className="text-sm">{issue.remediationPlan}</p>
                  {issue.resolutionEvidence && <p className="text-xs text-muted-foreground">Yechim dalili: {issue.resolutionEvidence}</p>}
                </div>
                {canWrite && issue.status !== "CLOSED" && <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(issue)}><Pencil className="mr-1 h-3 w-3" />Tahrirlash</Button>
                  {issue.status === "OPEN" && <Button size="sm" onClick={() => statusMutation.mutate({ issue, status: "IN_PROGRESS" })}>Boshlash</Button>}
                  {issue.status === "IN_PROGRESS" && <Button size="sm" onClick={() => setResolvingIssue(issue)}>Yechim kiritish</Button>}
                  {issue.status === "RESOLVED" && <><Button size="sm" variant="outline" onClick={() => statusMutation.mutate({ issue, status: "IN_PROGRESS" })}>Qayta ishlash</Button><Button size="sm" onClick={() => statusMutation.mutate({ issue, status: "CLOSED" })}>Tekshirish va yopish</Button></>}
                </div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
        <CardHeader><CardTitle>Avtomatik dalillar</CardTitle><CardDescription>Har bir hisoblagich o'chirilmagan real baza yozuvlaridan olinadi.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.evidence.map((item) => (
            <div key={item.code} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2"><div><p className="font-medium">{item.label}</p><p className="text-xs text-muted-foreground">Manba: {item.source}</p></div><Badge className={statusMeta[item.status].className}>{statusMeta[item.status].label}</Badge></div>
              <div className="mt-3 text-2xl font-bold">{item.recordCount} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span></div>
              {item.route && <Button asChild variant="link" className="mt-1 h-auto p-0"><Link to={item.route}>Dalil modulini ochish <ExternalLink className="ml-1 h-3 w-3" /></Link></Button>}
            </div>
          ))}
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

      <Dialog open={Boolean(formViolation || editingIssue)} onOpenChange={(open) => { if (!open) { setFormViolation(null); setEditingIssue(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingIssue ? "Tuzatish vazifasini tahrirlash" : "Tuzatish vazifasini ochish"}</DialogTitle><DialogDescription>{editingIssue?.title ?? formViolation?.message}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Mas'ul</Label><Select value={ownerId} onValueChange={setOwnerId}><SelectTrigger><SelectValue placeholder="Mas'ulni tanlang" /></SelectTrigger><SelectContent>{(ownersQuery.data ?? []).map((owner) => <SelectItem key={owner.id} value={String(owner.id)}>{owner.name} ({owner.username})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Deadline</Label><Input type="date" min={new Date().toISOString().slice(0, 10)} value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></div>
            <div className="space-y-2"><Label>Tuzatish rejasi</Label><Textarea value={remediationPlan} onChange={(event) => setRemediationPlan(event.target.value)} rows={5} maxLength={4000} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setFormViolation(null); setEditingIssue(null); }}>Bekor qilish</Button><Button disabled={!ownerId || !dueDate || !remediationPlan.trim() || saveIssue.isPending} onClick={() => saveIssue.mutate()}>{saveIssue.isPending ? "Saqlanmoqda..." : "Saqlash"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resolvingIssue)} onOpenChange={(open) => { if (!open) setResolvingIssue(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yechim dalilini kiriting</DialogTitle><DialogDescription>{resolvingIssue?.title}</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Tekshiriladigan dalil</Label><Textarea value={resolutionEvidence} onChange={(event) => setResolutionEvidence(event.target.value)} rows={5} maxLength={4000} placeholder="Bajarilgan ish, hujjat yoki modul yozuvini ko'rsating" /></div>
          <DialogFooter><Button variant="outline" onClick={() => setResolvingIssue(null)}>Bekor qilish</Button><Button disabled={!resolutionEvidence.trim() || statusMutation.isPending} onClick={() => resolvingIssue && statusMutation.mutate({ issue: resolvingIssue, status: "RESOLVED", evidence: resolutionEvidence })}>Yechimni saqlash</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ title, value, progress, danger = false }: { title: string; value: string; progress?: number; danger?: boolean }) {
  return <Card><CardHeader className="pb-2"><CardDescription>{title}</CardDescription></CardHeader><CardContent><div className={`text-3xl font-bold ${danger ? "text-red-600" : ""}`}>{value}</div>{progress != null && <Progress className="mt-3" value={progress} />}</CardContent></Card>;
}
