import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, BadgeCheck, BookCheck, CheckCircle2, Plus, Save, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import {
  assessmentInputError, checklistInputError, contentStandardApi,
  type AssessmentDecision, type SaveAssessmentInput, type SaveChecklistInput,
  type StandardAssessment, type StandardChecklist,
} from "@/services/api/content-standard-api";

const today = () => new Date().toISOString().slice(0, 10);
const blankChecklist = (): SaveChecklistInput => ({
  standardCode: "O'ZDST 36.2030", versionCode: "", title: "O'zDSt 36.2030 kontent muvofiqligi",
  issuingAuthority: "", sourceDocumentNumber: "", sourceDocumentDate: today(), sourceReference: "",
  validFrom: today(), validUntil: null,
  criteria: [{ criterionCode: "", title: "", description: "", required: true, evidenceHint: null, position: 1 }],
});
type ChecklistReview = { id: number; action: "publish" | "reject" };
type AssessmentReview = { id: number; decision: AssessmentDecision };

export function AdminContentStandard() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [form, setForm] = useState<SaveChecklistInput>(blankChecklist);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRevision, setSelectedRevision] = useState(0);
  const [responses, setResponses] = useState<SaveAssessmentInput["responses"]>([]);
  const [checklistReview, setChecklistReview] = useState<ChecklistReview | null>(null);
  const [assessmentReview, setAssessmentReview] = useState<AssessmentReview | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const checklists = useQuery({ queryKey: ["content-standard", "checklists"], queryFn: contentStandardApi.listChecklists });
  const current = useQuery({ queryKey: ["content-standard", "current"], queryFn: contentStandardApi.currentChecklist });
  const revisions = useQuery({ queryKey: ["content-standard", "revisions"], queryFn: contentStandardApi.revisions });
  const assessments = useQuery({ queryKey: ["content-standard", "assessments"], queryFn: contentStandardApi.assessments });
  const active = current.data ?? null;
  const refresh = async () => { await client.invalidateQueries({ queryKey: ["content-standard"] }); };
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });

  useEffect(() => {
    if (!active) { setResponses([]); return; }
    setResponses(active.criteria.map((criterion) => ({ criterionId: criterion.id, met: false, evidenceReference: "", note: "" })));
  }, [active?.id]);

  const saveChecklist = useMutation({
    mutationFn: () => editingId ? contentStandardApi.updateChecklist(editingId, form) : contentStandardApi.createChecklist(form),
    onSuccess: async () => { setEditingId(null); setForm(blankChecklist()); await refresh(); toast({ title: "Checklist qoralamasi saqlandi" }); }, onError: fail,
  });
  const decideChecklist = useMutation({
    mutationFn: () => checklistReview?.action === "publish"
      ? contentStandardApi.publishChecklist(checklistReview.id, reviewNote)
      : contentStandardApi.rejectChecklist(checklistReview!.id, reviewNote),
    onSuccess: async () => { setChecklistReview(null); setReviewNote(""); await refresh(); toast({ title: "Checklist bo'yicha qaror saqlandi" }); }, onError: fail,
  });
  const archiveChecklist = useMutation({ mutationFn: contentStandardApi.archiveChecklist, onSuccess: refresh, onError: fail });
  const assessmentInput = useMemo<SaveAssessmentInput>(() => ({ contentRevisionId: selectedRevision, checklistId: active?.id ?? 0, responses }), [selectedRevision, active?.id, responses]);
  const saveAssessment = useMutation({
    mutationFn: () => contentStandardApi.createAssessment(assessmentInput),
    onSuccess: async () => { setSelectedRevision(0); await refresh(); toast({ title: "Revision assessment qoralamasi saqlandi" }); }, onError: fail,
  });
  const decideAssessment = useMutation({
    mutationFn: () => contentStandardApi.reviewAssessment(assessmentReview!.id, assessmentReview!.decision, reviewNote),
    onSuccess: async () => { setAssessmentReview(null); setReviewNote(""); await refresh(); toast({ title: "Assessment bo'yicha mustaqil qaror saqlandi" }); }, onError: fail,
  });

  const edit = (item: StandardChecklist) => {
    setEditingId(item.id);
    setForm({ standardCode: item.standardCode, versionCode: item.versionCode, title: item.title, issuingAuthority: item.issuingAuthority,
      sourceDocumentNumber: item.sourceDocumentNumber, sourceDocumentDate: item.sourceDocumentDate, sourceReference: item.sourceReference,
      validFrom: item.validFrom, validUntil: item.validUntil, criteria: item.criteria.map(({ id: _id, ...criterion }) => criterion) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const checklistError = checklistInputError(form);
  const assessmentError = active ? assessmentInputError(assessmentInput, active.criteria) : "Amaldagi checklist mavjud emas";

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="flex items-center gap-2 text-2xl font-bold"><BookCheck className="h-6 w-6" />O'zDSt 36.2030 kontent nazorati</h1><p className="mt-1 text-sm text-muted-foreground">559-son qarorning 9-bandi uchun versiyalangan checklist va aynan kontent revisioniga bog'langan assessment.</p></div>
    <Alert><ShieldCheck className="h-4 w-4" /><AlertDescription>Mezonlar qaror matnidan taxmin qilinmaydi. Faqat vakolatli manbadan olingan O'zDSt 36.2030 talablari va manba dalili kiritiladi. Checklist va assessmentni muallifning o'zi tasdiqlay olmaydi.</AlertDescription></Alert>

    {canWrite && <Card><CardHeader><CardTitle>{editingId ? "Checklist qoralamasini tahrirlash" : "Rasmiy checklist qoralamasi"}</CardTitle><CardDescription>Bir vaqtda faqat bitta PUBLISHED versiya amalda bo'ladi.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <Field label="Standart"><Input value={form.standardCode} readOnly /></Field>
      <Field label="Versiya kodi"><Input value={form.versionCode} onChange={(e) => setForm({ ...form, versionCode: e.target.value })} /></Field>
      <Field label="Checklist nomi" wide><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
      <Field label="Vakolatli organ"><Input value={form.issuingAuthority} onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })} /></Field>
      <Field label="Manba hujjat raqami"><Input value={form.sourceDocumentNumber} onChange={(e) => setForm({ ...form, sourceDocumentNumber: e.target.value })} /></Field>
      <Field label="Manba hujjat sanasi"><Input type="date" value={form.sourceDocumentDate} onChange={(e) => setForm({ ...form, sourceDocumentDate: e.target.value })} /></Field>
      <Field label="Manba dalili yoki havolasi"><Input value={form.sourceReference} onChange={(e) => setForm({ ...form, sourceReference: e.target.value })} /></Field>
      <Field label="Amal boshlanishi"><Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></Field>
      <Field label="Amal tugashi (ixtiyoriy)"><Input type="date" value={form.validUntil ?? ""} onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })} /></Field>
      <div className="space-y-3 md:col-span-2"><div className="flex items-center justify-between"><Label>Rasmiy mezonlar</Label><Button type="button" size="sm" variant="outline" onClick={() => setForm({ ...form, criteria: [...form.criteria, { criterionCode: "", title: "", description: "", required: true, evidenceHint: null, position: form.criteria.length + 1 }] })}><Plus className="mr-1 h-3 w-3" />Mezon</Button></div>
        {form.criteria.map((criterion, index) => <div key={index} className="grid gap-2 rounded-md border p-3 md:grid-cols-12">
          <Input className="md:col-span-2" placeholder="Kod" value={criterion.criterionCode} onChange={(e) => setCriterion(setForm, form, index, { criterionCode: e.target.value })} />
          <Input className="md:col-span-4" placeholder="Mezon nomi" value={criterion.title} onChange={(e) => setCriterion(setForm, form, index, { title: e.target.value })} />
          <Input className="md:col-span-4" placeholder="Dalil ko'rsatmasi" value={criterion.evidenceHint ?? ""} onChange={(e) => setCriterion(setForm, form, index, { evidenceHint: e.target.value || null })} />
          <Input className="md:col-span-1" type="number" min={1} max={500} value={criterion.position} onChange={(e) => setCriterion(setForm, form, index, { position: Number(e.target.value) })} />
          <Button className="md:col-span-1" type="button" size="icon" variant="ghost" disabled={form.criteria.length === 1} onClick={() => setForm({ ...form, criteria: form.criteria.filter((_, i) => i !== index) })}><Trash2 className="h-4 w-4" /></Button>
          <Textarea className="md:col-span-10" placeholder="Standartdagi aniq tavsif" value={criterion.description} onChange={(e) => setCriterion(setForm, form, index, { description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={criterion.required} onChange={(e) => setCriterion(setForm, form, index, { required: e.target.checked })} />Majburiy</label>
        </div>)}
      </div>
      {checklistError && <p className="text-sm text-amber-700 md:col-span-2">{checklistError}</p>}
      <div className="flex gap-2 md:col-span-2"><Button disabled={!!checklistError || saveChecklist.isPending} onClick={() => saveChecklist.mutate()}><Save className="mr-2 h-4 w-4" />Saqlash</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(blankChecklist()); }}>Bekor qilish</Button>}</div>
    </CardContent></Card>}

    <section className="space-y-3"><h2 className="text-lg font-semibold">Checklist versiyalari</h2><div className="grid gap-4 xl:grid-cols-2">{(checklists.data ?? []).map((item) => <ChecklistCard key={item.id} item={item} canWrite={canWrite} onEdit={() => edit(item)} onReview={(action) => { setChecklistReview({ id: item.id, action }); setReviewNote(""); }} onArchive={() => archiveChecklist.mutate(item.id)} />)}</div></section>

    {active && canWrite && <Card><CardHeader><CardTitle>Kontent revisionini baholash</CardTitle><CardDescription>Assessment aynan tanlangan revision va joriy checklist versiyasiga bir marta bog'lanadi.</CardDescription></CardHeader><CardContent className="space-y-4">
      <Field label="Kontent revisioni"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={selectedRevision} onChange={(e) => setSelectedRevision(Number(e.target.value))}><option value={0}>Tanlang</option>{(revisions.data ?? []).filter((item) => !item.assessmentExists).map((item) => <option key={item.contentRevisionId} value={item.contentRevisionId}>{item.courseTitle} / {item.moduleTitle} / {item.contentTitle} · r{item.revisionNumber} ({item.contentVersion})</option>)}</select></Field>
      {active.criteria.map((criterion, index) => { const response = responses[index]; if (!response) return null; return <div key={criterion.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-2"><div className="md:col-span-2"><b>{criterion.criterionCode}: {criterion.title}</b>{criterion.required && <Badge className="ml-2" variant="outline">majburiy</Badge>}<p className="mt-1 text-sm text-muted-foreground">{criterion.description}</p></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={response.met} onChange={(e) => setResponses(responses.map((value, i) => i === index ? { ...value, met: e.target.checked } : value))} />Mezon bajarilgan</label><Input placeholder="Dalil reference (bajarilganda)" value={response.evidenceReference ?? ""} onChange={(e) => setResponses(responses.map((value, i) => i === index ? { ...value, evidenceReference: e.target.value } : value))} /><Textarea className="md:col-span-2" placeholder="Izoh (bajarilmaganda kamida 10 belgi)" value={response.note ?? ""} onChange={(e) => setResponses(responses.map((value, i) => i === index ? { ...value, note: e.target.value } : value))} /></div>; })}
      {assessmentError && <p className="text-sm text-amber-700">{assessmentError}</p>}<Button disabled={!!assessmentError || saveAssessment.isPending} onClick={() => saveAssessment.mutate()}><Plus className="mr-2 h-4 w-4" />Assessment yaratish</Button>
    </CardContent></Card>}

    <section className="space-y-3"><h2 className="text-lg font-semibold">Assessmentlar</h2><div className="grid gap-4 xl:grid-cols-2">{(assessments.data ?? []).map((item) => <AssessmentCard key={item.id} item={item} canWrite={canWrite} onReview={(decision) => { setAssessmentReview({ id: item.id, decision }); setReviewNote(""); }} />)}</div></section>

    {(checklistReview || assessmentReview) && <Card className="border-primary"><CardHeader><CardTitle>Mustaqil tekshiruv qarori</CardTitle><CardDescription>Muallifdan boshqa vakolatli xodim kamida 10 belgili asos kiritadi.</CardDescription></CardHeader><CardContent className="space-y-3"><Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Qaror asosi" /><div className="flex gap-2"><Button variant="outline" onClick={() => { setChecklistReview(null); setAssessmentReview(null); setReviewNote(""); }}>Bekor qilish</Button><Button disabled={reviewNote.trim().length < 10 || decideChecklist.isPending || decideAssessment.isPending} onClick={() => checklistReview ? decideChecklist.mutate() : decideAssessment.mutate()}>Qarorni saqlash</Button></div></CardContent></Card>}
  </div>;
}

function ChecklistCard({ item, canWrite, onEdit, onReview, onArchive }: { item: StandardChecklist; canWrite: boolean; onEdit: () => void; onReview: (action: "publish" | "reject") => void; onArchive: () => void }) {
  return <Card className={item.currentlyEffective ? "border-emerald-500" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle>{item.title}</CardTitle><CardDescription>{item.standardCode} · {item.versionCode} · {item.criteria.length} mezon</CardDescription></div><Badge variant={item.currentlyEffective ? "secondary" : "outline"}>{item.status}</Badge></div></CardHeader><CardContent className="space-y-2 text-sm"><p><b>Manba:</b> {item.issuingAuthority}; {item.sourceDocumentNumber}, {item.sourceDocumentDate}</p><p><b>Dalil:</b> {item.sourceReference}</p><p><b>Amal davri:</b> {item.validFrom} — {item.validUntil ?? "cheklanmagan"}</p><p><b>Muallif:</b> {item.createdByName}</p>{item.reviewNote && <p><b>Qaror:</b> {item.reviewNote} — {item.reviewedByName}</p>}{canWrite && item.status === "DRAFT" && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={onEdit}><Save className="mr-1 h-3 w-3" />Tahrirlash</Button><Button size="sm" onClick={() => onReview("publish")}><CheckCircle2 className="mr-1 h-3 w-3" />Chop etish</Button><Button size="sm" variant="destructive" onClick={() => onReview("reject")}><XCircle className="mr-1 h-3 w-3" />Rad etish</Button></div>}{canWrite && item.status === "PUBLISHED" && <Button size="sm" variant="outline" onClick={onArchive}><Archive className="mr-1 h-3 w-3" />Arxivlash</Button>}</CardContent></Card>;
}

function AssessmentCard({ item, canWrite, onReview }: { item: StandardAssessment; canWrite: boolean; onReview: (decision: AssessmentDecision) => void }) {
  const met = item.responses.filter((response) => response.met).length;
  return <Card><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><BadgeCheck className="h-4 w-4" />{item.contentTitle}</CardTitle><CardDescription>{item.courseTitle} · r{item.revisionNumber} ({item.contentVersion}) · checklist {item.checklistVersion}</CardDescription></div><Badge variant={item.status === "PASSED" ? "secondary" : "outline"}>{item.status}</Badge></div></CardHeader><CardContent className="space-y-2 text-sm"><p><b>Natija:</b> {met}/{item.responses.length} mezon bajarilgan</p><p><b>Muallif:</b> {item.createdByName}</p>{item.reviewNote && <p><b>Qaror:</b> {item.reviewNote} — {item.reviewedByName}</p>}{canWrite && item.status === "DRAFT" && <div className="flex gap-2"><Button size="sm" onClick={() => onReview("PASSED")}><CheckCircle2 className="mr-1 h-3 w-3" />O'tdi</Button><Button size="sm" variant="destructive" onClick={() => onReview("FAILED")}><XCircle className="mr-1 h-3 w-3" />O'tmadi</Button></div>}</CardContent></Card>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <div className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>; }
function setCriterion(setForm: React.Dispatch<React.SetStateAction<SaveChecklistInput>>, form: SaveChecklistInput, index: number, patch: Partial<SaveChecklistInput["criteria"][number]>) { setForm({ ...form, criteria: form.criteria.map((item, i) => i === index ? { ...item, ...patch } : item) }); }
