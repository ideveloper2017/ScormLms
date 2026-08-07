import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, BookMarked, CheckCircle2, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { listPrograms, listSubjects } from "@/lib/academic-api";
import { hasAuthority } from "@/lib/rbac-api";
import { canApproveCurriculum, curriculumApi, curriculumInputError, type CurriculumCredentialType, type CurriculumPlanItemType, type CurriculumVersion, type SaveCurriculumVersionInput } from "@/services/api/curriculum-api";

const currentAcademicYear = () => {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${year + 1}`;
};
const datesForYear = (academicYear: string) => {
  const [first, second] = academicYear.split("-");
  return { validFrom: `${first}-09-01`, validUntil: `${second}-08-31` };
};
const initialForm = (): SaveCurriculumVersionInput => {
  const academicYear = currentAcademicYear();
  return {
    programId: 0,
    versionCode: "",
    academicYear,
    credentialType: "STATE_DIPLOMA",
    normativeBasisType: "STATE_EDUCATION_STANDARD",
    standardReference: "",
    qualificationRequirementsReference: "",
    ...datesForYear(academicYear),
  };
};

export function AdminStudyPlans() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<SaveCurriculumVersionInput>(initialForm);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subjectForm, setSubjectForm] = useState<{ subjectId: number; semester: number; planItemType: CurriculumPlanItemType }>({ subjectId: 0, semester: 1, planItemType: "REQUIRED" });
  const [approving, setApproving] = useState<CurriculumVersion | null>(null);
  const [approval, setApproval] = useState({ approvalOrderNumber: "", approvalOrderDate: new Date().toISOString().slice(0, 10) });
  const curricula = useQuery({ queryKey: ["curricula"], queryFn: curriculumApi.list });
  const programs = useQuery({ queryKey: ["programs", "curriculum-options"], queryFn: () => listPrograms() });
  const selected = curricula.data?.find((item) => item.id === selectedId) ?? null;
  const subjects = useQuery({
    queryKey: ["subjects", "curriculum-options", selected?.programId],
    queryFn: () => listSubjects(selected!.programId),
    enabled: !!selected && selected.status === "DRAFT",
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["curricula"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const create = useMutation({
    mutationFn: () => curriculumApi.create(form),
    onSuccess: async (created) => { setSelectedId(created.id); setForm(initialForm()); await refresh(); toast({ title: "Curriculum qoralamasi yaratildi" }); },
    onError: fail,
  });
  const addSubject = useMutation({
    mutationFn: () => curriculumApi.addSubject(selectedId!, subjectForm),
    onSuccess: async () => { setSubjectForm({ subjectId: 0, semester: 1, planItemType: "REQUIRED" }); await refresh(); toast({ title: "Fan curriculumga qo'shildi" }); },
    onError: fail,
  });
  const removeSubject = useMutation({
    mutationFn: ({ versionId, itemId }: { versionId: number; itemId: number }) => curriculumApi.removeSubject(versionId, itemId),
    onSuccess: async () => { await refresh(); toast({ title: "Fan curriculumdan chiqarildi" }); },
    onError: fail,
  });
  const approve = useMutation({
    mutationFn: () => curriculumApi.approve(approving!.id, approval),
    onSuccess: async () => { setApproving(null); setApproval({ approvalOrderNumber: "", approvalOrderDate: new Date().toISOString().slice(0, 10) }); await refresh(); toast({ title: "Curriculum tasdiqlandi" }); },
    onError: fail,
  });
  const archive = useMutation({
    mutationFn: curriculumApi.archive,
    onSuccess: async () => { await refresh(); toast({ title: "Curriculum arxivlandi" }); },
    onError: fail,
  });
  const filtered = useMemo(() => (curricula.data ?? []).filter((item) =>
    !search.trim() || `${item.programName} ${item.versionCode} ${item.academicYear} ${item.standardReference}`.toLowerCase().includes(search.toLowerCase()),
  ), [curricula.data, search]);
  const setCredential = (credentialType: CurriculumCredentialType) => setForm({
    ...form,
    credentialType,
    normativeBasisType: credentialType === "STATE_DIPLOMA" ? "STATE_EDUCATION_STANDARD" : "PROFESSIONAL_STANDARD",
  });
  const setAcademicYear = (academicYear: string) => setForm({ ...form, academicYear, ...datesForYear(academicYear) });

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">O'quv reja va curriculum</h1><p className="text-sm text-muted-foreground">559-son qaror 19-bandi: dastur, standart, malaka talabi, fanlar snapshoti va mustaqil tasdiq.</p></div>

    {canWrite && <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookMarked className="h-5 w-5" />Yangi curriculum versiyasi</CardTitle><CardDescription>Faqat faol masofaviy dastur uchun; amal qilish muddati butun o'quv yilini qoplashi kerak.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2"><Label>Ta'lim dasturi</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.programId} onChange={(event) => setForm({ ...form, programId: Number(event.target.value) })}><option value={0}>Dastur tanlang</option>{(programs.data ?? []).filter((program) => program.active && program.distanceEnabled).map((program) => <option key={program.id} value={program.id}>{program.code ? `${program.code} - ` : ""}{program.name}</option>)}</select></div>
      <div className="space-y-2"><Label>Versiya kodi</Label><Input value={form.versionCode} onChange={(event) => setForm({ ...form, versionCode: event.target.value })} placeholder="CUR-2026-01" /></div>
      <div className="space-y-2"><Label>O'quv yili</Label><Input value={form.academicYear} onChange={(event) => setAcademicYear(event.target.value)} /></div>
      <div className="space-y-2"><Label>Beriladigan hujjat</Label><div className="flex gap-2"><Button type="button" variant={form.credentialType === "STATE_DIPLOMA" ? "default" : "outline"} onClick={() => setCredential("STATE_DIPLOMA")}>Davlat diplomi</Button><Button type="button" variant={form.credentialType === "NON_STATE_CREDENTIAL" ? "default" : "outline"} onClick={() => setCredential("NON_STATE_CREDENTIAL")}>Nodavlat hujjat</Button></div></div>
      <div className="space-y-2 md:col-span-2"><Label>{form.credentialType === "STATE_DIPLOMA" ? "Davlat ta'lim standarti rekviziti" : "Kasbiy standart rekviziti"}</Label><Input value={form.standardReference} onChange={(event) => setForm({ ...form, standardReference: event.target.value })} placeholder="Rasmiy hujjat raqami va reestr manzili" /></div>
      <div className="space-y-2 md:col-span-2"><Label>Malaka talablari rekviziti</Label><Input value={form.qualificationRequirementsReference} onChange={(event) => setForm({ ...form, qualificationRequirementsReference: event.target.value })} /></div>
      <div className="space-y-2"><Label>Amal qilish boshi</Label><Input type="date" value={form.validFrom} onChange={(event) => setForm({ ...form, validFrom: event.target.value })} /></div>
      <div className="space-y-2"><Label>Amal qilish oxiri</Label><Input type="date" value={form.validUntil} onChange={(event) => setForm({ ...form, validUntil: event.target.value })} /></div>
      {curriculumInputError(form) && <p className="text-sm text-amber-700 md:col-span-2">{curriculumInputError(form)}</p>}
      <Button className="md:col-span-2 md:w-fit" disabled={!!curriculumInputError(form) || create.isPending} onClick={() => create.mutate()}><Plus className="mr-2 h-4 w-4" />Qoralama yaratish</Button>
    </CardContent></Card>}

    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="Dastur, versiya yoki standart bo'yicha qidiring" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    <div className="grid gap-4 lg:grid-cols-2">{filtered.map((version) => <Card key={version.id} className={selectedId === version.id ? "ring-2 ring-primary" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-lg">{version.programName}</CardTitle><CardDescription>{version.versionCode} · {version.academicYear}</CardDescription></div><Badge>{version.status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm"><b>Asos:</b> {version.normativeBasisType === "STATE_EDUCATION_STANDARD" ? "Davlat ta'lim standarti" : "Kasbiy standart"}<br/>{version.standardReference}</p><p className="text-sm"><b>Malaka talabi:</b> {version.qualificationRequirementsReference}</p><p className="rounded-md bg-muted p-3 text-sm">{version.subjectCount} fan · {version.totalCredits} kredit · {version.validFrom} - {version.validUntil}</p>{version.approvalOrderNumber && <p className="text-sm text-emerald-700"><CheckCircle2 className="mr-1 inline h-4 w-4" />{version.approvalOrderNumber}, {version.approvalOrderDate} · {version.approvedByName}</p>}<div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedId(version.id)}>Fanlar</Button>{canWrite && canApproveCurriculum(version) && <Button size="sm" onClick={() => setApproving(version)}>Tasdiqlash</Button>}{canWrite && version.status === "APPROVED" && <Button size="sm" variant="outline" onClick={() => archive.mutate(version.id)}><Archive className="mr-1 h-3 w-3" />Arxivlash</Button>}</div></CardContent></Card>)}{filtered.length === 0 && <Card className="lg:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Curriculum versiyasi topilmadi.</CardContent></Card>}</div>

    {selected && <Card><CardHeader><CardTitle>{selected.versionCode}: fanlar snapshoti</CardTitle><CardDescription>{selected.status === "DRAFT" ? "Fanlar faqat qoralamada o'zgartiriladi; tasdiqda joriy kod, nom va kredit snapshot qilinadi." : "Tasdiqlangan tarkib o'zgarmas audit dalilidir."}</CardDescription></CardHeader><CardContent className="space-y-3">{canWrite && selected.status === "DRAFT" && <div className="grid gap-2 rounded-md border p-3 md:grid-cols-4"><select className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2" value={subjectForm.subjectId} onChange={(event) => setSubjectForm({ ...subjectForm, subjectId: Number(event.target.value) })}><option value={0}>Faol fanni tanlang</option>{(subjects.data ?? []).filter((subject) => subject.active && subject.code && subject.credits && !selected.subjects.some((item) => item.subjectId === subject.id)).map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name} ({subject.credits} kr)</option>)}</select><Input type="number" min={1} max={12} value={subjectForm.semester} onChange={(event) => setSubjectForm({ ...subjectForm, semester: Number(event.target.value) })} /><select className="h-10 rounded-md border bg-background px-3 text-sm" value={subjectForm.planItemType} onChange={(event) => setSubjectForm({ ...subjectForm, planItemType: event.target.value as CurriculumPlanItemType })}><option value="REQUIRED">Majburiy</option><option value="ELECTIVE">Tanlov</option></select><Button className="md:col-span-4 md:w-fit" disabled={!subjectForm.subjectId || subjectForm.semester < 1 || subjectForm.semester > 12 || addSubject.isPending} onClick={() => addSubject.mutate()}>Fan qo'shish</Button></div>}{selected.subjects.map((subject) => <div key={subject.id} className="flex flex-col justify-between gap-2 rounded-md border p-3 sm:flex-row sm:items-center"><div><p className="font-medium">{subject.subjectCode} · {subject.subjectName}</p><p className="text-xs text-muted-foreground">{subject.semester}-semestr · {subject.credits} kredit · {subject.planItemType === "REQUIRED" ? "Majburiy" : "Tanlov"}</p></div>{canWrite && selected.status === "DRAFT" && <Button size="sm" variant="ghost" onClick={() => removeSubject.mutate({ versionId: selected.id, itemId: subject.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div>)}{selected.subjects.length === 0 && <p className="py-6 text-center text-muted-foreground">Fanlar hali qo'shilmagan.</p>}</CardContent></Card>}

    <Dialog open={!!approving} onOpenChange={(open) => { if (!open) setApproving(null); }}><DialogContent><DialogHeader><DialogTitle>Curriculumni tasdiqlash</DialogTitle><DialogDescription>Muallifdan boshqa akademik vakolatli foydalanuvchi buyruq rekvizitini kiritadi. Tasdiqdan keyin tarkib tahrirlanmaydi.</DialogDescription></DialogHeader><div className="space-y-3"><div className="space-y-2"><Label>Tasdiqlash buyrug'i raqami</Label><Input value={approval.approvalOrderNumber} onChange={(event) => setApproval({ ...approval, approvalOrderNumber: event.target.value })} /></div><div className="space-y-2"><Label>Buyruq sanasi</Label><Input type="date" max={new Date().toISOString().slice(0, 10)} value={approval.approvalOrderDate} onChange={(event) => setApproval({ ...approval, approvalOrderDate: event.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setApproving(null)}>Bekor qilish</Button><Button disabled={!approval.approvalOrderNumber.trim() || !approval.approvalOrderDate || approve.isPending} onClick={() => approve.mutate()}>Tasdiqlash</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
