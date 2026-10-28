import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CalendarRange, GraduationCap, Loader2, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { cn } from "@/lib/utils";
import {
  componentLabels, curriculumApi, type CurriculumComponent, type CurriculumComponentType, type CurriculumScheduleRow,
  type SaveCurriculumComponentInput,
} from "@/services/api/curriculum-api";

const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

/**
 * Rejadagi fan bo'lmagan qismlar: malakaviy amaliyot va yakuniy davlat attestatsiyasi (semestr, kredit, soat, hafta).
 * Kreditlari rejaning jami kreditiga qo'shiladi. Excel importda fayldan avtomatik olinadi.
 */
export function CurriculumComponentsCard({ curriculumId, components, semesterCount, editable, onChanged }: {
  curriculumId: number;
  components: CurriculumComponent[];
  semesterCount: number;
  /** Qo'shish/tahrirlash (faqat qoralama reja) */
  editable: boolean;
  onChanged: () => unknown;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<CurriculumComponent | "new" | null>(null);
  const remove = useMutation({
    mutationFn: (componentId: number) => curriculumApi.removeComponent(curriculumId, componentId),
    onSuccess: () => onChanged(),
    onError: (e) => toast({ variant: "destructive", title: "O'chirilmadi", description: extractApiError(e, "Xatolik").message }),
  });

  return (
    <Card>
      {editing && (
        <ComponentDialog curriculumId={curriculumId} semesterCount={semesterCount} component={editing === "new" ? null : editing}
          onClose={() => setEditing(null)} onSaved={async () => { await onChanged(); setEditing(null); }} />
      )}
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />Malakaviy amaliyot va yakuniy davlat attestatsiyasi</CardTitle>
            <CardDescription>Fan emas — kreditlari rejaning jami kreditiga qo'shiladi.</CardDescription>
          </div>
          {editable && <Button variant="outline" onClick={() => setEditing("new")}><Plus className="mr-2 h-4 w-4" />Qo'shish</Button>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Semestr</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
                <TableHead className="text-right">Soat</TableHead>
                <TableHead className="text-right">Hafta</TableHead>
                {editable && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name}</p>
                    {c.name !== componentLabels[c.type] && <p className="text-xs text-muted-foreground">{componentLabels[c.type]}</p>}
                  </TableCell>
                  <TableCell>{c.semester}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.credits}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.hours || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.weeks ?? "—"}</TableCell>
                  {editable && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${c.name} — amallar`}><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditing(c)}>Tahrirlash</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate(c.id)}>O'chirish</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {components.length === 0 && (
                <TableRow>
                  <TableCell colSpan={editable ? 6 : 5} className="h-16 text-center text-muted-foreground">
                    Kiritilmagan. Ishchi o'quv reja Excel'dan import qilinganda fayldan olinadi.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentDialog({ curriculumId, semesterCount, component, onClose, onSaved }: {
  curriculumId: number;
  semesterCount: number;
  component: CurriculumComponent | null;
  onClose: () => void;
  onSaved: () => unknown;
}) {
  const [form, setForm] = useState<SaveCurriculumComponentInput>(component
    ? { type: component.type, name: component.name, semester: component.semester, credits: component.credits, hours: component.hours, weeks: component.weeks ?? null }
    : { type: "PRACTICE", name: "", semester: semesterCount, credits: 0, hours: 0, weeks: null });
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: () => {
      const input = { ...form, name: form.name?.trim() || null };
      return component ? curriculumApi.updateComponent(curriculumId, component.id, input) : curriculumApi.addComponent(curriculumId, input);
    },
    onSuccess: () => onSaved(),
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });
  const number = (key: "credits" | "hours", value: string) => setForm((f) => ({ ...f, [key]: Math.max(0, Math.round(Number(value) || 0)) }));

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{component ? component.name : "Malakaviy amaliyot yoki YaDA"}</DialogTitle>
          <DialogDescription>Ishchi o'quv rejadagidek: semestr, kredit, soat va hafta.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="component-type">Turi</Label>
            <select id="component-type" className={selectClass} value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CurriculumComponentType }))}>
              {(Object.keys(componentLabels) as CurriculumComponentType[]).map((type) => <option key={type} value={type}>{componentLabels[type]}</option>)}
            </select></div>
          <div className="space-y-1.5"><Label htmlFor="component-semester">Semestr</Label>
            <select id="component-semester" className={selectClass} value={form.semester}
              onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}>
              {Array.from({ length: semesterCount }, (_, i) => i + 1).map((s) => <option key={s} value={s}>{s}-semestr</option>)}
            </select></div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="component-name">Nomi</Label>
          <Input id="component-name" maxLength={500} value={form.name ?? ""} placeholder={componentLabels[form.type]}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label htmlFor="component-credits">Kredit</Label>
            <Input id="component-credits" type="number" min={0} max={60} value={form.credits} onChange={(e) => number("credits", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="component-hours">Soat</Label>
            <Input id="component-hours" type="number" min={0} value={form.hours} onChange={(e) => number("hours", e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="component-weeks">Hafta</Label>
            <Input id="component-weeks" type="number" min={0} max={52} value={form.weeks ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, weeks: e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value) || 0)) }))} /></div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>Bekor qilish</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** O'quv jarayoni jadvali kodlari (ishchi o'quv rejadagi shartli belgilar). */
const WEEK_CODES: { code: string; label: string; className: string }[] = [
  { code: "", label: "Nazariy ta'lim", className: "bg-background" },
  { code: "A", label: "Attestatsiya", className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200" },
  { code: "FT", label: "Fanlarni tanlash", className: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200" },
  { code: "M", label: "Malakaviy amaliyot", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200" },
  { code: "B", label: "Bitiruv malakaviy ishi", className: "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200" },
  { code: "G", label: "GPA hisoblash", className: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200" },
  { code: "T", label: "Ta'til", className: "bg-muted text-muted-foreground" },
];
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
const codeClass = (code: string) => WEEK_CODES.find((c) => c.code === code)?.className ?? "bg-background";

/** "I. O'quv jarayoni jadvali": kurslar bo'yicha haftalar (ishchi o'quv rejadan import qilinadi). */
export function CurriculumScheduleCard({ schedule }: { schedule: CurriculumScheduleRow[] }) {
  const weeks = Math.max(...schedule.map((row) => row.weeks.length), 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarRange className="h-5 w-5" />O'quv jarayoni jadvali</CardTitle>
        <CardDescription>Kurslar bo'yicha haftalar (ishchi o'quv rejadan). Bo'sh katak — nazariy ta'lim.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-md border">
          <table className="border-collapse text-[10px]" aria-label="O'quv jarayoni jadvali">
            <thead>
              <tr>
                <th className="sticky left-0 bg-background px-2 py-1 text-left font-medium">Kurs</th>
                {Array.from({ length: weeks }, (_, i) => <th key={i} className="w-5 px-0 py-1 text-center font-normal text-muted-foreground">{i + 1}</th>)}
                {WEEK_CODES.map((c) => <th key={c.code} className="px-1.5 py-1 text-center font-medium" title={c.label}>{c.code || "N"}</th>)}
                <th className="px-1.5 py-1 text-center font-medium">Jami</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.course} className="border-t">
                  <td className="sticky left-0 bg-background px-2 py-1 font-medium">{ROMAN[row.course - 1] ?? row.course}</td>
                  {Array.from({ length: weeks }, (_, i) => {
                    const code = row.weeks[i];
                    return (
                      <td key={i} className={cn("h-6 w-5 border-l text-center", code === undefined ? "bg-muted/30" : codeClass(code))}>
                        {code ?? ""}
                      </td>
                    );
                  })}
                  {WEEK_CODES.map((c) => (
                    <td key={c.code} className="border-l px-1.5 text-center tabular-nums">{row.weeks.filter((w) => w === c.code).length || "—"}</td>
                  ))}
                  <td className="border-l px-1.5 text-center font-medium tabular-nums">{row.weeks.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {WEEK_CODES.map((c) => (
            <li key={c.code} className="flex items-center gap-1.5">
              <span className={cn("inline-flex h-4 min-w-6 items-center justify-center rounded border px-1 text-[10px]", c.className)}>{c.code || "N"}</span>
              {c.label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
