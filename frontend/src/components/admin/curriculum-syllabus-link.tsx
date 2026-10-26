import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ListOrdered, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SyllabusTopicsDialog } from "@/components/admin/syllabus-topics";
import { SyllabusWorkflow, syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { extractApiError } from "@/lib/academic-api";
import { curriculumLabel, groupBySubject, planOf, syllabusLanguageOf } from "@/lib/curriculum-subjects";
import { languageLabel, syllabusLanguages, type PlanPart } from "@/lib/syllabus";
import { curriculumApi, type CurriculumSubject, type CurriculumVersion } from "@/services/api/curriculum-api";
import { syllabusApi, type SyllabusLanguage } from "@/services/api/syllabus-api";

const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

const PLAN_LABELS = [["lecture", "Ma'ruza"], ["practical", "Amaliy"], ["laboratory", "Laboratoriya"], ["seminar", "Seminar"]] as const;

/** Reja soatlari to'liq yozuvda: "Ma'ruza 30 · Amaliy 45 · Mustaqil ta'lim 180". */
const planText = (rows: CurriculumSubject[]) => {
  const plan = planOf(rows);
  const sum = (key: keyof PlanPart) => plan.reduce((acc, p) => acc + p[key], 0);
  const typed = PLAN_LABELS.filter(([key]) => sum(key) > 0).map(([key, label]) => `${label} ${sum(key)}`);
  const selfStudy = rows.reduce((acc, r) => acc + (r.selfStudyHours ?? 0), 0);
  return [...(typed.length ? typed : [`Auditoriya ${sum("auditory")}`]), `Mustaqil ta'lim ${selfStudy}`].join(" · ");
};

/** Fanning dasturi (fan bo'yicha ro'yxatdan). */
function useSubjectSyllabus(subject: CurriculumSubject) {
  const query = useQuery({
    queryKey: ["syllabi", "subject", subject.subjectId],
    queryFn: () => syllabusApi.list(subject.subjectId ?? undefined),
    enabled: Boolean(subject.subjectId && subject.syllabusId),
  });
  return { ...query, item: query.data?.find((s) => s.id === subject.syllabusId) };
}

/**
 * "Yangi o'quv dasturi": avval o'quv reja, keyin undagi fan tanlanadi (soatlar rejadan olinadi).
 * Fanning boshqa rejada tuzilgan dasturi bo'lsa, uni biriktirish mumkin; aks holda yangi dastur yaratiladi.
 */
export function CreateSyllabusDialog({ curricula, curriculumId: initialCurriculumId, itemId, onClose, onCreated }: {
  curricula: CurriculumVersion[];
  curriculumId: number;
  /** Jadvaldagi fan qatoridan ochilganda — shu fan tanlangan bo'ladi */
  itemId?: number | null;
  onClose: () => void;
  /** Dastur yaratildi yoki biriktirildi: reja va fan qatori (mavzular oynasini ochish uchun) */
  onCreated: (curriculumId: number, itemId: number) => unknown;
}) {
  const [curriculumId, setCurriculumId] = useState(initialCurriculumId);
  const [chosenItemId, setChosenItemId] = useState<number | null>(itemId ?? null);
  const [choice, setChoice] = useState<number | "new" | null>(null);
  const [language, setLanguage] = useState<SyllabusLanguage | null>(null);
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);

  const curriculum = useQuery({ queryKey: ["curricula", curriculumId], queryFn: () => curriculumApi.get(curriculumId) });
  const groups = groupBySubject(curriculum.data?.subjects ?? []).filter((rows) => rows[0].subjectId != null);
  const rows = groups.find((g) => g.some((r) => r.id === chosenItemId)) ?? groups.find((g) => !g[0].syllabusId);
  const first = rows?.[0];
  const existing = useQuery({
    queryKey: ["syllabi", "subject", first?.subjectId],
    queryFn: () => syllabusApi.list(first?.subjectId ?? undefined),
    enabled: Boolean(first?.subjectId),
  });
  const planLanguage = syllabusLanguageOf(curriculum.data?.educationLanguage);
  // Reja tilidagi mavjud dastur bo'lsa, u oldindan tanlanadi (bir dastur bir necha rejada ishlatiladi)
  const selected = choice ?? existing.data?.find((s) => s.language === planLanguage)?.id ?? "new";
  const lang = language ?? planLanguage;

  const save = useMutation({
    mutationFn: async () => {
      if (!first) return;
      if (selected === "new") {
        const text = goal.trim() || `${first.subjectName} fanining o'quv dasturi`;
        await curriculumApi.createSyllabus(curriculumId, first.id, { language: lang, shortDescription: text, fullDescription: text });
      } else {
        await curriculumApi.attachSyllabus(curriculumId, first.id, selected);
      }
    },
    onSuccess: () => { if (first) void onCreated(curriculumId, first.id); },
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });
  const busy = save.isPending;
  const pickSubject = (id: number) => { setChosenItemId(id); setChoice(null); setError(null); };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yangi o'quv dasturi</DialogTitle>
          <DialogDescription>O'quv reja va undagi fanni tanlang. Kredit va soatlar rejadan olinadi, mavzular keyingi oynada kiritiladi.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="new-syllabus-curriculum">O'quv reja *</Label>
          <select id="new-syllabus-curriculum" className={selectClass} value={curriculumId} disabled={busy}
            onChange={(e) => { setCurriculumId(Number(e.target.value)); setChosenItemId(null); setChoice(null); setLanguage(null); setError(null); }}>
            {curricula.map((c) => <option key={c.id} value={c.id}>{curriculumLabel(c)}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="new-syllabus-subject">Fan *</Label>
          <select id="new-syllabus-subject" className={selectClass} value={first?.id ?? ""} disabled={busy || !groups.length}
            onChange={(e) => pickSubject(Number(e.target.value))}>
            {!groups.length && <option value="">{curriculum.isLoading ? "Yuklanmoqda..." : "Rejada fan yo'q"}</option>}
            {groups.map((g) => (
              <option key={g[0].id} value={g[0].id} disabled={Boolean(g[0].syllabusId)}>
                {g[0].planRowNumber ? `${g[0].planRowNumber} ` : ""}{g[0].subjectName}{g[0].syllabusId ? " — dastur bor" : ""}
              </option>
            ))}
          </select>
          {rows && (
            <p className="text-xs text-muted-foreground" aria-label="Rejadagi soatlar">
              Rejada: {rows.map((r) => r.semester).join(", ")}-semestr · {rows.map((r) => r.credits).join("+")} kredit · {planText(rows)}
            </p>
          )}
        </div>

        {first && (existing.data?.length ?? 0) > 0 && (
          <div role="radiogroup" aria-label="O'quv dasturi" className="space-y-1.5">
            <p className="text-sm font-medium">Bu fan uchun o'quv dasturi allaqachon bor — shuni ishlatish mumkin</p>
            {existing.data!.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm has-[:checked]:border-primary">
                <input type="radio" name="new-syllabus-choice" className="mt-1" checked={selected === s.id} onChange={() => setChoice(s.id)} />
                <span className="flex-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {languageLabel(s.language)} · {syllabusStatuses[s.status]} · <ListOrdered className="inline h-3 w-3" /> {s.topics?.length ?? 0} mavzu
                  </span>
                </span>
              </label>
            ))}
            <label className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm has-[:checked]:border-primary">
              <input type="radio" name="new-syllabus-choice" checked={selected === "new"} onChange={() => setChoice("new")} />
              <span className="font-medium">Yangi o'quv dasturi yaratish</span>
            </label>
          </div>
        )}

        {first && selected === "new" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="new-syllabus-language">Dastur tili</Label>
              <select id="new-syllabus-language" className={selectClass} value={lang} disabled={busy}
                onChange={(e) => setLanguage(e.target.value as SyllabusLanguage)}>
                {syllabusLanguages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-syllabus-goal">Fanning maqsadi va vazifalari</Label>
              <Textarea id="new-syllabus-goal" rows={3} value={goal} disabled={busy} placeholder="Ixtiyoriy — keyin ham to'ldirish mumkin"
                onChange={(e) => setGoal(e.target.value)} />
            </div>
          </>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Bekor qilish</Button>
          <Button onClick={() => save.mutate()} disabled={busy || !first || Boolean(first.syllabusId)}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selected === "new" ? "Yaratish va mavzularni kiritish" : "Biriktirish va mavzularni ochish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Rejadagi fan dasturining mavzulari: har bir tur alohida ro'yxat, soatlar reja soatlari bilan solishtiriladi. */
export function CurriculumTopicsDialog({ rows, canWrite, onClose, onSaved }: {
  /** Fanning rejadagi barcha semestr qatorlari */
  rows: CurriculumSubject[];
  canWrite: boolean;
  onClose: () => void;
  onSaved: () => unknown;
}) {
  const syllabus = useSubjectSyllabus(rows[0]);
  if (!syllabus.item) return null;
  return (
    <SyllabusTopicsDialog key={syllabus.item.id} item={syllabus.item} canWrite={canWrite} plan={planOf(rows)}
      title={`${rows[0].subjectName} — mavzular`}
      onSaved={() => { void syllabus.refetch(); void onSaved(); }} onClose={onClose} />
  );
}

/** Dastur holati (tekshiruvga yuborish, tasdiqlash) va tasdiqlangan versiyalar tarixi. */
export function CurriculumSyllabusWorkflow({ subject, canWrite, onClose, onChanged }: {
  subject: CurriculumSubject;
  canWrite: boolean;
  onClose: () => void;
  onChanged: () => unknown;
}) {
  const syllabus = useSubjectSyllabus(subject);
  if (!syllabus.item) return null;
  return (
    <SyllabusWorkflow item={syllabus.item} canWrite={canWrite} close={onClose}
      reload={() => { void syllabus.refetch(); void onChanged(); }} />
  );
}

/** "⋯ → Boshqa dasturni tanlash": shu fanning boshqa dasturini biriktirish yoki rejadan ajratish. */
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
                  {languageLabel(s.language)} · {syllabusStatuses[s.status]} ·{" "}
                  <ListOrdered className="inline h-3 w-3" /> {s.topics?.length ?? 0} mavzu
                </span>
              </span>
            </label>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:justify-between">
          {subject.syllabusId
            ? <Button variant="ghost" className="text-destructive" disabled={busy} onClick={() => detach.mutate()}>Rejadan ajratish</Button>
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
