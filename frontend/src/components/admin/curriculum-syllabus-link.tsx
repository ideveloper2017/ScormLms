import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ListOrdered, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SyllabusTopicsDialog } from "@/components/admin/syllabus-topics";
import { syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { syllabusLanguages, type PlanPart } from "@/lib/syllabus";
import { curriculumApi, type CurriculumSubject } from "@/services/api/curriculum-api";
import { syllabusApi } from "@/services/api/syllabus-api";

/** Fanning rejadagi semestr qatorlari -> mavzular uchun reja limitlari (1-qism — birinchi semestr). */
const planOf = (rows: CurriculumSubject[]): PlanPart[] => [...rows].sort((a, b) => a.semester - b.semester).map((r, i) => ({
  part: i + 1, semester: r.semester, lecture: r.lectureHours ?? 0, practical: r.practicalHours ?? 0,
  laboratory: r.laboratoryHours ?? 0, seminar: r.seminarHours ?? 0, auditory: r.auditoryHours ?? 0,
}));

/**
 * "Mavzular" katagi: bitta tugma. Dastur bo'lmasa "+ Mavzular" — dastur avtomatik topiladi/yaratiladi va mavzular
 * oynasi ochiladi; bo'lsa "N mavzu" (✓ — soatlar rejaga mos, ⚠ — hali mos emas).
 */
export function CurriculumSyllabusCell({ curriculumId, subject, rows, canLink, onChanged }: {
  curriculumId: number;
  /** Fanning birinchi semestr qatori */
  subject: CurriculumSubject;
  /** Shu fanning rejadagi barcha semestr qatorlari */
  rows: CurriculumSubject[];
  canLink: boolean;
  onChanged: () => unknown;
}) {
  const { toast } = useToast();
  const [topicsId, setTopicsId] = useState<number | null>(null);
  const syllabi = useQuery({
    queryKey: ["syllabi", "subject", subject.subjectId],
    queryFn: () => syllabusApi.list(subject.subjectId ?? undefined),
    enabled: topicsId !== null,
  });
  const ensure = useMutation({
    mutationFn: () => curriculumApi.ensureSyllabus(curriculumId, subject.id),
    onSuccess: async (syllabusId) => {
      await onChanged();
      await syllabi.refetch();
      setTopicsId(syllabusId);
    },
    onError: (e) => toast({ variant: "destructive", title: "Dastur ochilmadi", description: extractApiError(e, "Xatolik").message }),
  });
  const topicsItem = syllabi.data?.find((s) => s.id === topicsId);
  if (!subject.subjectId) return <span className="text-xs text-muted-foreground">—</span>;
  const opening = ensure.isPending || (topicsId !== null && syllabi.isLoading);

  return (
    <>
      {topicsId !== null && topicsItem && (
        <SyllabusTopicsDialog key={topicsItem.id} item={topicsItem} canWrite={canLink} plan={planOf(rows)}
          title={`${subject.subjectName} — mavzular`}
          onSaved={() => { void syllabi.refetch(); void onChanged(); }} onClose={() => setTopicsId(null)} />
      )}
      {subject.syllabusId ? (
        <Button size="sm" variant="outline" className="h-8" disabled={opening} onClick={() => setTopicsId(subject.syllabusId!)}
          title={subject.syllabusHoursMatch ? "Mavzu soatlari rejaga mos" : "Mavzu soatlari reja soatlariga hali mos emas"}>
          {opening ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            : subject.syllabusHoursMatch ? <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-600" />
            : <AlertTriangle className="mr-1 h-3.5 w-3.5 text-amber-600" />}
          {subject.syllabusTopicCount ?? 0} mavzu
        </Button>
      ) : canLink ? (
        <Button size="sm" variant="secondary" className="h-8" disabled={opening} onClick={() => ensure.mutate()}>
          {opening ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}Mavzular
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </>
  );
}

/** "⋯ → Boshqa o'quv dasturini tanlash": shu fanning boshqa dasturini biriktirish yoki ajratish. */
export function LinkSyllabusDialog({ curriculumId, subject, onClose, onLinked }: {
  curriculumId: number;
  subject: CurriculumSubject;
  onClose: () => void;
  onLinked: () => unknown;
}) {
  const existing = useQuery({
    queryKey: ["syllabi", "subject", subject.subjectId],
    queryFn: () => syllabusApi.list(subject.subjectId ?? undefined),
  });
  const [selected, setSelected] = useState<number | null>(subject.syllabusId ?? null);
  const [error, setError] = useState<string | null>(null);
  const fail = (e: unknown) => setError(extractApiError(e, "Saqlanmadi").message);
  const attach = useMutation({
    mutationFn: (syllabusId: number) => curriculumApi.attachSyllabus(curriculumId, subject.id, syllabusId),
    onSuccess: () => onLinked(),
    onError: fail,
  });
  const detach = useMutation({
    mutationFn: () => curriculumApi.detachSyllabus(curriculumId, subject.id),
    onSuccess: () => onLinked(),
    onError: fail,
  });
  const busy = attach.isPending || detach.isPending;
  const items = existing.data ?? [];

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>O'quv dasturi — {subject.subjectName}</DialogTitle>
          <DialogDescription>Shu fanning qaysi o'quv dasturi (mavzulari) ishlatilishini tanlang.</DialogDescription>
        </DialogHeader>
        {existing.isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>}
        {!existing.isLoading && items.length === 0 && (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Bu fan uchun boshqa dastur yo'q.</p>
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
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:justify-between">
          {subject.syllabusId
            ? <Button variant="ghost" className="text-destructive" disabled={busy} onClick={() => detach.mutate()}>Ajratish</Button>
            : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy}>Bekor qilish</Button>
            <Button disabled={busy || !selected || selected === subject.syllabusId} onClick={() => selected && attach.mutate(selected)}>
              {attach.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Tanlash
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
