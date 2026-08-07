import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle2, Landmark, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { listPrograms } from "@/lib/academic-api";
import { hasAuthority } from "@/lib/rbac-api";
import { admissionPolicyApi, admissionPolicyInputError, authorityForGovernance, type DistanceAdmissionPolicy, type InstitutionGovernanceType, type SaveDistanceAdmissionPolicyInput } from "@/services/api/admission-policy-api";

const currentAcademicYear = () => { const now = new Date(); const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1; return `${year}-${year + 1}`; };
const initialForm = (): SaveDistanceAdmissionPolicyInput => ({
  programId: 0, academicYear: currentAcademicYear(), versionCode: "", institutionGovernanceType: "STATE_STANDARD",
  approvalAuthorityType: "SUBORDINATE_MINISTRY_AGENCY", institutionName: "", approvingAuthorityName: "",
  admissionQuota: 1, contractAmount: 0, higherEducationMinistryAgreementReference: "", economyMinistryAgreementReference: "",
});
const governanceLabel: Record<InstitutionGovernanceType, string> = {
  STATE_STANDARD: "Davlat OTM", STATE_FINANCIALLY_AUTONOMOUS: "Moliyaviy mustaqil davlat OTM", NON_STATE: "Nodavlat OTM",
};

export function AdminAdmissionPolicies() {
  const { user } = useAuth(); const canWrite = hasAuthority(user, "ACADEMIC_WRITE"); const { toast } = useToast(); const client = useQueryClient();
  const [form, setForm] = useState<SaveDistanceAdmissionPolicyInput>(initialForm); const [search, setSearch] = useState("");
  const [approving, setApproving] = useState<DistanceAdmissionPolicy | null>(null);
  const [approval, setApproval] = useState({ approvalDocumentNumber: "", approvalDocumentDate: new Date().toISOString().slice(0, 10), approvalDocumentReference: "" });
  const policies = useQuery({ queryKey: ["distance-admission-policies"], queryFn: admissionPolicyApi.list });
  const programs = useQuery({ queryKey: ["programs", "admission-policy-options"], queryFn: () => listPrograms() });
  const refresh = () => client.invalidateQueries({ queryKey: ["distance-admission-policies"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const create = useMutation({ mutationFn: () => admissionPolicyApi.create(form), onSuccess: async () => { setForm(initialForm()); await refresh(); toast({ title: "Qabul siyosati qoralamasi yaratildi" }); }, onError: fail });
  const approve = useMutation({ mutationFn: () => admissionPolicyApi.approve(approving!.id, approval), onSuccess: async () => { setApproving(null); await refresh(); toast({ title: "Qabul parametri va kontrakt qiymati tasdiqlandi" }); }, onError: fail });
  const archive = useMutation({ mutationFn: admissionPolicyApi.archive, onSuccess: async () => { await refresh(); toast({ title: "Qabul siyosati arxivlandi" }); }, onError: fail });
  const filtered = useMemo(() => (policies.data ?? []).filter((policy) => !search.trim() || `${policy.programName} ${policy.institutionName} ${policy.academicYear} ${policy.approvalDocumentNumber ?? ""}`.toLowerCase().includes(search.toLowerCase())), [policies.data, search]);
  const changeGovernance = (type: InstitutionGovernanceType) => setForm({ ...form, institutionGovernanceType: type, approvalAuthorityType: authorityForGovernance(type), higherEducationMinistryAgreementReference: type === "STATE_STANDARD" ? form.higherEducationMinistryAgreementReference : null, economyMinistryAgreementReference: type === "STATE_STANDARD" ? form.economyMinistryAgreementReference : null });
  const error = admissionPolicyInputError(form);

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">Qabul parametrlari va kontrakt</h1><p className="text-sm text-muted-foreground">559-son qaror 15-bandi: OTM turiga mos vakolatli tasdiq, yillik kvota va to'lov-kontrakt qiymati.</p></div>
    {canWrite && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" />Yangi siyosat versiyasi</CardTitle><CardDescription>Tasdiqlangan siyosatsiz masofaviy qabul, transfer yoki qayta tiklash amalga oshmaydi.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2"><Label>Masofaviy dastur</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.programId} onChange={(e) => setForm({ ...form, programId: Number(e.target.value) })}><option value={0}>Dastur tanlang</option>{(programs.data ?? []).filter((p) => p.active && p.distanceEnabled).map((p) => <option key={p.id} value={p.id}>{p.code ? `${p.code} - ` : ""}{p.name}</option>)}</select></div>
      <div className="space-y-2"><Label>Versiya kodi</Label><Input value={form.versionCode} onChange={(e) => setForm({ ...form, versionCode: e.target.value })} placeholder="QABUL-2026-01" /></div>
      <div className="space-y-2"><Label>O'quv yili</Label><Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></div>
      <div className="space-y-2"><Label>OTM boshqaruv turi</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.institutionGovernanceType} onChange={(e) => changeGovernance(e.target.value as InstitutionGovernanceType)}>{Object.entries(governanceLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="space-y-2"><Label>OTM nomi</Label><Input value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} /></div>
      <div className="space-y-2"><Label>Tasdiqlovchi organ</Label><Input value={form.approvingAuthorityName} onChange={(e) => setForm({ ...form, approvingAuthorityName: e.target.value })} placeholder={form.approvalAuthorityType.replace(/_/g, " ")} /></div>
      <div className="space-y-2"><Label>Qabul parametri (nafar)</Label><Input type="number" min={1} value={form.admissionQuota} onChange={(e) => setForm({ ...form, admissionQuota: Number(e.target.value) })} /></div>
      <div className="space-y-2"><Label>Kontrakt qiymati (UZS)</Label><Input type="number" min={0.01} step="0.01" value={form.contractAmount || ""} onChange={(e) => setForm({ ...form, contractAmount: Number(e.target.value) })} /></div>
      {form.institutionGovernanceType === "STATE_STANDARD" && <><div className="space-y-2"><Label>Oliy ta'lim vazirligi kelishuvi</Label><Input value={form.higherEducationMinistryAgreementReference ?? ""} onChange={(e) => setForm({ ...form, higherEducationMinistryAgreementReference: e.target.value })} /></div><div className="space-y-2"><Label>Iqtisodiyot vazirligi kelishuvi</Label><Input value={form.economyMinistryAgreementReference ?? ""} onChange={(e) => setForm({ ...form, economyMinistryAgreementReference: e.target.value })} /></div></>}
      {error && <p className="text-sm text-amber-700 md:col-span-2">{error}</p>}<Button className="md:col-span-2 md:w-fit" disabled={!!error || create.isPending} onClick={() => create.mutate()}><Plus className="mr-2 h-4 w-4" />Qoralama yaratish</Button>
    </CardContent></Card>}
    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="Dastur, OTM, yil yoki hujjat bo'yicha qidiring" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    <div className="grid gap-4 lg:grid-cols-2">{filtered.map((policy) => <Card key={policy.id}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-lg">{policy.programName}</CardTitle><CardDescription>{policy.versionCode} · {policy.academicYear} · {governanceLabel[policy.institutionGovernanceType]}</CardDescription></div><Badge>{policy.status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm"><b>{policy.institutionName}</b><br/>Tasdiqlovchi: {policy.approvingAuthorityName}</p><p className="rounded-md bg-muted p-3 text-sm"><b>{policy.admissionQuota}</b> nafar · <b>{Number(policy.contractAmount).toLocaleString("uz-UZ")}</b> {policy.currency}</p>{policy.approvalDocumentNumber && <p className="text-sm text-emerald-700"><CheckCircle2 className="mr-1 inline h-4 w-4" />{policy.approvalDocumentNumber}, {policy.approvalDocumentDate} · {policy.approvedByName}</p>}<div className="flex gap-2">{canWrite && policy.status === "DRAFT" && <Button size="sm" onClick={() => setApproving(policy)}>Tasdiqlash</Button>}{canWrite && policy.status === "APPROVED" && <Button size="sm" variant="outline" onClick={() => archive.mutate(policy.id)}><Archive className="mr-1 h-3 w-3" />Arxivlash</Button>}</div></CardContent></Card>)}{filtered.length === 0 && <Card className="lg:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Qabul siyosati topilmadi.</CardContent></Card>}</div>
    <Dialog open={!!approving} onOpenChange={(open) => { if (!open) setApproving(null); }}><DialogContent><DialogHeader><DialogTitle>Qabul siyosatini tasdiqlash</DialogTitle><DialogDescription>Muallifdan boshqa vakolatli foydalanuvchi real tasdiqlash hujjati rekvizitlarini kiritadi. Tasdiqdan keyin qiymatlar o'zgarmaydi.</DialogDescription></DialogHeader><div className="space-y-3"><div className="space-y-2"><Label>Hujjat raqami</Label><Input value={approval.approvalDocumentNumber} onChange={(e) => setApproval({ ...approval, approvalDocumentNumber: e.target.value })} /></div><div className="space-y-2"><Label>Hujjat sanasi</Label><Input type="date" max={new Date().toISOString().slice(0, 10)} value={approval.approvalDocumentDate} onChange={(e) => setApproval({ ...approval, approvalDocumentDate: e.target.value })} /></div><div className="space-y-2"><Label>Hujjat rekviziti yoki reestr manzili</Label><Input value={approval.approvalDocumentReference} onChange={(e) => setApproval({ ...approval, approvalDocumentReference: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setApproving(null)}>Bekor qilish</Button><Button disabled={!approval.approvalDocumentNumber.trim() || !approval.approvalDocumentDate || !approval.approvalDocumentReference.trim() || approve.isPending} onClick={() => approve.mutate()}>Tasdiqlash</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
