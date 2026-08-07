import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import { canApprovePractice, canCompletePractice, practiceApi, practicePlacementInputValid, type SaveStudentPracticeInput, type StudentPractice } from "@/services/api/practice-api";

const today = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const currentAcademicYear = () => {
  const date = new Date();
  const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${year + 1}`;
};
const initialForm = (): SaveStudentPracticeInput => ({
  studentId: 0,
  academicYear: currentAcademicYear(),
  planReference: "",
  startsOn: today(),
  endsOn: today(),
  placementBasis: "CURRENT_WORKPLACE",
  organizationName: "",
  organizationAddress: "",
  jobTitle: "",
  specialtyMatchConfirmed: false,
  agreementNumber: "",
  agreementDate: "",
  basisEvidenceReference: "",
});

export function AdminPractices() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [form, setForm] = useState<SaveStudentPracticeInput>(initialForm);
  const [completing, setCompleting] = useState<StudentPractice | null>(null);
  const [completion, setCompletion] = useState({ summary: "", evidenceReference: "" });
  const practices = useQuery({ queryKey: ["practices"], queryFn: practiceApi.list });
  const students = useQuery({ queryKey: ["practices", "eligible-students"], queryFn: practiceApi.eligibleStudents, enabled: canWrite });
  const refresh = () => client.invalidateQueries({ queryKey: ["practices"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const create = useMutation({
    mutationFn: () => practiceApi.create(form),
    onSuccess: async () => { setForm(initialForm()); await refresh(); toast({ title: "Amaliyot qoralamasi yaratildi" }); },
    onError: fail,
  });
  const action = useMutation({
    mutationFn: ({ id, kind }: { id: number; kind: "approve" | "cancel" }) => practiceApi[kind](id),
    onSuccess: async () => { await refresh(); toast({ title: "Amaliyot holati yangilandi" }); },
    onError: fail,
  });
  const finish = useMutation({
    mutationFn: () => practiceApi.complete(completing!.id, completion),
    onSuccess: async () => { setCompleting(null); setCompletion({ summary: "", evidenceReference: "" }); await refresh(); toast({ title: "Amaliyot yakunlandi" }); },
    onError: fail,
  });
  const setBasis = (basis: SaveStudentPracticeInput["placementBasis"]) => setForm({
    ...form,
    placementBasis: basis,
    jobTitle: basis === "CURRENT_WORKPLACE" ? form.jobTitle : "",
    specialtyMatchConfirmed: basis === "CURRENT_WORKPLACE" ? form.specialtyMatchConfirmed : false,
    agreementNumber: basis === "PARTNER_ORGANIZATION" ? form.agreementNumber : "",
    agreementDate: basis === "PARTNER_ORGANIZATION" ? form.agreementDate : "",
  });

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">Talaba amaliyoti</h1><p className="text-sm text-muted-foreground">559-son qaror 23-bandi: o'quv rejasidagi muddat, mos ish joyi yoki OTM kelishgan tashkilot.</p></div>
    {canWrite && <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />Amaliyotni rejalashtirish</CardTitle><CardDescription>Talaba ishlamasa yoki ish joyi yo'nalishga mos bo'lmasa, hamkor tashkilot kelishuvi majburiy.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2"><Label>Faol masofaviy talaba</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.studentId} onChange={(event) => setForm({ ...form, studentId: Number(event.target.value) })}><option value={0}>Talabani tanlang</option>{(students.data ?? []).map((student) => <option key={student.id} value={student.id}>{student.studentNumber} - {student.fullName}</option>)}</select></div>
      <div className="space-y-2"><Label>O'quv yili</Label><Input value={form.academicYear} onChange={(event) => setForm({ ...form, academicYear: event.target.value })} /></div>
      <div className="space-y-2 md:col-span-2"><Label>O'quv reja rekviziti</Label><Input value={form.planReference} onChange={(event) => setForm({ ...form, planReference: event.target.value })} placeholder="Tasdiqlangan reja raqami, semestr va amaliyot turi" /></div>
      <div className="space-y-2"><Label>Boshlanish</Label><Input type="date" value={form.startsOn} onChange={(event) => setForm({ ...form, startsOn: event.target.value })} /></div>
      <div className="space-y-2"><Label>Tugash</Label><Input type="date" value={form.endsOn} onChange={(event) => setForm({ ...form, endsOn: event.target.value })} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Joylashtirish asosi</Label><div className="flex flex-wrap gap-2"><Button type="button" variant={form.placementBasis === "CURRENT_WORKPLACE" ? "default" : "outline"} onClick={() => setBasis("CURRENT_WORKPLACE")}><BriefcaseBusiness className="mr-2 h-4 w-4" />Mos joriy ish joyi</Button><Button type="button" variant={form.placementBasis === "PARTNER_ORGANIZATION" ? "default" : "outline"} onClick={() => setBasis("PARTNER_ORGANIZATION")}><Building2 className="mr-2 h-4 w-4" />Kelishilgan tashkilot</Button></div></div>
      <div className="space-y-2"><Label>Tashkilot</Label><Input value={form.organizationName} onChange={(event) => setForm({ ...form, organizationName: event.target.value })} /></div>
      <div className="space-y-2"><Label>Manzil</Label><Input value={form.organizationAddress} onChange={(event) => setForm({ ...form, organizationAddress: event.target.value })} /></div>
      {form.placementBasis === "CURRENT_WORKPLACE" ? <><div className="space-y-2"><Label>Lavozim</Label><Input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} /></div><label className="flex items-center gap-2 self-end rounded-md border p-3 text-sm"><input type="checkbox" checked={form.specialtyMatchConfirmed} onChange={(event) => setForm({ ...form, specialtyMatchConfirmed: event.target.checked })} />Ish joyi ta'lim yo'nalishiga mosligi tasdiqlangan</label></> : <><div className="space-y-2"><Label>Kelishuv raqami</Label><Input value={form.agreementNumber} onChange={(event) => setForm({ ...form, agreementNumber: event.target.value })} /></div><div className="space-y-2"><Label>Kelishuv sanasi</Label><Input type="date" value={form.agreementDate} onChange={(event) => setForm({ ...form, agreementDate: event.target.value })} /></div></>}
      <div className="space-y-2 md:col-span-2"><Label>Joylashtirish dalili</Label><Input value={form.basisEvidenceReference} onChange={(event) => setForm({ ...form, basisEvidenceReference: event.target.value })} placeholder="Ish joyi ma'lumotnomasi yoki himoyalangan kelishuv arxivi rekviziti" /></div>
      <Button className="md:col-span-2 md:w-fit" disabled={!practicePlacementInputValid(form) || create.isPending} onClick={() => create.mutate()}>Qoralama yaratish</Button>
    </CardContent></Card>}

    <div className="grid gap-4 lg:grid-cols-2">{(practices.data ?? []).map((practice) => <Card key={practice.id}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-lg">{practice.studentName}</CardTitle><CardDescription>{practice.studentNumber} · {practice.academicYear} · {practice.startsOn} - {practice.endsOn}</CardDescription></div><Badge variant={practice.ruleCompliant ? "default" : "destructive"}>{practice.status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm font-medium">{practice.organizationName}</p><p className="text-sm text-muted-foreground">{practice.placementBasis === "CURRENT_WORKPLACE" ? `Mos ish joyi · ${practice.jobTitle}` : `Kelishuv ${practice.agreementNumber} · ${practice.agreementDate}`}</p><p className="rounded-md bg-muted p-3 text-sm"><b>Reja:</b> {practice.planReference}<br/><b>Dalil:</b> {practice.basisEvidenceReference}</p>{practice.completionSummary && <p className="text-sm"><b>Yakun:</b> {practice.completionSummary}</p>}<div className="flex flex-wrap gap-2">{canWrite && canApprovePractice(practice) && <Button size="sm" onClick={() => action.mutate({ id: practice.id, kind: "approve" })}><CheckCircle2 className="mr-1 h-3 w-3" />Tasdiqlash</Button>}{canWrite && canCompletePractice(practice) && <Button size="sm" onClick={() => setCompleting(practice)}>Yakunlash</Button>}{canWrite && ["DRAFT", "APPROVED"].includes(practice.status) && <Button size="sm" variant="destructive" onClick={() => action.mutate({ id: practice.id, kind: "cancel" })}><XCircle className="mr-1 h-3 w-3" />Bekor qilish</Button>}</div></CardContent></Card>)}{practices.data?.length === 0 && <Card className="lg:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Amaliyot yozuvi hali yaratilmagan.</CardContent></Card>}</div>

    <Dialog open={!!completing} onOpenChange={(open) => { if (!open) setCompleting(null); }}><DialogContent><DialogHeader><DialogTitle>Amaliyotni yakunlash</DialogTitle><DialogDescription>{completing?.studentName}. Natija faqat amaliyot muddati tugagach dalil bilan qayd etiladi.</DialogDescription></DialogHeader><div className="space-y-3"><div className="space-y-2"><Label>Yakuniy xulosa</Label><Textarea value={completion.summary} onChange={(event) => setCompletion({ ...completion, summary: event.target.value })} /></div><div className="space-y-2"><Label>Natija dalili</Label><Input value={completion.evidenceReference} onChange={(event) => setCompletion({ ...completion, evidenceReference: event.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setCompleting(null)}>Bekor qilish</Button><Button disabled={completion.summary.trim().length < 20 || !completion.evidenceReference.trim() || finish.isPending} onClick={() => finish.mutate()}>Yakunlash</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
