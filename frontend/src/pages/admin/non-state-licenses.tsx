import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Ban, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
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
import { nonStateLicenseApi, nonStateLicenseInputError, type NonStateEducationLicense, type SaveNonStateLicenseInput } from "@/services/api/non-state-license-api";

const today = () => new Date().toISOString().slice(0, 10);
const initialForm = (): SaveNonStateLicenseInput => ({
  institutionName: "", licenseNumber: "", issuingAuthority: "", issueDate: today(), validFrom: today(), validUntil: null, officialRegistryReference: "",
});

export function AdminNonStateLicenses() {
  const { user } = useAuth(); const canWrite = hasAuthority(user, "ACADEMIC_WRITE"); const { toast } = useToast(); const client = useQueryClient();
  const [form, setForm] = useState<SaveNonStateLicenseInput>(initialForm); const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scopeProgram, setScopeProgram] = useState<Record<number, number>>({});
  const [verifying, setVerifying] = useState<NonStateEducationLicense | null>(null); const [verificationEvidence, setVerificationEvidence] = useState("");
  const [revoking, setRevoking] = useState<NonStateEducationLicense | null>(null); const [revocation, setRevocation] = useState({ reason: "", documentReference: "" });
  const licenses = useQuery({ queryKey: ["non-state-licenses"], queryFn: nonStateLicenseApi.list });
  const programs = useQuery({ queryKey: ["programs", "license-options"], queryFn: () => listPrograms() });
  const refresh = () => client.invalidateQueries({ queryKey: ["non-state-licenses"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const save = useMutation({ mutationFn: () => editingId ? nonStateLicenseApi.update(editingId, form) : nonStateLicenseApi.create(form), onSuccess: async () => { setForm(initialForm()); setEditingId(null); await refresh(); toast({ title: editingId ? "Litsenziya qoralamasi yangilandi" : "Litsenziya qoralamasi yaratildi" }); }, onError: fail });
  const addScope = useMutation({ mutationFn: ({ id, programId }: { id: number; programId: number }) => nonStateLicenseApi.addScope(id, programId), onSuccess: async () => { await refresh(); toast({ title: "Dastur litsenziya qamroviga qo'shildi" }); }, onError: fail });
  const removeScope = useMutation({ mutationFn: ({ id, scopeId }: { id: number; scopeId: number }) => nonStateLicenseApi.removeScope(id, scopeId), onSuccess: refresh, onError: fail });
  const verifyLicense = useMutation({ mutationFn: () => nonStateLicenseApi.verify(verifying!.id, verificationEvidence), onSuccess: async () => { setVerifying(null); setVerificationEvidence(""); await refresh(); toast({ title: "Litsenziya rasmiy dalil bilan tekshirildi" }); }, onError: fail });
  const revokeLicense = useMutation({ mutationFn: () => nonStateLicenseApi.revoke(revoking!.id, revocation.reason, revocation.documentReference), onSuccess: async () => { setRevoking(null); setRevocation({ reason: "", documentReference: "" }); await refresh(); toast({ title: "Litsenziya bekor qilindi" }); }, onError: fail });
  const eligiblePrograms = (programs.data ?? []).filter((p) => p.active && p.distanceEnabled && ["BACHELOR", "MASTER"].includes(p.degreeLevel ?? "") && !!p.code?.trim());
  const filtered = useMemo(() => (licenses.data ?? []).filter((license) => !search.trim() || `${license.institutionName} ${license.licenseNumber} ${license.issuingAuthority} ${license.scopes.map((scope) => scope.programName).join(" ")}`.toLowerCase().includes(search.toLowerCase())), [licenses.data, search]);
  const error = nonStateLicenseInputError(form);
  const edit = (license: NonStateEducationLicense) => { setEditingId(license.id); setForm({ institutionName: license.institutionName, licenseNumber: license.licenseNumber, issuingAuthority: license.issuingAuthority, issueDate: license.issueDate, validFrom: license.validFrom, validUntil: license.validUntil, officialRegistryReference: license.officialRegistryReference }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">Nodavlat OTM litsenziyalari</h1><p className="text-sm text-muted-foreground">559-son qaror 16-bandi: masofaviy bakalavriat yo'nalishi va magistratura mutaxassisligi litsenziyaning o'zida qayd etiladi.</p></div>
    {canWrite && <Card><CardHeader><CardTitle className="flex items-center gap-2"><BadgeCheck className="h-5 w-5" />{editingId ? "Litsenziya qoralamasini tahrirlash" : "Yangi litsenziya qoralamasi"}</CardTitle><CardDescription>Rasmiy reyestr rekviziti, amal qilish davri va dastur qamrovi alohida tekshiriladi.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <div className="space-y-2"><Label>Nodavlat OTM nomi</Label><Input value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} /></div>
      <div className="space-y-2"><Label>Litsenziya raqami</Label><Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></div>
      <div className="space-y-2"><Label>Litsenziya bergan organ</Label><Input value={form.issuingAuthority} onChange={(e) => setForm({ ...form, issuingAuthority: e.target.value })} /></div>
      <div className="space-y-2"><Label>Rasmiy reyestr rekviziti</Label><Input value={form.officialRegistryReference} onChange={(e) => setForm({ ...form, officialRegistryReference: e.target.value })} placeholder="Reyestr URL yoki yozuv identifikatori" /></div>
      <div className="space-y-2"><Label>Berilgan sana</Label><Input type="date" max={today()} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} /></div>
      <div className="space-y-2"><Label>Amal qilish boshi</Label><Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} /></div>
      <div className="space-y-2"><Label>Amal qilish tugashi (ixtiyoriy)</Label><Input type="date" value={form.validUntil ?? ""} onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })} /></div>
      {error && <p className="text-sm text-amber-700 md:col-span-2">{error}</p>}<div className="flex gap-2 md:col-span-2"><Button disabled={!!error || save.isPending} onClick={() => save.mutate()}>{editingId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editingId ? "Saqlash" : "Qoralama yaratish"}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(initialForm()); }}>Bekor qilish</Button>}</div>
    </CardContent></Card>}
    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="OTM, litsenziya yoki dastur bo'yicha qidiring" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    <div className="grid gap-4 lg:grid-cols-2">{filtered.map((license) => <Card key={license.id}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="text-lg">{license.institutionName}</CardTitle><CardDescription>{license.licenseNumber} · {license.issuingAuthority}</CardDescription></div><Badge variant={license.status === "REVOKED" ? "destructive" : "secondary"}>{license.status}{license.effective ? " · AMALDA" : ""}</Badge></div></CardHeader><CardContent className="space-y-3">
      <p className="text-sm">Berilgan: {license.issueDate} · Amal qilish: {license.validFrom} — {license.validUntil ?? "muddatsiz"}<br/>Reyestr: {license.officialRegistryReference}</p>
      <div className="space-y-2"><p className="text-sm font-medium">Litsenziyada qayd etilgan dasturlar</p>{license.scopes.map((scope) => <div key={scope.id} className="flex items-center justify-between rounded-md border p-2 text-sm"><span><b>{scope.programCode}</b> · {scope.programName} ({scope.degreeLevel})</span>{canWrite && license.status === "DRAFT" && <Button size="icon" variant="ghost" aria-label="Qamrovni olib tashlash" onClick={() => removeScope.mutate({ id: license.id, scopeId: scope.id })}><Trash2 className="h-4 w-4" /></Button>}</div>)}{license.scopes.length === 0 && <p className="text-sm text-amber-700">Hali dastur qayd etilmagan.</p>}</div>
      {canWrite && license.status === "DRAFT" && <div className="flex gap-2"><select className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm" value={scopeProgram[license.id] ?? 0} onChange={(e) => setScopeProgram({ ...scopeProgram, [license.id]: Number(e.target.value) })}><option value={0}>Dastur tanlang</option>{eligiblePrograms.filter((p) => !license.scopes.some((scope) => scope.programId === p.id)).map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}</select><Button variant="outline" disabled={!scopeProgram[license.id]} onClick={() => addScope.mutate({ id: license.id, programId: scopeProgram[license.id] })}><Plus className="h-4 w-4" /></Button></div>}
      {license.verificationEvidence && <p className="text-sm text-emerald-700"><ShieldCheck className="mr-1 inline h-4 w-4" />{license.verificationEvidence} · {license.verifiedByName}</p>}
      <div className="flex gap-2">{canWrite && license.status === "DRAFT" && <><Button size="sm" variant="outline" onClick={() => edit(license)}><Pencil className="mr-1 h-4 w-4" />Tahrirlash</Button><Button size="sm" disabled={license.scopes.length === 0} onClick={() => setVerifying(license)}>Tekshirish</Button></>}{canWrite && license.status === "VERIFIED" && <Button size="sm" variant="destructive" onClick={() => setRevoking(license)}><Ban className="mr-1 h-4 w-4" />Bekor qilish</Button>}</div>
    </CardContent></Card>)}{filtered.length === 0 && <Card className="lg:col-span-2"><CardContent className="py-10 text-center text-muted-foreground">Litsenziya topilmadi.</CardContent></Card>}</div>
    <Dialog open={!!verifying} onOpenChange={(open) => { if (!open) setVerifying(null); }}><DialogContent><DialogHeader><DialogTitle>Litsenziyani tekshirish</DialogTitle><DialogDescription>Muallifdan boshqa vakolatli foydalanuvchi rasmiy reyestrdagi tekshiruv dalilini kiritadi. Dastur snapshotlari tasdiqdan keyin o'zgarmaydi.</DialogDescription></DialogHeader><div className="space-y-2"><Label>Tekshiruv dalili</Label><Input value={verificationEvidence} onChange={(e) => setVerificationEvidence(e.target.value)} placeholder="Reyestr yozuvi, tekshiruv bayonnomasi" /></div><DialogFooter><Button variant="outline" onClick={() => setVerifying(null)}>Bekor qilish</Button><Button disabled={!verificationEvidence.trim() || verifyLicense.isPending} onClick={() => verifyLicense.mutate()}>Tekshirish</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!revoking} onOpenChange={(open) => { if (!open) setRevoking(null); }}><DialogContent><DialogHeader><DialogTitle>Litsenziyani bekor qilish</DialogTitle><DialogDescription>Bekor qilingan litsenziya qabul, transfer va qayta tiklash uchun darhol yaroqsiz bo'ladi.</DialogDescription></DialogHeader><div className="space-y-3"><div className="space-y-2"><Label>Sabab (kamida 10 belgi)</Label><Input value={revocation.reason} onChange={(e) => setRevocation({ ...revocation, reason: e.target.value })} /></div><div className="space-y-2"><Label>Bekor qilish hujjati</Label><Input value={revocation.documentReference} onChange={(e) => setRevocation({ ...revocation, documentReference: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setRevoking(null)}>Ortga</Button><Button variant="destructive" disabled={revocation.reason.trim().length < 10 || !revocation.documentReference.trim() || revokeLicense.isPending} onClick={() => revokeLicense.mutate()}>Bekor qilish</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
