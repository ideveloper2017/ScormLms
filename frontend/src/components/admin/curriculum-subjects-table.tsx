import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Loader2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CurriculumSyllabusCell, LinkSyllabusDialog } from "@/components/admin/curriculum-syllabus-link";
import { extractApiError } from "@/lib/academic-api";
import { HOURS_PER_CREDIT } from "@/lib/syllabus";
import { cn } from "@/lib/utils";
import {
  curriculumApi, type CurriculumPlanItemType, type CurriculumSubject, type CurriculumSubjectHours,
} from "@/services/api/curriculum-api";

const total = (s: CurriculumSubject) => s.totalHours ?? (s.auditoryHours ?? 0) + (s.selfStudyHours ?? 0);
const mismatch = (s: CurriculumSubject) => total(s) > 0 && total(s) !== s.credits * HOURS_PER_CREDIT;

/** Fanning barcha semestrlari bo'yicha soatlar qisqa ko'rinishda: "M 30 · A 45 · L 45" (masofaviy: "Aud. 60"). */
const hoursText = (rows: CurriculumSubject[]) => {
  const sum = (key: keyof CurriculumSubject) => rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
  const typed = ([["M", "lectureHours"], ["A", "practicalHours"], ["L", "laboratoryHours"], ["S", "seminarHours"]] as const)
    .map(([label, key]) => [label, sum(key)] as const).filter(([, value]) => value > 0);
  if (typed.length) return typed.map(([label, value]) => `${label} ${value}`).join(" · ");
  return sum("auditoryHours") > 0 ? `Aud. ${sum("auditoryHours")}` : "—";
};

/**
 * O'quv reja fanlari — ixcham ko'rinish: bir fan bitta qator (ko'p semestrli fan semestrlari birlashtiriladi),
 * soatlar qisqa yozuvda, mavzular bitta tugma orqali. Tahrirlash/o'chirish "⋯" menyusida.
 */
export function CurriculumSubjectsTable({ curriculumId, subjects, editable, canLinkSyllabus = false, onRemove, onChanged }: {
  curriculumId: number;
  subjects: CurriculumSubject[];
  /** Kredit/soatlarni tahrirlash va fanni olib tashlash (faqat qoralama reja) */
  editable: boolean;
  /** O'quv dasturini biriktirish va mavzular (arxivlanmagan reja) */
  canLinkSyllabus?: boolean;
  onRemove: (subject: CurriculumSubject) => void;
  onChanged: () => unknown;
}) {
  const [editing, setEditing] = useState<CurriculumSubject | null>(null);
  const [linking, setLinking] = useState<CurriculumSubject | null>(null);
  const groups = Object.values(subjects.reduce<Record<string, CurriculumSubject[]>>((acc, s) => {
    const key = s.subjectId != null ? `s${s.subjectId}` : `i${s.id}`;
    (acc[key] ??= []).push(s);
    return acc;
  }, {})).map((rows) => rows.sort((a, b) => a.semester - b.semester))
    .sort((a, b) => a[0].semester - b[0].semester
      || (a[0].planRowNumber ?? "~").localeCompare(b[0].planRowNumber ?? "~", undefined, { numeric: true })
      || a[0].subjectName.localeCompare(b[0].subjectName));
  const showMenu = editable || canLinkSyllabus;

  return (
    <>
      {editing && <EditSubjectDialog curriculumId={curriculumId} subject={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
      {linking && (
        <LinkSyllabusDialog curriculumId={curriculumId} subject={linking}
          onClose={() => setLinking(null)} onLinked={async () => { await onChanged(); setLinking(null); }} />
      )}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">T/r</TableHead>
              <TableHead>Fan</TableHead>
              <TableHead>Semestr</TableHead>
              <TableHead className="text-right">Kredit</TableHead>
              <TableHead>Soatlar</TableHead>
              <TableHead>Mavzular</TableHead>
              {showMenu && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((rows) => {
              const first = rows[0];
              const warn = rows.some(mismatch);
              return (
                <TableRow key={first.id}>
                  <TableCell className="text-muted-foreground">{first.planRowNumber ?? "—"}</TableCell>
                  <TableCell>
                    <p className="font-medium">{first.subjectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {first.subjectCode}
                      {first.planItemType === "ELECTIVE" && <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px]">Tanlov</Badge>}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{rows.map((r) => r.semester).join(", ")}</TableCell>
                  <TableCell className="text-right tabular-nums">{rows.map((r) => r.credits).join("+")}</TableCell>
                  <TableCell className={cn("whitespace-nowrap text-sm tabular-nums", warn && "text-amber-700 dark:text-amber-400")}>
                    {hoursText(rows)}
                    {warn && (
                      <span title={`Soatlar kreditga mos emas (1 kredit = ${HOURS_PER_CREDIT} soat) — "⋯" orqali tuzating`}>
                        <AlertTriangle className="ml-1 inline h-3.5 w-3.5" aria-label="Soat kreditga mos emas" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CurriculumSyllabusCell curriculumId={curriculumId} subject={first} rows={rows}
                      canLink={canLinkSyllabus} onChanged={onChanged} />
                  </TableCell>
                  {showMenu && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${first.subjectName} — amallar`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {editable && rows.map((r) => (
                            <DropdownMenuItem key={`edit-${r.id}`} onClick={() => setEditing(r)}>
                              Kredit va soatlar{rows.length > 1 ? ` (${r.semester}-semestr)` : ""}
                            </DropdownMenuItem>
                          ))}
                          {canLinkSyllabus && first.subjectId && (
                            <DropdownMenuItem onClick={() => setLinking(first)}>Boshqa o'quv dasturini tanlash</DropdownMenuItem>
                          )}
                          {editable && <DropdownMenuSeparator />}
                          {editable && rows.map((r) => (
                            <DropdownMenuItem key={`remove-${r.id}`} className="text-destructive" onClick={() => onRemove(r)}>
                              Rejadan olib tashlash{rows.length > 1 ? ` (${r.semester}-semestr)` : ""}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {groups.length === 0 && (
              <TableRow>
                <TableCell colSpan={showMenu ? 7 : 6} className="h-24 text-center text-muted-foreground">
                  Rejaga hali fan biriktirilmagan. Fanlarni qo'lda qo'shing yoki ishchi o'quv rejani Excel'dan yuklang.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
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
