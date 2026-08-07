import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Building2, CheckCircle2, Globe2, Pencil, Plus, Server, Users, XCircle } from "lucide-react";
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
import { distanceReadinessApi, distanceReadinessInputError, type DistanceReadinessProfile, type SaveDistanceReadinessInput } from "@/services/api/distance-readiness-api";

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): SaveDistanceReadinessInput => ({
  versionCode: `INFRA-${new Date().getFullYear()}-1`, title: "Masofaviy ta'lim infratuzilmasi readiness profili",
  internetProvider: "", internetCapacityMbps: 0, internetEvidenceReference: "",
  computerFacilityAddress: "", sanitationDocumentNumber: "", sanitationDocumentDate: today(), sanitationEvidenceReference: "",
  technicalStaffCount: 1, technicalStaffQualificationReference: "", plannedDistanceStudents: 1, serverCapacityStudents: 1,
  serverOwnershipType: "OWNED", serverCountryCode: "UZ", serverLocationAddress: "", serverDocumentNumber: "", serverDocumentDate: today(), serverEvidenceReference: "",
  leaseStartDate: null, leaseEndDate: null, officialWebsiteUrl: "https://", websiteHasCharter: false, websiteHasCurricula: false,
  websiteHasStaffInformation: false, websiteHasAcademicCalendar: false, websiteReviewedAt: new Date().toISOString(),
});

type ReviewAction = { profile: DistanceReadinessProfile; kind: "verify" | "reject" };

export function AdminDistanceReadiness() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const client = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<SaveDistanceReadinessInput>(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [review, setReview] = useState<ReviewAction | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const profiles = useQuery({ queryKey: ["distance-readiness"], queryFn: distanceReadinessApi.list });
  const refresh = () => client.invalidateQueries({ queryKey: ["distance-readiness"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const save = useMutation({
    mutationFn: () => editingId ? distanceReadinessApi.update(editingId, form) : distanceReadinessApi.create(form),
    onSuccess: async () => { setEditingId(null); setForm(blank()); await refresh(); toast({ title: "Readiness qoralamasi saqlandi" }); }, onError: fail,
  });
  const decide = useMutation({
    mutationFn: () => review!.kind === "verify" ? distanceReadinessApi.verify(review!.profile.id, reviewNote) : distanceReadinessApi.reject(review!.profile.id, reviewNote),
    onSuccess: async () => { setReview(null); setReviewNote(""); await refresh(); toast({ title: "Mustaqil tekshiruv qarori saqlandi" }); }, onError: fail,
  });
  const archive = useMutation({ mutationFn: distanceReadinessApi.archive, onSuccess: async () => { await refresh(); toast({ title: "Readiness profili arxivlandi" }); }, onError: fail });
  const edit = (profile: DistanceReadinessProfile) => {
    const { id: _id, minimumFiveYearLease: _lease, status: _status, createdByName: _created, reviewedAt: _reviewedAt, reviewedByName: _reviewer, reviewNote: _note, archivedAt: _archived, ...input } = profile;
    setEditingId(profile.id); setForm(input); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const error = distanceReadinessInputError(form);

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Server className="h-6 w-6" />8-band infratuzilma readiness</h1><p className="mt-1 text-sm text-muted-foreground">Internet, kompyuter xonasi, texnik shtat, server va rasmiy sayt dalillarining versionlangan auditi.</p></div>
    <Alert><AlertDescription>LMS mulk, ijara, sanitariya, shtat yoki rasmiy sayt hujjatining haqiqiyligini o'zi e'lon qilmaydi. Operator rekvizitlarni kiritadi, muallifdan boshqa vakolatli xodim asl dalilga solishtirib tasdiqlaydi; server O'zbekistonda va ijara kamida 5 yil bo'lishi serverda tekshiriladi.</AlertDescription></Alert>
    {canWrite && <Card><CardHeader><CardTitle>{editingId ? "Readiness qoralamasini tahrirlash" : "Yangi readiness qoralamasi"}</CardTitle><CardDescription>8-banddagi infratuzilma komponentlari bitta o'zgarmas tasdiqlangan snapshotga birlashtiriladi.</CardDescription></CardHeader><CardContent className="space-y-6">
      <Section title="Versiya" icon={<CheckCircle2 className="h-4 w-4" />}><Field label="Versiya kodi"><Input value={form.versionCode} onChange={(e) => setForm({ ...form, versionCode: e.target.value })} /></Field><Field label="Profil nomi"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field></Section>
      <Section title="Internet infratuzilmasi" icon={<Globe2 className="h-4 w-4" />}><Field label="Provayder"><Input value={form.internetProvider} onChange={(e) => setForm({ ...form, internetProvider: e.target.value })} /></Field><Field label="E'lon qilingan sig'im (Mbps)"><Input type="number" min={0.01} step="0.01" value={form.internetCapacityMbps} onChange={(e) => setForm({ ...form, internetCapacityMbps: Number(e.target.value) })} /></Field><Field label="Shartnoma/monitoring dalili" wide><Input value={form.internetEvidenceReference} onChange={(e) => setForm({ ...form, internetEvidenceReference: e.target.value })} /></Field></Section>
      <Section title="Kompyuter xonasi va sanitariya" icon={<Building2 className="h-4 w-4" />}><Field label="Bino yoki auditoriya manzili" wide><Input value={form.computerFacilityAddress} onChange={(e) => setForm({ ...form, computerFacilityAddress: e.target.value })} /></Field><Field label="Sanitariya hujjati raqami"><Input value={form.sanitationDocumentNumber} onChange={(e) => setForm({ ...form, sanitationDocumentNumber: e.target.value })} /></Field><Field label="Hujjat sanasi"><Input type="date" value={form.sanitationDocumentDate} onChange={(e) => setForm({ ...form, sanitationDocumentDate: e.target.value })} /></Field><Field label="Sanitariya dalili" wide><Input value={form.sanitationEvidenceReference} onChange={(e) => setForm({ ...form, sanitationEvidenceReference: e.target.value })} /></Field></Section>
      <Section title="Muhandis-texnik shtat" icon={<Users className="h-4 w-4" />}><Field label="Malakali xodimlar soni"><Input type="number" min={1} value={form.technicalStaffCount} onChange={(e) => setForm({ ...form, technicalStaffCount: Number(e.target.value) })} /></Field><Field label="Shtat va malaka dalili"><Input value={form.technicalStaffQualificationReference} onChange={(e) => setForm({ ...form, technicalStaffQualificationReference: e.target.value })} /></Field></Section>
      <Section title="Server qurilmasi" icon={<Server className="h-4 w-4" />}><Field label="Rejadagi talabalar"><Input type="number" min={1} value={form.plannedDistanceStudents} onChange={(e) => setForm({ ...form, plannedDistanceStudents: Number(e.target.value) })} /></Field><Field label="Server quvvati (talaba)"><Input type="number" min={1} value={form.serverCapacityStudents} onChange={(e) => setForm({ ...form, serverCapacityStudents: Number(e.target.value) })} /></Field><Field label="Egalik turi"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.serverOwnershipType} onChange={(e) => setForm({ ...form, serverOwnershipType: e.target.value as "OWNED" | "LEASED", leaseStartDate: null, leaseEndDate: null })}><option value="OWNED">Tashkilot mulki</option><option value="LEASED">Ijara</option></select></Field><Field label="Davlat kodi"><Input value={form.serverCountryCode} onChange={(e) => setForm({ ...form, serverCountryCode: e.target.value.toUpperCase() })} /></Field><Field label="Server manzili" wide><Input value={form.serverLocationAddress} onChange={(e) => setForm({ ...form, serverLocationAddress: e.target.value })} /></Field><Field label="Mulk/ijara hujjati raqami"><Input value={form.serverDocumentNumber} onChange={(e) => setForm({ ...form, serverDocumentNumber: e.target.value })} /></Field><Field label="Hujjat sanasi"><Input type="date" value={form.serverDocumentDate} onChange={(e) => setForm({ ...form, serverDocumentDate: e.target.value })} /></Field><Field label="Mulk/ijara dalili" wide><Input value={form.serverEvidenceReference} onChange={(e) => setForm({ ...form, serverEvidenceReference: e.target.value })} /></Field>{form.serverOwnershipType === "LEASED" && <><Field label="Ijara boshlanishi"><Input type="date" value={form.leaseStartDate ?? ""} onChange={(e) => setForm({ ...form, leaseStartDate: e.target.value || null })} /></Field><Field label="Ijara tugashi (kamida 5 yil)"><Input type="date" value={form.leaseEndDate ?? ""} onChange={(e) => setForm({ ...form, leaseEndDate: e.target.value || null })} /></Field></>}</Section>
      <Section title="Rasmiy veb-sahifa" icon={<Globe2 className="h-4 w-4" />}><Field label="HTTPS URL" wide><Input value={form.officialWebsiteUrl} onChange={(e) => setForm({ ...form, officialWebsiteUrl: e.target.value })} /></Field><Field label="Tekshiruv vaqti"><Input type="datetime-local" value={form.websiteReviewedAt.slice(0, 16)} onChange={(e) => setForm({ ...form, websiteReviewedAt: new Date(`${e.target.value}:00Z`).toISOString() })} /></Field><div className="grid gap-2 md:col-span-2 sm:grid-cols-2">{websiteChecks.map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />{label}</label>)}</div></Section>
      {error && <p className="text-sm text-amber-700">{error}</p>}<div className="flex gap-2"><Button disabled={!!error || save.isPending} onClick={() => save.mutate()}>{editingId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editingId ? "Saqlash" : "Qoralama yaratish"}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(blank()); }}>Bekor qilish</Button>}</div>
    </CardContent></Card>}
    <div className="grid gap-4 xl:grid-cols-2">{(profiles.data ?? []).map((profile) => <ProfileCard key={profile.id} profile={profile} canWrite={canWrite} onEdit={edit} onReview={(kind) => { setReview({ profile, kind }); setReviewNote(""); }} onArchive={() => archive.mutate(profile.id)} />)}{profiles.data?.length === 0 && <Card className="xl:col-span-2"><CardContent className="py-10 text-center text-red-700">Tasdiqlangan infratuzilma readiness profili yo'q; 8-band compliance dalili NON_COMPLIANT.</CardContent></Card>}</div>
    <Dialog open={!!review} onOpenChange={(open) => { if (!open) setReview(null); }}><DialogContent><DialogHeader><DialogTitle>{review?.kind === "verify" ? "Readiness profilini tasdiqlash" : "Readiness profilini rad etish"}</DialogTitle><DialogDescription>Muallifdan boshqa ACADEMIC_WRITE vakolatli xodim dalil rekvizitlarini asl hujjat va rasmiy saytga solishtiradi.</DialogDescription></DialogHeader><Field label="Asoslangan tekshiruv izohi"><Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} /></Field><DialogFooter><Button variant="outline" onClick={() => setReview(null)}>Bekor qilish</Button><Button variant={review?.kind === "reject" ? "destructive" : "default"} disabled={reviewNote.trim().length < 10 || decide.isPending} onClick={() => decide.mutate()}>{review?.kind === "verify" ? "Tasdiqlash" : "Rad etish"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

const websiteChecks: Array<["websiteHasCharter" | "websiteHasCurricula" | "websiteHasStaffInformation" | "websiteHasAcademicCalendar", string]> = [
  ["websiteHasCharter", "Tashkilot nizomi yoki ustavi"], ["websiteHasCurricula", "O'quv reja va dasturlari"],
  ["websiteHasStaffInformation", "Pedagog kadrlar haqida ma'lumot"], ["websiteHasAcademicCalendar", "Akademik kalendar"],
];

function ProfileCard({ profile, canWrite, onEdit, onReview, onArchive }: { profile: DistanceReadinessProfile; canWrite: boolean; onEdit: (p: DistanceReadinessProfile) => void; onReview: (kind: "verify" | "reject") => void; onArchive: () => void }) {
  return <Card className={profile.status === "VERIFIED" ? "border-emerald-500" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle>{profile.versionCode} · {profile.title}</CardTitle><CardDescription>Muallif: {profile.createdByName}</CardDescription></div><Badge variant={profile.status === "ARCHIVED" || profile.status === "REJECTED" ? "outline" : "secondary"}>{profile.status}</Badge></div></CardHeader><CardContent className="space-y-3 text-sm"><div className="grid gap-2 sm:grid-cols-2"><p><b>Internet:</b> {profile.internetProvider}, {profile.internetCapacityMbps} Mbps</p><p><b>Texnik shtat:</b> {profile.technicalStaffCount}</p><p><b>Server:</b> {profile.serverOwnershipType}, {profile.serverCountryCode}, {profile.serverCapacityStudents}/{profile.plannedDistanceStudents} talaba</p><p><b>Kamida 5 yil:</b> {profile.minimumFiveYearLease ? "ha" : "yo'q"}</p></div><p><b>Kompyuter xonasi:</b> {profile.computerFacilityAddress} · {profile.sanitationDocumentNumber}</p><p><b>Rasmiy sayt:</b> <a className="text-blue-600 underline" href={profile.officialWebsiteUrl} target="_blank" rel="noreferrer">{profile.officialWebsiteUrl}</a></p><div className="flex flex-wrap gap-1">{websiteChecks.map(([key, label]) => <Badge key={key} variant={profile[key] ? "secondary" : "destructive"}>{label}</Badge>)}</div>{profile.reviewNote && <p><b>Mustaqil qaror:</b> {profile.reviewNote} — {profile.reviewedByName}</p>}{canWrite && profile.status === "DRAFT" && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => onEdit(profile)}><Pencil className="mr-1 h-3 w-3" />Tahrirlash</Button><Button size="sm" onClick={() => onReview("verify")}><CheckCircle2 className="mr-1 h-3 w-3" />Tasdiqlash</Button><Button size="sm" variant="destructive" onClick={() => onReview("reject")}><XCircle className="mr-1 h-3 w-3" />Rad etish</Button></div>}{canWrite && profile.status === "VERIFIED" && <Button size="sm" variant="outline" onClick={onArchive}><Archive className="mr-1 h-3 w-3" />Arxivlash</Button>}</CardContent></Card>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <div className="space-y-3 rounded-lg border p-4"><h3 className="flex items-center gap-2 font-semibold">{icon}{title}</h3><div className="grid gap-3 md:grid-cols-2">{children}</div></div>; }
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <div className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>; }

