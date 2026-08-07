import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle2, ExternalLink, FileText, Globe2, Pencil, Plus, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
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
import { categoryLabels, officialSitePublicationApi, officialSitePublicationInputError, type OfficialSitePublication, type OfficialSitePublicationCategory, type SaveOfficialSitePublicationInput } from "@/services/api/official-site-publication-api";

const today = () => new Date().toISOString().slice(0, 10);
const blank = (): SaveOfficialSitePublicationInput => ({
  category: "CHARTER_OR_STATUTE", slug: "", versionCode: "1.0", title: "", summary: "",
  sourceDocumentNumber: "", sourceDocumentDate: today(), sourceReference: "", effectiveFrom: today(), effectiveTo: null,
});
type Review = { publication: OfficialSitePublication; kind: "publish" | "reject" };

export function AdminOfficialSitePublications() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [form, setForm] = useState<SaveOfficialSitePublicationInput>(blank);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const publications = useQuery({ queryKey: ["official-site-publications"], queryFn: officialSitePublicationApi.list });
  const refresh = () => client.invalidateQueries({ queryKey: ["official-site-publications"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const save = useMutation({
    mutationFn: () => editingId ? officialSitePublicationApi.update(editingId, form) : officialSitePublicationApi.create(form),
    onSuccess: async () => { setEditingId(null); setForm(blank()); await refresh(); toast({ title: "Ommaviy nashr qoralamasi saqlandi" }); }, onError: fail,
  });
  const decide = useMutation({
    mutationFn: () => review!.kind === "publish" ? officialSitePublicationApi.publish(review!.publication.id, reviewNote) : officialSitePublicationApi.reject(review!.publication.id, reviewNote),
    onSuccess: async () => { setReview(null); setReviewNote(""); await refresh(); toast({ title: "Mustaqil tekshiruv qarori saqlandi" }); }, onError: fail,
  });
  const archive = useMutation({ mutationFn: officialSitePublicationApi.archive, onSuccess: refresh, onError: fail });
  const edit = (item: OfficialSitePublication) => {
    const { id: _id, status: _status, currentlyVisible: _visible, createdByName: _creator, reviewedAt: _reviewed, reviewedByName: _reviewer, reviewNote: _note, archivedAt: _archived, ...input } = item;
    setEditingId(item.id); setForm(input); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const error = officialSitePublicationInputError(form);

  return <div className="space-y-6 p-3 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><Globe2 className="h-6 w-6" />Rasmiy sayt axborotlari</h1><p className="mt-1 text-sm text-muted-foreground">559-son qaror 8-bandidagi to'rtta majburiy ommaviy axborot toifasi.</p></div><Button asChild variant="outline"><Link to="/public/institution"><ExternalLink className="mr-2 h-4 w-4" />Ommaviy sahifani ko'rish</Link></Button></div>
    <Alert><AlertDescription>Qoralama ommaga ko'rinmaydi. Muallifdan boshqa vakolatli xodim manba hujjat va aynan ko'rsatiladigan matnni tekshirib PUBLISHED qilgandagina public sahifaga chiqadi. Har toifada kamida bitta amaldagi nashr bo'lmasa infratuzilma tasdig'i bloklanadi.</AlertDescription></Alert>
    {canWrite && <Card><CardHeader><CardTitle>{editingId ? "Nashr qoralamasini tahrirlash" : "Yangi ommaviy nashr qoralamasi"}</CardTitle><CardDescription>Shaxsiy yoki maxfiy ma'lumot kiritmang; faqat rasmiy saytda e'lon qilinishi tasdiqlangan mazmun.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
      <Field label="Toifa"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as OfficialSitePublicationCategory })}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="Slug"><Input value={form.slug} placeholder="institution-charter" onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} /></Field>
      <Field label="Versiya"><Input value={form.versionCode} onChange={(e) => setForm({ ...form, versionCode: e.target.value })} /></Field>
      <Field label="Sarlavha"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
      <Field label="Ommaga ko'rsatiladigan mazmun" wide><Textarea rows={5} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
      <Field label="Manba hujjat raqami"><Input value={form.sourceDocumentNumber} onChange={(e) => setForm({ ...form, sourceDocumentNumber: e.target.value })} /></Field>
      <Field label="Manba hujjat sanasi"><Input type="date" value={form.sourceDocumentDate} onChange={(e) => setForm({ ...form, sourceDocumentDate: e.target.value })} /></Field>
      <Field label="Manba havolasi yoki evidence reference" wide><Input value={form.sourceReference} onChange={(e) => setForm({ ...form, sourceReference: e.target.value })} /></Field>
      <Field label="Amal boshlanishi"><Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></Field>
      <Field label="Amal tugashi (ixtiyoriy)"><Input type="date" value={form.effectiveTo ?? ""} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value || null })} /></Field>
      {error && <p className="text-sm text-amber-700 md:col-span-2">{error}</p>}<div className="flex gap-2 md:col-span-2"><Button disabled={!!error || save.isPending} onClick={() => save.mutate()}>{editingId ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{editingId ? "Saqlash" : "Qoralama yaratish"}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(blank()); }}>Bekor qilish</Button>}</div>
    </CardContent></Card>}
    <div className="grid gap-4 xl:grid-cols-2">{(publications.data ?? []).map((item) => <PublicationCard key={item.id} item={item} canWrite={canWrite} onEdit={() => edit(item)} onReview={(kind) => { setReview({ publication: item, kind }); setReviewNote(""); }} onArchive={() => archive.mutate(item.id)} />)}{publications.data?.length === 0 && <Card className="xl:col-span-2"><CardContent className="py-10 text-center text-red-700">Rasmiy sayt nashrlari mavjud emas; 8-band public axborot dalili 0/4.</CardContent></Card>}</div>
    <Dialog open={!!review} onOpenChange={(open) => { if (!open) setReview(null); }}><DialogContent><DialogHeader><DialogTitle>{review?.kind === "publish" ? "Nashrni ommaga chiqarish" : "Nashrni rad etish"}</DialogTitle><DialogDescription>Manba hujjat va public matnni mustaqil tekshirganingizni asoslang.</DialogDescription></DialogHeader><Field label="Tekshiruv izohi"><Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} /></Field><DialogFooter><Button variant="outline" onClick={() => setReview(null)}>Bekor qilish</Button><Button variant={review?.kind === "reject" ? "destructive" : "default"} disabled={reviewNote.trim().length < 10 || decide.isPending} onClick={() => decide.mutate()}>{review?.kind === "publish" ? "Chop etish" : "Rad etish"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function PublicationCard({ item, canWrite, onEdit, onReview, onArchive }: { item: OfficialSitePublication; canWrite: boolean; onEdit: () => void; onReview: (kind: "publish" | "reject") => void; onArchive: () => void }) {
  return <Card className={item.currentlyVisible ? "border-emerald-500" : ""}><CardHeader><div className="flex justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />{item.title}</CardTitle><CardDescription>{categoryLabels[item.category]} · {item.slug} · v{item.versionCode}</CardDescription></div><Badge variant={item.currentlyVisible ? "secondary" : "outline"}>{item.status}</Badge></div></CardHeader><CardContent className="space-y-3 text-sm"><p className="whitespace-pre-wrap">{item.summary}</p><p><b>Manba:</b> {item.sourceDocumentNumber}, {item.sourceDocumentDate} · {item.sourceReference}</p><p><b>Amal davri:</b> {item.effectiveFrom} — {item.effectiveTo ?? "cheklanmagan"}</p><p><b>Muallif:</b> {item.createdByName}</p>{item.reviewNote && <p><b>Mustaqil qaror:</b> {item.reviewNote} — {item.reviewedByName}</p>}{canWrite && item.status === "DRAFT" && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={onEdit}><Pencil className="mr-1 h-3 w-3" />Tahrirlash</Button><Button size="sm" onClick={() => onReview("publish")}><CheckCircle2 className="mr-1 h-3 w-3" />Chop etish</Button><Button size="sm" variant="destructive" onClick={() => onReview("reject")}><XCircle className="mr-1 h-3 w-3" />Rad etish</Button></div>}{canWrite && item.status === "PUBLISHED" && <Button size="sm" variant="outline" onClick={onArchive}><Archive className="mr-1 h-3 w-3" />Arxivlash</Button>}</CardContent></Card>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <div className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}><Label>{label}</Label>{children}</div>; }

