import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Link2, ListOrdered, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SyllabusTopicsDialog } from "@/components/admin/syllabus-topics";
import { syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { extractApiError } from "@/lib/academic-api";
import { syllabusLanguages, type PlanPart } from "@/lib/syllabus";
import { curriculumApi, type CurriculumSubject, type CreateCurriculumSyllabusInput } from "@/services/api/curriculum-api";
import { syllabusApi, type SyllabusLanguage } from "@/services/api/syllabus-api";

const LANGUAGE_OF: Record<string, SyllabusLanguage> = { uz: "UZ", "uz-Latn": "UZ", "uz-Cyrl": "UZ_CYRILLIC", kaa: "KAA", ru: "RU", en: "EN" };

/** Fanning rejadagi semestr qatorlari -> dastur mavzulari uchun reja limitlari (1-qism — birinchi semestr). */
const planOf = (rows: CurriculumSubject[]): PlanPart[] => [...rows].sort((a, b) => a.semester - b.semester).map((r, i) => ({
  part: i + 1, semester: r.semester, lecture: r.lectureHours ?? 0, practical: r.practicalHours ?? 0,
  laboratory: r.laboratoryHours ?? 0, seminar: r.seminarHours ?? 0, auditory: r.auditoryHours ?? 0,
}));

/**
 * O'quv rejadagi fan qatoridagi "O'quv dasturi" katagi: biriktirilgan dastur (mavzular soni, reja soatlariga
 * mosligi) yoki biriktirish tugmasi. Mavzular dastur oynasida reja limitlari bilan kiritiladi.
 */
export function CurriculumSyllabusCell({ curriculumId, subject, rows, canLink, canEditTopics, educationLanguage, onChanged }: {
  curriculumId: number;
  subject: CurriculumSubject;
  /** Shu fanning rejadagi barcha semestr qatorlari */
  rows: CurriculumSubject[];
  canLink: boolean;
  canEditTopics: boolean;
  educationLanguage: string;
  onChanged: () => unknown;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [topicsId, setTopicsId] = useState<number | null>(null);
  const syllabi = useQuery({
    queryKey: ["syllabi", "subject", subject.subjectId],
    queryFn: () => syllabusApi.list(subject.subjectId ?? undefined),
    enabled: topicsId !== null,
  });
  const topicsItem = syllabi.data?.find((s) => s.id === topicsId);
  if (!subject.subjectId) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <>
      {linkOpen && (
        <LinkSyllabusDialog curriculumId={curriculumId} subject={subject} educationLanguage={educationLanguage}
          onClose={() => setLinkOpen(false)}
          onLinked={async (syllabusId, openTopics) => {
            await onChanged();
            setLinkOpen(false);
            if (openTopics) setTopicsId(syllabusId);
          }} />
      )}
      {topicsId !== null && topicsItem && (
        <SyllabusTopicsDialog key={topicsItem.id} item={topicsItem} canWrite={canEditTopics} plan={planOf(rows)}
          credits={rows.reduce((sum, r) => sum + r.credits, 0)}
          onSaved={() => { void syllabi.refetch(); void onChanged(); }} onClose={() => setTopicsId(null)} />
      )}
      {subject.syllabusId ? (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 max-w-56 justify-start" onClick={() => setTopicsId(subject.syllabusId!)}
            title={subject.syllabusHoursMatch ? "Mavzu soatlari rejaga mos" : "Mavzu soatlari reja soatlariga hali mos emas"}>
            {subject.syllabusHoursMatch
              ? <CheckCircle2 className="mr-1 h-3.5 w-3.5 shrink-0 text-green-600" />
              : <AlertTriangle className="mr-1 h-3.5 w-3.5 shrink-0 text-amber-600" />}
            <span className="truncate">{subject.syllabusName}</span>
            <span className="ml-1 shrink-0 text-muted-foreground">· {subject.syllabusTopicCount ?? 0} mavzu</span>
          </Button>
          {canLink && (
            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="O'quv dasturini almashtirish" onClick={() => setLinkOpen(true)}>
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : canLink ? (
        <Button size="sm" variant="secondary" className="h-8" onClick={() => setLinkOpen(true)}>
          <Link2 className="mr-1 h-3.5 w-3.5" />Dastur biriktirish
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Biriktirilmagan</span>
      )}
      {topicsId !== null && syllabi.isLoading && <Loader2 className="ml-1 inline h-3.5 w-3.5 animate-spin" aria-label="Yuklanmoqda" />}
    </>
  );
}

function LinkSyllabusDialog({ curriculumId, subject, educationLanguage, onClose, onLinked }: {
  curriculumId: number;
  subject: CurriculumSubject;
  educationLanguage: string;
  onClose: () => void;
  onLinked: (syllabusId: number, openTopics: boolean) => unknown;
}) {
  const existing = useQuery({
    queryKey: ["syllabi", "subject", subject.subjectId],
    queryFn: () => syllabusApi.list(subject.subjectId ?? undefined),
  });
  const [selected, setSelected] = useState<number | null>(subject.syllabusId ?? null);
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [form, setForm] = useState<CreateCurriculumSyllabusInput>({
    language: LANGUAGE_OF[educationLanguage] ?? "UZ", shortDescription: "", requirements: "", fullDescription: "",
  });
  const [error, setError] = useState<string | null>(null);
  const fail = (e: unknown) => setError(extractApiError(e, "Saqlanmadi").message);
  const attach = useMutation({
    mutationFn: (syllabusId: number) => curriculumApi.attachSyllabus(curriculumId, subject.id, syllabusId),
    onSuccess: (_, syllabusId) => onLinked(syllabusId, false),
    onError: fail,
  });
  const create = useMutation({
    mutationFn: () => curriculumApi.createSyllabus(curriculumId, subject.id, {
      ...form, shortDescription: form.shortDescription.trim(), requirements: form.requirements?.trim() || null,
      fullDescription: form.fullDescription.trim(),
    }),
    onSuccess: (version) => {
      const created = version.subjects.find((s) => s.id === subject.id)?.syllabusId;
      return created ? onLinked(created, true) : onLinked(0, false);
    },
    onError: fail,
  });
  const detach = useMutation({
    mutationFn: () => curriculumApi.detachSyllabus(curriculumId, subject.id),
    onSuccess: () => onLinked(0, false),
    onError: fail,
  });
  const busy = attach.isPending || create.isPending || detach.isPending;
  const items = existing.data ?? [];
  const validNew = form.shortDescription.trim().length >= 3 && form.fullDescription.trim().length >= 3;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>O'quv dasturi — {subject.subjectName}</DialogTitle>
          <DialogDescription>
            Shu fanning mavjud dasturini tanlang yoki yangisini yarating. Dastur fanning rejadagi barcha semestrlariga biriktiriladi;
            mavzular shu dasturga qo'shiladi.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => { setTab(v as "existing" | "new"); setError(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Mavjud dastur ({items.length})</TabsTrigger>
            <TabsTrigger value="new">Yangi dastur</TabsTrigger>
          </TabsList>
          <TabsContent value="existing" className="space-y-2">
            {existing.isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>}
            {!existing.isLoading && items.length === 0 && (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Bu fan uchun hali o'quv dasturi yo'q — "Yangi dastur" orqali yarating.</p>
            )}
            <div role="radiogroup" aria-label="Mavjud o'quv dasturlari" className="space-y-1.5">
              {items.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm has-[:checked]:border-primary">
                  <input type="radio" name="syllabus" className="mt-1" checked={selected === s.id} onChange={() => setSelected(s.id)} />
                  <span className="flex-1">
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {syllabusLanguages.find((l) => l.value === s.language)?.label ?? s.language} · {syllabusStatuses[s.status]} ·{" "}
                      <ListOrdered className="inline h-3 w-3" /> {s.topics?.length ?? 0} mavzu
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="new" className="grid gap-3">
            <div className="space-y-1.5"><Label htmlFor="link-language">Dastur tili</Label>
              <select id="link-language" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as SyllabusLanguage })}>
                {syllabusLanguages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select></div>
            <div className="space-y-1.5"><Label htmlFor="link-short">Qisqa ta'rif *</Label>
              <Textarea id="link-short" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="link-req">Talablar</Label>
              <Textarea id="link-req" value={form.requirements ?? ""} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="link-full">To'liq ta'rif *</Label>
              <Textarea id="link-full" className="min-h-24" value={form.fullDescription} onChange={(e) => setForm({ ...form, fullDescription: e.target.value })} /></div>
            <p className="text-xs text-muted-foreground">Dastur nomi — fan nomi. Saqlangandan so'ng mavzular oynasi ochiladi.</p>
          </TabsContent>
        </Tabs>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:justify-between">
          {subject.syllabusId
            ? <Button variant="ghost" className="text-destructive" disabled={busy} onClick={() => detach.mutate()}>Dasturni ajratish</Button>
            : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>Bekor qilish</Button>
            {tab === "existing" ? (
              <Button disabled={busy || !selected || selected === subject.syllabusId} onClick={() => selected && attach.mutate(selected)}>
                {attach.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Biriktirish
              </Button>
            ) : (
              <Button disabled={busy || !validNew} onClick={() => create.mutate()}>
                {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Yaratish va biriktirish
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
