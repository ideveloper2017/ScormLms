import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown, BookOpen, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronRight as Crumb, Eye, Loader2,
  Link2, MoreVertical, Pencil, Plus, Search, Trash2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SyllabusWorkflow, syllabusStatuses } from "@/components/admin/syllabus-workflow";
import { SyllabusPage } from "@/components/admin/syllabus-page";
import { SyllabusPlanLinkDialog } from "@/components/admin/syllabus-plan-link";
import { SyllabusCover } from "@/components/learning/syllabus-media";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import { languageLabel, syllabusLanguages } from "@/lib/syllabus";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

const select = "h-10 rounded-md border bg-background px-3 text-sm";
const PAGE_SIZES = [10, 25, 50];
const STATUS_ORDER: Record<string, number> = { DRAFT: 0, SUBMITTED: 1, RETURNED: 2, APPROVED: 3, ARCHIVED: 4 };
type Sort = { key: "name" | "subject" | "status"; asc: boolean };

/**
 * Barcha o'quv dasturlari (Mentor LMS "Course List" kabi): sarlavha va yo'l, o'ngda "Yangi dastur"; kartada qidiruv,
 * filtrlar va sahifa hajmi; jadval — fan, dastur nomi (ochiladi), holat, til, o'quv yili, tuzilishi va ⋮ amallar;
 * pastda sahifalash.
 */
export function SyllabusCatalog({ canWrite }: { canWrite: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const syllabi = useQuery({ queryKey: ["syllabi"], queryFn: () => syllabusApi.list() });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [language, setLanguage] = useState("");
  const [year, setYear] = useState("");
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<Sort>({ key: "subject", asc: true });
  const [viewing, setViewing] = useState<SubjectSyllabus | null>(null);
  const [editing, setEditing] = useState<SubjectSyllabus | "new" | null>(null);
  const [toDelete, setToDelete] = useState<SubjectSyllabus | null>(null);
  const [linking, setLinking] = useState<SubjectSyllabus | null>(null);
  const reload = () => queryClient.invalidateQueries({ queryKey: ["syllabi"] });
  const remove = useMutation({
    mutationFn: (id: number) => syllabusApi.delete(id),
    onSuccess: async () => { setToDelete(null); await reload(); toast({ title: "O'quv dasturi o'chirildi" }); },
    onError: (e) => toast({ title: "O'chirib bo'lmadi", description: extractApiError(e, "Xatolik").message, variant: "destructive" }),
  });

  const rows = syllabi.data ?? [];
  const years = [...new Set(rows.map((r) => r.academicYear).filter((y): y is string => !!y))].sort().reverse();
  const needle = search.trim().toLowerCase();
  const filtered = rows.filter((r) => (!status || r.status === status) && (!language || r.language === language)
    && (!year || (year === "none" ? !r.academicYear : r.academicYear === year))
    && (!needle || r.name.toLowerCase().includes(needle) || (r.subjectName ?? "").toLowerCase().includes(needle) || (r.subjectCode ?? "").toLowerCase().includes(needle)));
  const value = (r: SubjectSyllabus) => sort.key === "status" ? String(STATUS_ORDER[r.status] ?? 9) : sort.key === "name" ? r.name : r.subjectName ?? "";
  const sorted = [...filtered].sort((a, b) => (sort.asc ? 1 : -1) * value(a).localeCompare(value(b), "uz"));
  const pages = Math.max(1, Math.ceil(sorted.length / size));
  const current = Math.min(page, pages - 1);
  const visible = sorted.slice(current * size, current * size + size);
  const sortBy = (key: Sort["key"]) => setSort((s) => ({ key, asc: s.key === key ? !s.asc : true }));
  const filter = (apply: () => void) => { apply(); setPage(0); };

  // Dastur ro'yxat o'rnida to'liq sahifa bo'lib ochiladi
  if (editing) return <SyllabusPage item={editing === "new" ? null : editing} canWrite={canWrite} onClose={() => setEditing(null)}
    onSaved={() => reload()} />;

  const SortHead = ({ k, label }: { k: Sort["key"]; label: string }) =>
    <button type="button" onClick={() => sortBy(k)} className="inline-flex items-center gap-1 font-medium hover:text-foreground">
      {label}<ArrowUpDown className={`h-3.5 w-3.5 ${sort.key === k ? "text-foreground" : "opacity-50"}`} /></button>;

  return <div className="space-y-5">
    {linking && <SyllabusPlanLinkDialog syllabus={linking} onClose={() => setLinking(null)} onLinked={() => setLinking(null)} />}
    {viewing && <SyllabusWorkflow item={viewing} canWrite={canWrite} reload={reload} close={() => setViewing(null)} />}
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
      <div>
        <h1 className="text-2xl font-bold">O'quv dasturlari</h1>
        <nav aria-label="Sahifa yo'li" className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <span>Bosh sahifa</span><Crumb className="h-3.5 w-3.5" /><span className="text-foreground">O'quv dasturlari</span>
        </nav>
      </div>
      {canWrite && <Button onClick={() => setEditing("new")}><Plus className="mr-2 h-4 w-4" />Yangi dastur</Button>}
    </div>

    <section aria-label="Dasturlar ro'yxati" className="overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Dasturlar ro'yxati</h2>
          <Badge variant="secondary">Umumiy soni: {filtered.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-64 pl-9" aria-label="Dastur qidirish" placeholder="Qidirish: dastur, fan, kod" value={search} onChange={(e) => filter(() => setSearch(e.target.value))} />
          </div>
          <select aria-label="Holati" className={select} value={status} onChange={(e) => filter(() => setStatus(e.target.value))}>
            <option value="">Barcha holatlar</option>
            {Object.entries(syllabusStatuses).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <select aria-label="Fan tili" className={select} value={language} onChange={(e) => filter(() => setLanguage(e.target.value))}>
            <option value="">Barcha tillar</option>
            {syllabusLanguages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select aria-label="O'quv yili" className={select} value={year} onChange={(e) => filter(() => setYear(e.target.value))}>
            <option value="">Barcha yillar</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
            <option value="none">Yilga bog'lanmagan</option>
          </select>
          <select aria-label="Sahifadagi qatorlar" className={`${select} w-20`} value={size} onChange={(e) => filter(() => setSize(Number(e.target.value)))}>
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {syllabi.isLoading && <div className="flex justify-center p-10"><Loader2 className="animate-spin" aria-label="Yuklanmoqda" /></div>}
      {syllabi.isError && <p role="alert" className="p-4 text-sm text-destructive">O'quv dasturlarini yuklab bo'lmadi.</p>}
      {syllabi.isSuccess && <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead><SortHead k="subject" label="Fan" /></TableHead>
            <TableHead><SortHead k="name" label="Dastur nomi" /></TableHead>
            <TableHead><SortHead k="status" label="Holati" /></TableHead>
            <TableHead>Tili</TableHead>
            <TableHead>O'quv yili</TableHead>
            <TableHead>Tuzilishi</TableHead>
            <TableHead className="w-16 text-right">Amallar</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {visible.map((item) => {
              const draft = item.status === "DRAFT";
              const editable = canWrite && draft;
              const deletable = draft && item.revisionNumber === 1;
              return <TableRow key={item.id}>
                <TableCell className="py-4">
                  {item.subjectName ? <>
                    <p className="font-medium">{item.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{item.subjectCode ?? "—"}</p>
                  </> : <Badge variant="outline" className="font-normal text-muted-foreground">Fanga biriktirilmagan</Badge>}
                </TableCell>
                <TableCell className="max-w-80">
                  <button type="button" aria-label={`${item.name} — ${editable ? "tahrirlash" : "dasturni ochish"}`}
                    title={editable ? "Ma'lumot va dastur (bo'limlar, darslar)" : "Ko'rish (tahrirlash uchun yangi versiya oching)"}
                    onClick={() => setEditing(item)} className="flex items-center gap-3 text-left hover:underline">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground">
                      {item.coverImageAvailable
                        ? <SyllabusCover queryKey={["syllabus", item.id, "media", "cover", item.updatedAt]} load={() => syllabusApi.mediaFile(item.id, "cover")}
                          available alt="" className="h-full w-full" />
                        : <BookOpen className="h-4 w-4" />}
                    </span>
                    <span>{item.name}</span>
                  </button>
                </TableCell>
                <TableCell><Badge variant={item.status === "APPROVED" ? "default" : "secondary"}>{syllabusStatuses[item.status]}</Badge></TableCell>
                <TableCell>{languageLabel(item.language)}</TableCell>
                <TableCell className="whitespace-nowrap">{item.academicYear ?? "—"}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="h-8 whitespace-nowrap" aria-label={`${item.name} — ko'rish`} onClick={() => setViewing(item)}>
                    <Eye className="mr-1.5 h-3.5 w-3.5" />{item.modules?.length ?? 0} bo'lim · {item.topics?.length ?? 0} dars
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`${item.name} — amallar`}><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(item)}><Pencil className="mr-2 h-4 w-4" />{editable ? "Tahrirlash" : "Ochish"}</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setViewing(item)}><Eye className="mr-2 h-4 w-4" />Tasdiqlash va tarix</DropdownMenuItem>
                      {canWrite && <>
                        <DropdownMenuItem onSelect={() => setLinking(item)}><Link2 className="mr-2 h-4 w-4" />O'quv rejaga biriktirish</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled={!deletable} className="text-destructive focus:text-destructive" onSelect={() => setToDelete(item)}
                          title={deletable ? undefined : "Tasdiqlash tarixi bor dastur o'chirilmaydi"}>
                          <Trash2 className="mr-2 h-4 w-4" />O'chirish</DropdownMenuItem>
                      </>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>;
            })}
            {visible.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">O'quv dasturi topilmadi</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>}

      {syllabi.isSuccess && filtered.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
        <span>{filtered.length} tadan {current * size + 1}–{Math.min(filtered.length, (current + 1) * size)} ko'rsatilmoqda</span>
        <nav aria-label="Sahifalar" className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Birinchi sahifa" disabled={current === 0} onClick={() => setPage(0)}><ChevronsLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Oldingi sahifa" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-2">Sahifa <span className="font-medium text-foreground">{current + 1}</span> / {pages}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Keyingi sahifa" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Oxirgi sahifa" disabled={current >= pages - 1} onClick={() => setPage(pages - 1)}><ChevronsRight className="h-4 w-4" /></Button>
        </nav>
      </div>}
    </section>
  </div>;
}
