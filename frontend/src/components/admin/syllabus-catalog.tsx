import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SyllabusWorkflow, syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { SyllabusDrawer } from "@/components/admin/syllabus-drawer";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { languageLabel, syllabusLanguages } from "@/lib/syllabus";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

const select = "h-10 rounded-md border bg-background px-3 text-sm";

/**
 * Barcha o'quv dasturlari katalogi (Everest "O'quv dasturi"): holat, nomi, fan tili, mavzular; ko'rish/tahrirlash/
 * o'chirish va yangi dastur (nomi, til, qisqa ta'rif, talablar, to'liq ta'rif — alohida maydonlar).
 */
export function SyllabusCatalog({ canWrite }: { canWrite: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const syllabi = useQuery({ queryKey: ["syllabi"], queryFn: () => syllabusApi.list() });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [language, setLanguage] = useState("");
  const [year, setYear] = useState("");
  const [viewing, setViewing] = useState<SubjectSyllabus | null>(null);
  const [editing, setEditing] = useState<SubjectSyllabus | "new" | null>(null);
  const [toDelete, setToDelete] = useState<SubjectSyllabus | null>(null);
  const reload = () => queryClient.invalidateQueries({ queryKey: ["syllabi"] });
  const remove = useMutation({
    mutationFn: (id: number) => syllabusApi.delete(id),
    onSuccess: async () => { setToDelete(null); await reload(); toast({ title: "O'quv dasturi o'chirildi" }); },
    onError: (e) => toast({ title: "O'chirib bo'lmadi", description: extractApiError(e, "Xatolik").message, variant: "destructive" }),
  });

  const rows = syllabi.data ?? [];
  const years = [...new Set(rows.map((r) => r.academicYear).filter((y): y is string => !!y))].sort().reverse();
  const needle = search.trim().toLowerCase();
  const visible = rows.filter((r) => (!status || r.status === status) && (!language || r.language === language)
    && (!year || (year === "none" ? !r.academicYear : r.academicYear === year))
    && (!needle || r.name.toLowerCase().includes(needle) || r.subjectName.toLowerCase().includes(needle) || (r.subjectCode ?? "").toLowerCase().includes(needle)));

  return <div className="space-y-4">
    {viewing && <SyllabusWorkflow item={viewing} canWrite={canWrite} reload={reload} close={() => setViewing(null)} />}
    {editing && <SyllabusDrawer item={editing === "new" ? null : editing} canWrite={canWrite} onClose={() => setEditing(null)}
      onSaved={() => reload()} />}
    <AlertDialog open={toDelete != null} onOpenChange={(open) => { if (!open && !remove.isPending) setToDelete(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>O'quv dasturini o'chirasizmi?</AlertDialogTitle>
          <AlertDialogDescription>{toDelete?.name} va uning mavzulari o'chiriladi. Rejaga yoki kursga bog'langan dastur o'chirilmaydi.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={remove.isPending}
            onClick={(event) => { event.preventDefault(); if (toDelete) remove.mutate(toDelete.id); }}>O'chirish</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <Input className="w-64" aria-label="Dastur qidirish" placeholder="Dastur yoki fan nomi, kodi" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select aria-label="Holati" className={select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Barcha holatlar</option>
          {Object.entries(syllabusStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Fan tili" className={select} value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">Barcha tillar</option>
          {syllabusLanguages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <select aria-label="O'quv yili" className={select} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Barcha yillar</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
          <option value="none">Yilga bog'lanmagan</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary">Umumiy soni: {visible.length}</Badge>
        {canWrite && <Button onClick={() => setEditing("new")}><Plus className="mr-2 h-4 w-4" />Yangi dastur</Button>}
      </div>
    </div>

    {syllabi.isLoading && <div className="flex justify-center p-10"><Loader2 className="animate-spin" aria-label="Yuklanmoqda" /></div>}
    {syllabi.isError && <p role="alert" className="text-sm text-destructive">O'quv dasturlarini yuklab bo'lmadi.</p>}
    {syllabi.isSuccess && <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="w-12">№</TableHead>
          <TableHead>Holati</TableHead>
          <TableHead>Nomi</TableHead>
          <TableHead>Fan tili</TableHead>
          <TableHead>O'quv yili</TableHead>
          <TableHead className="text-right">Modul / dars</TableHead>
          <TableHead className="text-right">Amallar</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {visible.map((item, index) => {
            const draft = item.status === "DRAFT";
            return <TableRow key={item.id}>
              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
              <TableCell><Badge variant={item.status === "APPROVED" ? "default" : "secondary"}>{syllabusStatuses[item.status]}</Badge></TableCell>
              <TableCell><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.subjectCode ? `${item.subjectCode} · ` : ""}{item.subjectName}</p></TableCell>
              <TableCell>{languageLabel(item.language)}</TableCell>
              <TableCell>{item.academicYear ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{item.modules?.length ?? 0} / {item.topics?.length ?? 0}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" aria-label={`${item.name} — ko'rish`} onClick={() => setViewing(item)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label={`${item.name} — ${canWrite && draft ? "tahrirlash" : "dasturni ochish"}`}
                    title={canWrite && draft ? "Ma'lumot va dastur (modullar, darslar)" : "Ko'rish (tahrirlash uchun yangi versiya oching)"} onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></Button>
                  {canWrite && <Button variant="ghost" size="icon" className="text-destructive" disabled={!draft || item.revisionNumber > 1} aria-label={`${item.name} — o'chirish`}
                    title={draft && item.revisionNumber === 1 ? "O'chirish" : "Tasdiqlash tarixi bor dastur o'chirilmaydi"} onClick={() => setToDelete(item)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </TableCell>
            </TableRow>;
          })}
          {visible.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">O'quv dasturi topilmadi</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>}
  </div>;
}
