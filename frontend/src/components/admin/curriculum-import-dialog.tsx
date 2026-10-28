import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, FileSpreadsheet, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { extractApiError } from "@/lib/academic-api";
import {
  courseWorkLabels, curriculumApi, type CurriculumImportAction, type CurriculumImportDraft, type CurriculumImportPreview,
  type CurriculumImportResult, type CurriculumImportRow,
} from "@/services/api/curriculum-api";

const selectClass = "h-9 w-full min-w-44 rounded-md border bg-background px-2 text-sm";

const hoursText = (r: CurriculumImportRow) => {
  const typed = [["M", r.lectureHours], ["A", r.practicalHours], ["L", r.laboratoryHours], ["S", r.seminarHours]]
    .filter(([, v]) => Number(v) > 0).map(([k, v]) => `${k} ${v}`).join(" · ");
  return `${typed || `auditoriya ${r.auditoryHours}`} · MT ${r.selfStudyHours}`;
};

/**
 * Ishchi o'quv rejani Excel'dan import qilish: fayl → ko'rib chiqish (varaq, fanlar, soatlar, katalogga moslik,
 * ogohlantirishlar; har qator uchun qaror) → rejaga qo'shish.
 */
export function CurriculumImportDialog({ curriculumId, initialFile, onClose, onImported }: {
  curriculumId: number;
  /** Reja Excel'dan yaratilganda — shu fayl darhol o'qiladi */
  initialFile?: File | null;
  onClose: () => void;
  onImported: (result: CurriculumImportResult) => unknown;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CurriculumImportPreview | null>(null);
  const [rows, setRows] = useState<CurriculumImportRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useMutation({
    mutationFn: ({ value, sheet }: { value: File; sheet?: string | null }) => curriculumApi.importPreview(curriculumId, value, sheet),
    onSuccess: (data) => { setPreview(data); setRows(data.rows); setError(null); },
    onError: (e) => setError(extractApiError(e, "Faylni o'qib bo'lmadi").message),
  });
  const apply = useMutation({
    mutationFn: () => curriculumApi.importApply(curriculumId, rows, {
      components: preview?.components ?? [], schedule: preview?.schedule ?? [], qualification: preview?.header?.qualification ?? null,
    }),
    onSuccess: async (result) => { await onImported(result); onClose(); },
    onError: (e) => setError(extractApiError(e, "Import qilinmadi").message),
  });

  const chooseFile = (value: File | null) => {
    setFile(value);
    setPreview(null);
    setRows([]);
    if (value) load.mutate({ value });
  };
  const setAction = (index: number, action: CurriculumImportAction) =>
    setRows((current) => current.map((row, i) => i === index
      ? { ...row, action, createCode: action === "CREATE" ? row.createCode ?? row.code : row.createCode }
      : row));

  const started = useRef(false);
  useEffect(() => {
    if (initialFile && !started.current) {
      started.current = true;
      chooseFile(initialFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat birinchi ochilishda
  }, []);

  const count = (action: CurriculumImportAction) => rows.filter((r) => r.action === action).length;
  const warnings = rows.filter((r) => r.issues.length > 0).length;
  const busy = load.isPending || apply.isPending;
  const toImport = rows.length - count("SKIP");

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="sm:max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ishchi o'quv rejani Excel'dan import qilish</DialogTitle>
          <DialogDescription>
            "II. O'quv rejasi" bo'limidagi fanlar, soatlar (ma'ruza, amaliy, laboratoriya, seminar, mustaqil ta'lim), kurs ishi
            (loyihasi) va semestrlar bo'yicha kreditlar o'qiladi. Ko'p semestrli fan har semestr uchun alohida qo'shiladi.
            Fayl sarlavhasi (yo'nalish, ta'lim shakli, muddat) rejaga solishtiriladi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-[1fr_280px]">
          <div className="space-y-1.5">
            <Label htmlFor="curriculum-file">Excel fayl (.xlsx)</Label>
            <Input id="curriculum-file" type="file" accept=".xlsx,.xls" disabled={busy}
              onChange={(e) => chooseFile(e.target.files?.[0] ?? null)} />
            {file && initialFile === file && <p className="text-xs text-muted-foreground">Fayl: {file.name}</p>}
          </div>
          {preview && preview.sheets.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="curriculum-sheet">Varaq</Label>
              <select id="curriculum-sheet" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={preview.sheet ?? ""}
                disabled={busy} onChange={(e) => file && load.mutate({ value: file, sheet: e.target.value })}>
                {preview.sheets.map((s) => (
                  <option key={s.name} value={s.name} disabled={s.rowCount === 0}>{s.name} ({s.rowCount} ta fan)</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {load.isPending && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Fayl o'qilmoqda...</p>}
        {!file && !load.isPending && (
          <p className="flex items-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-5 w-5" />Ishchi o'quv reja faylini tanlang — avval ko'rib chiqasiz, so'ng rejaga qo'shiladi.
          </p>
        )}

        {preview?.header && !load.isPending && (preview.header.programCode || preview.header.educationFormText) && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm" aria-label="Fayl sarlavhasi">
            <p className="font-medium">{[preview.header.programCode, preview.header.programName].filter(Boolean).join(" – ")}</p>
            <p className="text-xs text-muted-foreground">
              {[
                preview.header.degree,
                preview.header.educationFormText && `ta'lim shakli: ${preview.header.educationFormText}`,
                preview.header.durationYears && `o'qish muddati: ${preview.header.durationYears} yil`,
                preview.header.qualification && `kvalifikatsiya: ${preview.header.qualification}`,
              ].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
        {!load.isPending && ((preview?.components?.length ?? 0) > 0 || (preview?.schedule?.length ?? 0) > 0) && (
          <div className="space-y-0.5 rounded-md border p-3 text-sm" aria-label="Fan bo'lmagan qismlar">
            <p className="font-medium">Fanlardan tashqari rejaga qo'shiladi:</p>
            {preview!.components?.map((c) => (
              <p key={`${c.type}-${c.semester}`} className="text-xs text-muted-foreground">
                {c.name} — {[c.semester ? `${c.semester}-semestr` : "oxirgi semestr", c.credits ? `${c.credits} kredit` : null,
                  c.hours ? `${c.hours} soat` : null, c.weeks ? `${c.weeks} hafta` : null].filter(Boolean).join(" · ")}
              </p>
            ))}
            {(preview!.schedule?.length ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">O'quv jarayoni jadvali — {preview!.schedule!.length} kurs bo'yicha haftalar</p>
            )}
          </div>
        )}
        {!load.isPending && (preview?.warnings?.length ?? 0) > 0 && (
          <div aria-label="Fayl va reja farqi" className="space-y-1 rounded-md border border-amber-300 p-3 text-sm text-amber-800 dark:border-amber-800 dark:text-amber-300">
            {preview!.warnings!.map((warning) => (
              <p key={warning} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{warning}</p>
            ))}
            <p className="text-xs">Fayl to'g'ri rejaga yuklanayotganini tekshiring.</p>
          </div>
        )}

        {preview && !load.isPending && (
          rows.length === 0 ? (
            <p role="status" className="rounded-md border p-3 text-sm">Bu varaqda o'quv reja fanlari topilmadi. Boshqa varaqni tanlang.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 text-xs" role="status">
                <Badge variant="secondary">{rows.length} ta qator</Badge>
                <Badge variant="outline">Mavjud fan: {count("USE_EXISTING")}</Badge>
                <Badge variant="outline">Yangi fan: {count("CREATE")}</Badge>
                <Badge variant="outline">O'tkaziladi: {count("SKIP")}</Badge>
                {warnings > 0 && <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">Ogohlantirish: {warnings}</Badge>}
              </div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>T/r</TableHead>
                      <TableHead>Fan</TableHead>
                      <TableHead>Semestr: kredit</TableHead>
                      <TableHead>Soatlar</TableHead>
                      <TableHead>Qaror</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={`${row.rowNumber}-${row.code}-${index}`} className={row.action === "SKIP" ? "opacity-60" : undefined}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {row.rowNumber}{row.alternative && <span className="block text-[10px]">muqobil</span>}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.code} · {row.planItemType === "REQUIRED" ? "Majburiy" : "Tanlov"}
                            {row.courseWorkType && <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px]">{courseWorkLabels[row.courseWorkType]}</Badge>}
                          </p>
                          {row.issues.map((issue) => (
                            <p key={issue} className="mt-0.5 flex items-start gap-1 text-xs text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{issue}
                            </p>
                          ))}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {row.semesterCredits.length ? row.semesterCredits.map((s) => `${s.semester}: ${s.credits}`).join(", ") : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{hoursText(row)}</TableCell>
                        <TableCell>
                          <select aria-label={`${row.name} — qaror`} className={selectClass} value={row.action} disabled={busy}
                            onChange={(e) => setAction(index, e.target.value as CurriculumImportAction)}>
                            {row.subjectId && <option value="USE_EXISTING">Mavjud: {row.subjectName}</option>}
                            <option value="CREATE" disabled={!row.semesterCredits.length}>Yangi fan ({row.createCode ?? row.code})</option>
                            <option value="SKIP">O'tkazib yuborish</option>
                          </select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={apply.isPending}>Bekor qilish</Button>
          <Button onClick={() => apply.mutate()} disabled={busy || toImport === 0}>
            {apply.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import qilish ({toImport} ta fan)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Yangi reja formasini ishchi o'quv reja faylidan to'ldirish: yo'nalish (kodi bo'yicha), ta'lim shakli, semestrlar soni
 * va kvalifikatsiya. Reja saqlangach, fanlar shu fayldan import qilinadi.
 */
export function CurriculumExcelPrefill({ onFilled }: { onFilled: (draft: CurriculumImportDraft, file: File) => unknown }) {
  const [draft, setDraft] = useState<CurriculumImportDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const read = useMutation({
    mutationFn: (file: File) => curriculumApi.importDraft(file).then((result) => ({ result, file })),
    onSuccess: ({ result, file }) => { setDraft(result); setError(null); void onFilled(result, file); },
    onError: (e) => { setDraft(null); setError(extractApiError(e, "Faylni o'qib bo'lmadi").message); },
  });
  const header = draft?.header;

  return (
    <div className="space-y-2 rounded-md border border-dashed p-3" aria-label="Excel'dan to'ldirish">
      <Label htmlFor="curriculum-prefill" className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4" />Ishchi o'quv reja faylidan to'ldirish</Label>
      <Input id="curriculum-prefill" type="file" accept=".xlsx,.xls" disabled={read.isPending}
        onChange={(e) => { const file = e.target.files?.[0]; if (file) read.mutate(file); }} />
      {read.isPending && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Fayl o'qilmoqda...</p>}
      {draft && !read.isPending && (
        <div role="status" className="space-y-0.5 text-xs">
          <p>
            Fayldan olindi: {[draft.programName ?? (header?.programCode ? `${header.programCode} – ${header.programName ?? ""}` : null),
              header?.educationFormText && `ta'lim shakli: ${header.educationFormText}`, draft.semesterCount && `${draft.semesterCount} semestr`,
              header?.qualification && `kvalifikatsiya: ${header.qualification}`].filter(Boolean).join(" · ") || "sarlavha topilmadi"}
          </p>
          {header?.programCode && !draft.programId && (
            <p className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />Yo'nalish {header.programCode} tizimda topilmadi — mutaxassislikni qo'lda tanlang.
            </p>
          )}
          <p className="text-muted-foreground">Reja saqlangach, fanlar, amaliyot va o'quv jarayoni jadvali shu fayldan import qilinadi.</p>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
