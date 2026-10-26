import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CurriculumSyllabusCell } from "@/components/admin/curriculum-syllabus-link";
import { extractApiError } from "@/lib/academic-api";
import { HOURS_PER_CREDIT } from "@/lib/syllabus";
import { cn } from "@/lib/utils";
import {
  curriculumApi, type CurriculumPlanItemType, type CurriculumSubject, type CurriculumSubjectHours,
} from "@/services/api/curriculum-api";

const HOUR_COLUMNS = [
  { key: "lectureHours", label: "Ma'ruza" },
  { key: "practicalHours", label: "Amaliy" },
  { key: "laboratoryHours", label: "Lab." },
  { key: "seminarHours", label: "Seminar" },
  { key: "auditoryHours", label: "Auditoriya" },
  { key: "selfStudyHours", label: "Mustaqil" },
] as const;

const total = (s: CurriculumSubject) => s.totalHours ?? (s.auditoryHours ?? 0) + (s.selfStudyHours ?? 0);
const mismatch = (s: CurriculumSubject) => total(s) > 0 && total(s) !== s.credits * HOURS_PER_CREDIT;

/**
 * O'quv reja fanlari: T/r, kredit va soatlar mashg'ulot turlari bo'yicha (ishchi o'quv reja ustunlari).
 * Umumiy yuklama kredit × 30 soatga teng bo'lmasa ogohlantiriladi.
 */
export function CurriculumSubjectsTable({ curriculumId, subjects, editable, canLinkSyllabus = false, educationLanguage = "uz", onRemove, onChanged }: {
  curriculumId: number;
  subjects: CurriculumSubject[];
  /** Kredit/soatlarni tahrirlash va fanni olib tashlash (faqat qoralama reja) */
  editable: boolean;
  /** O'quv dasturini biriktirish (arxivlanmagan reja) */
  canLinkSyllabus?: boolean;
  educationLanguage?: string;
  onRemove: (subject: CurriculumSubject) => void;
  onChanged: () => unknown;
}) {
  const [editing, setEditing] = useState<CurriculumSubject | null>(null);
  const rows = [...subjects].sort((a, b) => a.semester - b.semester
    || (a.planRowNumber ?? "~").localeCompare(b.planRowNumber ?? "~", undefined, { numeric: true })
    || a.subjectName.localeCompare(b.subjectName));
  const sum = (key: keyof CurriculumSubject) => rows.reduce((acc, s) => acc + (Number(s[key]) || 0), 0);

  return (
    <>
      {editing && <EditSubjectDialog curriculumId={curriculumId} subject={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">T/r</TableHead>
              <TableHead>Fan</TableHead>
              <TableHead>Semestr</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead className="text-right">Kredit</TableHead>
              {HOUR_COLUMNS.map((c) => <TableHead key={c.key} className="text-right">{c.label}</TableHead>)}
              <TableHead className="text-right">Jami soat</TableHead>
              <TableHead>O'quv dasturi</TableHead>
              {editable && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell className="text-muted-foreground">{subject.planRowNumber ?? "—"}</TableCell>
                <TableCell>
                  <p className="font-medium">{subject.subjectName}</p>
                  <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
                </TableCell>
                <TableCell>{subject.semester}-semestr</TableCell>
                <TableCell>{subject.planItemType === "REQUIRED" ? "Majburiy" : "Tanlov"}</TableCell>
                <TableCell className="text-right">{subject.credits}</TableCell>
                {HOUR_COLUMNS.map((c) => (
                  <TableCell key={c.key} className="text-right tabular-nums">{subject[c.key] || <span className="text-muted-foreground">—</span>}</TableCell>
                ))}
                <TableCell className={cn("text-right tabular-nums", mismatch(subject) && "text-amber-700 dark:text-amber-400")}>
                  {total(subject) || <span className="text-muted-foreground">—</span>}
                  {mismatch(subject) && (
                    <span title={`${subject.credits} kredit × ${HOURS_PER_CREDIT} = ${subject.credits * HOURS_PER_CREDIT} soat bo'lishi kerak`}>
                      <AlertTriangle className="ml-1 inline h-3.5 w-3.5" aria-label="Soat kreditga mos emas" />
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <CurriculumSyllabusCell curriculumId={curriculumId} subject={subject}
                    rows={rows.filter((r) => r.subjectId != null && r.subjectId === subject.subjectId)}
                    canLink={canLinkSyllabus} canEditTopics={canLinkSyllabus} educationLanguage={educationLanguage} onChanged={onChanged} />
                </TableCell>
                {editable && (
                  <TableCell className="whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" aria-label="Fan soatlarini tahrirlash" onClick={() => setEditing(subject)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Fanni olib tashlash" onClick={() => onRemove(subject)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={HOUR_COLUMNS.length + (editable ? 8 : 7)} className="h-24 text-center text-muted-foreground">
                  Rejaga hali fan biriktirilmagan. Fanlarni qo'lda qo'shing yoki ishchi o'quv rejani Excel'dan import qiling.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-medium">Jami</TableCell>
                <TableCell className="text-right font-medium">{sum("credits")}</TableCell>
                {HOUR_COLUMNS.map((c) => <TableCell key={c.key} className="text-right tabular-nums">{sum(c.key)}</TableCell>)}
                <TableCell className="text-right font-medium tabular-nums">{rows.reduce((acc, s) => acc + total(s), 0)}</TableCell>
                <TableCell />
                {editable && <TableCell />}
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </>
  );
}

const HOUR_FIELDS: { key: keyof CurriculumSubjectHours; label: string }[] = [
  { key: "lecture", label: "Ma'ruza" },
  { key: "practical", label: "Amaliy" },
  { key: "laboratory", label: "Laboratoriya" },
  { key: "seminar", label: "Seminar" },
  { key: "courseWork", label: "Kurs ishi" },
  { key: "selfStudy", label: "Mustaqil ta'lim" },
];

function EditSubjectDialog({ curriculumId, subject, onClose, onSaved }: {
  curriculumId: number;
  subject: CurriculumSubject;
  onClose: () => void;
  onSaved: () => unknown;
}) {
  const [credits, setCredits] = useState(subject.credits);
  const [planItemType, setPlanItemType] = useState<CurriculumPlanItemType>(subject.planItemType);
  const [rowNumber, setRowNumber] = useState(subject.planRowNumber ?? "");
  const [hours, setHours] = useState<CurriculumSubjectHours>({
    lecture: subject.lectureHours ?? 0, practical: subject.practicalHours ?? 0, laboratory: subject.laboratoryHours ?? 0,
    seminar: subject.seminarHours ?? 0, courseWork: subject.courseWorkHours ?? 0, auditory: subject.auditoryHours ?? 0,
    selfStudy: subject.selfStudyHours ?? 0,
  });
  const [error, setError] = useState<string | null>(null);
  const typed = hours.lecture + hours.practical + hours.laboratory + hours.seminar;
  const auditory = typed > 0 ? typed : hours.auditory ?? 0;
  const totalHours = auditory + hours.selfStudy;
  const expected = credits * HOURS_PER_CREDIT;
  const save = useMutation({
    mutationFn: () => curriculumApi.updateSubject(curriculumId, subject.id, {
      credits, planItemType, planRowNumber: rowNumber.trim() || null, hours: { ...hours, auditory },
    }),
    onSuccess: async () => { await onSaved(); onClose(); },
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });
  const setHour = (key: keyof CurriculumSubjectHours, value: string) =>
    setHours((h) => ({ ...h, [key]: Math.max(0, Math.round(Number(value) || 0)) }));

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{subject.subjectName} · {subject.semester}-semestr</DialogTitle>
          <DialogDescription>Kredit va soatlar ishchi o'quv rejadagidek kiritiladi (1 kredit = {HOURS_PER_CREDIT} soat).</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label htmlFor="cs-row">T/r</Label>
            <Input id="cs-row" value={rowNumber} maxLength={20} placeholder="1.09" onChange={(e) => setRowNumber(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="cs-credits">Kredit</Label>
            <Input id="cs-credits" type="number" min={1} max={60} value={credits} onChange={(e) => setCredits(Math.round(Number(e.target.value) || 0))} /></div>
          <div className="space-y-1.5"><Label htmlFor="cs-type">Turi</Label>
            <select id="cs-type" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={planItemType}
              onChange={(e) => setPlanItemType(e.target.value as CurriculumPlanItemType)}>
              <option value="REQUIRED">Majburiy</option><option value="ELECTIVE">Tanlov</option>
            </select></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {HOUR_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5"><Label htmlFor={`cs-${f.key}`}>{f.label}</Label>
              <Input id={`cs-${f.key}`} type="number" min={0} value={hours[f.key] ?? 0} onChange={(e) => setHour(f.key, e.target.value)} /></div>
          ))}
          <div className="space-y-1.5"><Label htmlFor="cs-auditory">Auditoriya jami</Label>
            <Input id="cs-auditory" type="number" min={0} value={auditory} disabled={typed > 0}
              title={typed > 0 ? "Mashg'ulot turlari yig'indisi" : "Masofaviy shakl: turlarga bo'linmagan auditoriya soati"}
              onChange={(e) => setHour("auditory", e.target.value)} /></div>
        </div>
        <p role="status" className={cn("rounded-md border p-2 text-xs", totalHours !== expected ? "border-amber-300 text-amber-800 dark:text-amber-300" : "bg-muted/40")}>
          Umumiy yuklama: {auditory} (auditoriya) + {hours.selfStudy} (mustaqil) = {totalHours} soat
          {totalHours !== expected ? ` — ${credits} kredit uchun ${expected} soat bo'lishi kerak` : " — kreditga mos"}
        </p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>Bekor qilish</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || credits < 1 || credits > 60}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
