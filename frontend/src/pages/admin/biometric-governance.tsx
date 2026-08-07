import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Play, Plus, ShieldCheck, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { biometricGovernanceApi, biometricPolicyInputError, type BiometricPolicy, type SaveBiometricPolicyInput } from "@/services/api/biometric-governance-api";

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): SaveBiometricPolicyInput => ({
  versionCode: `BIO-${new Date().getFullYear()}-1`, title: "Proktoring biometrik ma'lumotlarini boshqarish siyosati",
  purposeText: "Proktorli test boshlanishidan oldin talaba shaxsini va faol harakatini tekshirish",
  legalBasis: "", consentText: "", privacyNotice: "", documentNumber: "", documentDate: today(), documentReference: "",
  faceTemplateRetentionDays: 30, proctoringEvidenceRetentionDays: 180,
});

export function AdminBiometricGovernance() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "USER_MANAGE");
  const client = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<SaveBiometricPolicyInput>(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [publishing, setPublishing] = useState<BiometricPolicy | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const policies = useQuery({ queryKey: ["biometric-governance", "policies"], queryFn: biometricGovernanceApi.listPolicies });
  const refresh = () => client.invalidateQueries({ queryKey: ["biometric-governance"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const save = useMutation({ mutationFn: () => editingId ? biometricGovernanceApi.updatePolicy(editingId, form) : biometricGovernanceApi.createPolicy(form), onSuccess: async () => { setEditingId(null); setForm(blank()); await refresh(); toast({ title: "Biometrik siyosat qoralamasi saqlandi" }); }, onError: fail });
  const publish = useMutation({ mutationFn: () => biometricGovernanceApi.publishPolicy(publishing!.id, approvalNote), onSuccess: async () => { setPublishing(null); setApprovalNote(""); await refresh(); toast({ title: "Biometrik siyosat tasdiqlandi" }); }, onError: fail });
  const archive = useMutation({ mutationFn: biometricGovernanceApi.archivePolicy, onSuccess: async () => { await refresh(); toast({ title: "Siyosat arxivlandi; yangi roziliklar fail-closed bloklanadi" }); }, onError: fail });
  const retention = useMutation({ mutationFn: biometricGovernanceApi.runRetention, onSuccess: (result) => toast({ title: "Retention bajarildi", description: `${result.faceTemplatesPurged} yuz shabloni, ${result.proctoringEvidencePurged} proktoring dalili tozalandi.` }), onError: fail });
  const edit = (policy: BiometricPolicy) => { setEditingId(policy.id); setForm({ versionCode: policy.versionCode, title: policy.title, purposeText: policy.purposeText, legalBasis: policy.legalBasis, consentText: policy.consentText, privacyNotice: policy.privacyNotice, documentNumber: policy.documentNumber, documentDate: policy.documentDate, documentReference: policy.documentReference, faceTemplateRetentionDays: policy.faceTemplateRetentionDays, proctoringEvidenceRetentionDays: policy.proctoringEvidenceRetentionDays }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const error = biometricPolicyInputError(form);

  return <div className="space-y-6 p-3 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><ShieldCheck className="h-6 w-6" />Biometrik boshqaruv</h1><p className="text-sm text-muted-foreground">Proktoring uchun versionlangan siyosat, aniq rozilik va avtomatik o'chirish nazorati.</p></div>{canWrite && <Button variant="outline" disabled={retention.isPending} onClick={() => retention.mutate()}><Play className="mr-2 h-4 w-4" />Retentionni ishga tushirish</Button>}</div>
    <Alert><AlertDescription>LMS yuridik siyosat mazmuni yoki retention muddatini o'zi belgilamaydi. Productionda faqat yuridik va axborot xavfsizligi tasdiqlagan hujjat kiritiladi; amaldagi PUBLISHED siyosatsiz kamera challenge'i va yuz shabloni yozilishi bloklanadi.</AlertDescription></Alert>
    {canWrite && <Card><CardHeader><CardTitle>{editingId ? "Qoralamani tahrirlash" : "Yangi siyosat qoralamasi"}</CardTitle><CardDescription>Muallifdan boshqa USER_MANAGE vakolatli xodim tasdiqlaydi.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
      <Field label="Versiya kodi"><Input value={form.versionCode} onChange={(e) => setForm({ ...form, versionCode: e.target.value })} /></Field><Field label="Siyosat nomi"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
      <Field label="Qayta ishlash maqsadi" wide><Textarea value={form.purposeText} onChange={(e) => setForm({ ...form, purposeText: e.target.value })} /></Field><Field label="Huquqiy asos" wide><Textarea value={form.legalBasis} onChange={(e) => setForm({ ...form, legalBasis: e.target.value })} /></Field>
      <Field label="Aniq rozilik matni" wide><Textarea className="min-h-24" value={form.consentText} onChange={(e) => setForm({ ...form, consentText: e.target.value })} /></Field><Field label="Maxfiylik xabarnomasi" wide><Textarea className="min-h-24" value={form.privacyNotice} onChange={(e) => setForm({ ...form, privacyNotice: e.target.value })} /></Field>
      <Field label="Tasdiqlovchi hujjat raqami"><Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} /></Field><Field label="Hujjat sanasi"><Input type="date" value={form.documentDate} onChange={(e) => setForm({ ...form, documentDate: e.target.value })} /></Field><Field label="Hujjat rekviziti" wide><Input value={form.documentReference} onChange={(e) => setForm({ ...form, documentReference: e.target.value })} /></Field>
      <Field label="Yuz shabloni retention (kun)"><Input type="number" min={1} max={3650} value={form.faceTemplateRetentionDays} onChange={(e) => setForm({ ...form, faceTemplateRetentionDays: Number(e.target.value) })} /></Field><Field label="Proktoring dalili retention (kun)"><Input type="number" min={1} max={3650} value={form.proctoringEvidenceRetentionDays} onChange={(e) => setForm({ ...form, proctoringEvidenceRetentionDays: Number(e.target.value) })} /></Field>
      {error && <p className="text-sm text-amber-700 md:col-span-2">{error}</p>}<div className="flex gap-2 md:col-span-2"><Button disabled={!!error || save.isPending} onClick={() => save.mutate()}>{editingId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editingId ? "Saqlash" : "Qoralama yaratish"}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(blank()); }}>Bekor qilish</Button>}</div>
    </CardContent></Card>}
    <div className="grid gap-4 lg:grid-cols-2">{(policies.data ?? []).map((policy) => <Card key={policy.id} className={policy.status === "PUBLISHED" ? "border-emerald-500" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle>{policy.versionCode} · {policy.title}</CardTitle><CardDescription>{policy.documentNumber} · {policy.documentDate}</CardDescription></div><Badge variant={policy.status === "ARCHIVED" ? "outline" : "secondary"}>{policy.status}</Badge></div></CardHeader><CardContent className="space-y-3 text-sm"><p><b>Maqsad:</b> {policy.purposeText}</p><p><b>Huquqiy asos:</b> {policy.legalBasis}</p><div className="rounded-md bg-muted p-3"><b>Retention:</b> yuz shabloni {policy.faceTemplateRetentionDays} kun; proktoring dalili {policy.proctoringEvidenceRetentionDays} kun.<br/><b>Statement SHA-256:</b> <code className="break-all text-xs">{policy.statementHash}</code></div><p><b>Rozilik matni:</b> {policy.consentText}</p><p><b>Maxfiylik:</b> {policy.privacyNotice}</p>{policy.approvalNote && <p><b>Mustaqil tasdiq:</b> {policy.approvalNote} — {policy.publishedByName}</p>}{canWrite && policy.status === "DRAFT" && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => edit(policy)}><Pencil className="mr-1 h-3 w-3" />Tahrirlash</Button><Button size="sm" onClick={() => { setPublishing(policy); setApprovalNote(""); }}><Upload className="mr-1 h-3 w-3" />Tasdiqlash</Button></div>}{canWrite && policy.status === "PUBLISHED" && <Button size="sm" variant="outline" onClick={() => archive.mutate(policy.id)}><Archive className="mr-1 h-3 w-3" />Arxivlash</Button>}</CardContent></Card>)}{policies.data?.length === 0 && <Card className="lg:col-span-2"><CardContent className="py-10 text-center text-red-700">Tasdiqlangan biometrik siyosat yo'q. Proktorli test fail-closed bloklanadi.</CardContent></Card>}</div>
    <Dialog open={!!publishing} onOpenChange={(open) => { if (!open) setPublishing(null); }}><DialogContent><DialogHeader><DialogTitle>Siyosatni mustaqil tasdiqlash</DialogTitle><DialogDescription>Hujjat rekviziti, huquqiy asos, rozilik matni va retention muddatlarini muallifdan boshqa xodim tekshiradi.</DialogDescription></DialogHeader><Field label="Tasdiqlash izohi"><Textarea value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} /></Field><DialogFooter><Button variant="outline" onClick={() => setPublishing(null)}>Bekor qilish</Button><Button disabled={approvalNote.trim().length < 10 || publish.isPending} onClick={() => publish.mutate()}>Tasdiqlash</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>;
}
