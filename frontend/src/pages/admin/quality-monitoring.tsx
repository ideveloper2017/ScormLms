import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Eye, FileSearch, MessageSquareText, UsersRound, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import { canCompleteQualityMonitoringStudy, qualityMonitoringApi, qualityMonitoringParticipantRange, type CompleteQualityMonitoringStudyInput, type QualityMonitoringMethod, type QualityMonitoringStudy } from "@/services/api/quality-monitoring-api";

const methodMeta: Record<QualityMonitoringMethod, { label: string; icon: typeof UsersRound }> = {
  FOCUS_GROUP: { label: "Fokus-guruh", icon: UsersRound },
  INTERVIEW: { label: "Intervyu", icon: MessageSquareText },
  OBSERVATION: { label: "Kuzatuv", icon: Eye },
  DOCUMENT_ANALYSIS: { label: "Hujjat/tahlil", icon: FileSearch },
};
const localDateTime = (offsetHours: number) => { const date = new Date(Date.now() + offsetHours * 3_600_000); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); };
const currentAcademicYear = () => { const date = new Date(); const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1; return `${year}-${year + 1}`; };

export function AdminQualityMonitoring() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [form, setForm] = useState({ method: "FOCUS_GROUP" as QualityMonitoringMethod, title: "", objective: "", academicYear: currentAcademicYear(), startsAt: localDateTime(1), endsAt: localDateTime(3), locationDescription: "", populationScope: "", relatedSurveyId: "" });
  const [completing, setCompleting] = useState<QualityMonitoringStudy | null>(null);
  const [completion, setCompletion] = useState<CompleteQualityMonitoringStudyInput>({ participantCount: 3, summary: "", findings: "", recommendations: "", evidenceReference: "" });
  const studies = useQuery({ queryKey: ["quality-monitoring", "studies"], queryFn: qualityMonitoringApi.list });
  const refresh = () => client.invalidateQueries({ queryKey: ["quality-monitoring", "studies"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const create = useMutation({
    mutationFn: () => qualityMonitoringApi.create({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString(), relatedSurveyId: form.relatedSurveyId ? Number(form.relatedSurveyId) : undefined }),
    onSuccess: async () => { setForm((value) => ({ ...value, title: "", objective: "", locationDescription: "", populationScope: "", relatedSurveyId: "" })); await refresh(); toast({ title: "Monitoring tadbiri yaratildi" }); }, onError: fail,
  });
  const finish = useMutation({
    mutationFn: () => qualityMonitoringApi.complete(completing!.id, completion),
    onSuccess: async () => { setCompleting(null); await refresh(); toast({ title: "Agregat natija va dalil saqlandi" }); }, onError: fail,
  });
  const action = useMutation({
    mutationFn: ({ id, kind }: { id: number; kind: "approve" | "cancel" }) => qualityMonitoringApi[kind](id),
    onSuccess: async () => { await refresh(); toast({ title: "Monitoring dalili holati yangilandi" }); }, onError: fail,
  });
  const openCompletion = (study: QualityMonitoringStudy) => {
    const [min] = qualityMonitoringParticipantRange(study.method);
    setCompletion({ participantCount: min, summary: "", findings: "", recommendations: "", evidenceReference: "" });
    setCompleting(study);
  };
  const participantRange = completing ? qualityMonitoringParticipantRange(completing.method) : [0, 1000];

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">Sifat monitoringi dalillari</h1><p className="text-sm text-muted-foreground">559-son qaror 30-bandi: fokus-guruh, intervyu, kuzatuv va hujjat tahlili. Ishtirokchi shaxslari saqlanmaydi.</p></div>
    {canWrite && <Card><CardHeader><CardTitle>Yangi monitoring tadbiri</CardTitle><CardDescription>Faqat agregat auditoriya scope'i yoziladi; F.I.Sh. yoki aloqa ma'lumoti kiritmang.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2"><Label>Usul</Label><Select value={form.method} onValueChange={(value) => setForm({ ...form, method: value as QualityMonitoringMethod })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(methodMeta).map(([value, meta]) => <SelectItem key={value} value={value}>{meta.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Nomi</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Maqsad</Label><Textarea value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} /></div>
      <div className="space-y-2"><Label>O'quv yili</Label><Input value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} /></div>
      <div className="space-y-2"><Label>Bog'langan anonim so'rov ID (ixtiyoriy)</Label><Input type="number" min={1} value={form.relatedSurveyId} onChange={(event) => setForm({ ...form, relatedSurveyId: event.target.value })} /></div>
      <div className="space-y-2"><Label>Boshlanish</Label><Input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></div>
      <div className="space-y-2"><Label>Tugash</Label><Input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></div>
      <div className="space-y-2"><Label>O'tkazish muhiti</Label><Input value={form.locationDescription} onChange={(event) => setForm({ ...form, locationDescription: event.target.value })} placeholder="Auditoriya yoki onlayn platforma" /></div>
      <div className="space-y-2"><Label>Agregat auditoriya scope'i</Label><Input value={form.populationScope} onChange={(event) => setForm({ ...form, populationScope: event.target.value })} placeholder="Masalan: 1-kurs masofaviy talabalar" /></div>
      <Button className="md:col-span-2 md:w-fit" disabled={!form.title.trim() || !form.objective.trim() || !form.locationDescription.trim() || !form.populationScope.trim() || create.isPending} onClick={() => create.mutate()}><ClipboardCheck className="mr-2 h-4 w-4" />Qoralama yaratish</Button>
    </CardContent></Card>}

    <div className="grid gap-4 lg:grid-cols-2">{(studies.data ?? []).map((study) => { const meta = methodMeta[study.method]; const Icon = meta.icon; return <Card key={study.id}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg"><Icon className="h-4 w-4" />{study.title}</CardTitle><CardDescription>{meta.label} · {study.academicYear} · {study.facilitatorName}</CardDescription></div><Badge>{study.status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm">{study.objective}</p><p className="text-xs text-muted-foreground">{study.populationScope} · {study.locationDescription} · shaxsiy identifikatorlar saqlanmaydi</p>{study.summary && <div className="rounded-md bg-muted p-3 text-sm"><b>Xulosa:</b> {study.summary}</div>}{study.findings && <p className="text-sm"><b>Topilmalar:</b> {study.findings}</p>}{study.recommendations && <p className="text-sm"><b>Tavsiyalar:</b> {study.recommendations}</p>}{study.evidenceReference && <p className="text-xs text-muted-foreground">Dalil: {study.evidenceReference}</p>}<div className="flex flex-wrap gap-2">{canWrite && canCompleteQualityMonitoringStudy(study) && <Button size="sm" onClick={() => openCompletion(study)}>Natijani kiritish</Button>}{canWrite && study.status === "COMPLETED" && <Button size="sm" onClick={() => action.mutate({ id: study.id, kind: "approve" })}><CheckCircle2 className="mr-1 h-3 w-3" />Tasdiqlash</Button>}{canWrite && study.status === "DRAFT" && <Button size="sm" variant="destructive" onClick={() => action.mutate({ id: study.id, kind: "cancel" })}><XCircle className="mr-1 h-3 w-3" />Bekor qilish</Button>}</div></CardContent></Card>; })}{studies.data?.length === 0 && <Card className="lg:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Monitoring dalili hali yaratilmagan.</CardContent></Card>}</div>

    <Dialog open={!!completing} onOpenChange={(open) => { if (!open) setCompleting(null); }}><DialogContent><DialogHeader><DialogTitle>Agregat natijani qayd etish</DialogTitle><DialogDescription>{completing?.title}. Ishtirokchi shaxslarini yozmang; faqat tekshiriladigan umumlashtirilgan natija kiriting.</DialogDescription></DialogHeader><div className="space-y-3"><div className="space-y-2"><Label>Ishtirokchilar soni ({participantRange[0]}–{participantRange[1]})</Label><Input type="number" min={participantRange[0]} max={participantRange[1]} value={completion.participantCount} onChange={(event) => setCompletion({ ...completion, participantCount: Number(event.target.value) })} /></div><div className="space-y-2"><Label>Agregat xulosa</Label><Textarea value={completion.summary} onChange={(event) => setCompletion({ ...completion, summary: event.target.value })} /></div><div className="space-y-2"><Label>Topilmalar</Label><Textarea value={completion.findings} onChange={(event) => setCompletion({ ...completion, findings: event.target.value })} /></div><div className="space-y-2"><Label>Tavsiyalar</Label><Textarea value={completion.recommendations} onChange={(event) => setCompletion({ ...completion, recommendations: event.target.value })} /></div><div className="space-y-2"><Label>Dalil rekviziti</Label><Input value={completion.evidenceReference} onChange={(event) => setCompletion({ ...completion, evidenceReference: event.target.value })} placeholder="Protokol raqami yoki himoyalangan arxiv manzili" /></div></div><DialogFooter><Button variant="outline" onClick={() => setCompleting(null)}>Bekor qilish</Button><Button disabled={completion.summary.trim().length < 20 || completion.findings.trim().length < 20 || completion.recommendations.trim().length < 10 || !completion.evidenceReference.trim() || finish.isPending} onClick={() => finish.mutate()}>Natijani saqlash</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

