import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { listGroups } from "@/lib/academic-api";
import { curriculumApi, type CurriculumVersion } from "@/services/api/curriculum-api";
import { downloadCsv } from "@/utils/csv-export";

const formatDate = (value?: string | null) => (value ? value.split("-").reverse().join(".") : "—");

/**
 * Barcha o'quv rejalar bo'yicha biriktirilgan talabalar (Everest "O'quv rejaga biriktirilgan talabalar" jadvali):
 * F.I.O., guruh, semestr, muddat, reja; o'quv yili / reja / semestr / guruh bo'yicha filtr va Excel (CSV).
 */
export function AttachedStudentsRegistry({ curricula, canWrite }: { curricula: CurriculumVersion[]; canWrite: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [academicYear, setAcademicYear] = useState("");
  const [curriculumId, setCurriculumId] = useState(0);
  const [semester, setSemester] = useState(0);
  const [groupId, setGroupId] = useState(0);
  const [search, setSearch] = useState("");
  const query = { academicYear: academicYear || undefined, curriculumId: curriculumId || undefined, semester: semester || undefined, groupId: groupId || undefined };
  const assignments = useQuery({ queryKey: ["curricula", "student-assignments", query], queryFn: () => curriculumApi.searchStudentAssignments(query) });
  const groups = useQuery({ queryKey: ["groups", "all"], queryFn: () => listGroups() });
  const remove = useMutation({
    mutationFn: ({ curriculum, id }: { curriculum: number; id: number }) => curriculumApi.removeStudentAssignment(curriculum, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["curricula"] });
      toast({ title: "Biriktirish olib tashlandi" });
    },
    onError: (error) => toast({ title: "Olib tashlab bo'lmadi", description: error instanceof Error ? error.message : "Xatolik", variant: "destructive" }),
  });

  const years = [...new Set(curricula.map((item) => item.academicYear))].sort().reverse();
  const needle = search.trim().toLowerCase();
  const rows = (assignments.data ?? []).filter((row) => !needle
    || row.fullName.toLowerCase().includes(needle) || row.studentNumber.toLowerCase().includes(needle));
  const select = "block h-10 rounded-md border bg-background px-3 text-sm";

  return <Card>
    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
      <div className="space-y-1.5">
        <CardTitle>Biriktirilgan talabalar</CardTitle>
        <CardDescription>Barcha o'quv rejalar bo'yicha: qaysi talaba qaysi reja va semestrga, qaysi muddatga biriktirilgan.</CardDescription>
      </div>
      <Button variant="outline" disabled={!rows.length} onClick={() => downloadCsv("biriktirilgan-talabalar.csv",
        ["F.I.O.", "Talaba raqami", "Guruh", "Semestr", "Boshlanish", "Tugash", "O'quv reja", "O'quv yili"],
        rows.map((row) => [row.fullName, row.studentNumber, row.groupName ?? "", row.semesterNumber, row.startsOn, row.endsOn, row.curriculumName ?? "", row.academicYear]))}>
        <Download className="mr-2 h-4 w-4" />Excelga yuklash
      </Button>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1 text-xs"><span>O'quv yili</span>
          <select aria-label="Jadval: o'quv yili" className={`${select} min-w-36`} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            <option value="">Barchasi</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="space-y-1 text-xs"><span>O'quv reja</span>
          <select aria-label="Jadval: o'quv reja" className={`${select} min-w-56`} value={curriculumId} onChange={(e) => setCurriculumId(Number(e.target.value))}>
            <option value={0}>Barchasi</option>
            {curricula.filter((item) => !academicYear || item.academicYear === academicYear).map((item) =>
              <option key={item.id} value={item.id}>{item.name || item.programName} · {item.versionCode}</option>)}
          </select>
        </div>
        <div className="space-y-1 text-xs"><span>Semestr</span>
          <select aria-label="Jadval: semestr" className={`${select} min-w-28`} value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
            <option value={0}>Barchasi</option>{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}-semestr</option>)}
          </select>
        </div>
        <div className="space-y-1 text-xs"><span>Guruh</span>
          <select aria-label="Jadval: guruh" className={`${select} min-w-40`} value={groupId} onChange={(e) => setGroupId(Number(e.target.value))}>
            <option value={0}>Barchasi</option>{(groups.data ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <Input className="max-w-xs" aria-label="Jadval: talaba qidirish" placeholder="F.I.O. yoki talaba raqami" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {assignments.isLoading && <div className="flex justify-center p-8"><Loader2 className="animate-spin" aria-label="Yuklanmoqda" /></div>}
      {assignments.isError && <p role="alert" className="text-sm text-destructive">Ro'yxatni yuklab bo'lmadi.</p>}
      {assignments.isSuccess && <div className="max-h-[480px] overflow-auto rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead className="w-12">№</TableHead>
            <TableHead>F.I.O.</TableHead>
            <TableHead>Guruh</TableHead>
            <TableHead>Semestr</TableHead>
            <TableHead>Boshlanish</TableHead>
            <TableHead>Tugash</TableHead>
            <TableHead>O'quv reja</TableHead>
            {canWrite && <TableHead className="w-12" />}
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((row, index) => <TableRow key={row.id}>
              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
              <TableCell><p className="font-medium">{row.fullName}</p><p className="text-xs text-muted-foreground">{row.studentNumber}</p></TableCell>
              <TableCell>{row.groupName ?? "—"}</TableCell>
              <TableCell>{row.semesterNumber}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(row.startsOn)}</TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(row.endsOn)}</TableCell>
              <TableCell><p className="text-sm">{row.curriculumName ?? "—"}</p><p className="text-xs text-muted-foreground">{row.academicYear}</p></TableCell>
              {canWrite && <TableCell>
                <Button variant="ghost" size="icon" disabled={remove.isPending} aria-label={`${row.fullName} — biriktirishni olib tashlash`}
                  onClick={() => remove.mutate({ curriculum: row.curriculumId, id: row.id })}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>}
            </TableRow>)}
            {rows.length === 0 && <TableRow><TableCell colSpan={canWrite ? 8 : 7} className="h-20 text-center text-muted-foreground">Biriktirilgan talaba topilmadi</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>}
      {assignments.isSuccess && rows.length > 0 && <p className="text-xs text-muted-foreground">Jami: {rows.length} ta</p>}
    </CardContent>
  </Card>;
}
