import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAcademicStatements, type AcademicStatementRow } from "@/services/api/academic-results-api";

interface SubjectControl { subject: string; sessions: number; completed: number }
interface GroupControls { key: string; group: string; academicYear: string; semester: number | null; subjects: SubjectControl[] }

/** Imtihon sessiyalari (qaydnomalar) guruh + o'quv yili + semestr bo'yicha; har fanda nechta nazorat va nechtasi o'tkazilgan */
const groupControls =(rows: AcademicStatementRow[]): GroupControls[] => {
  const groups = new Map<string, GroupControls & { bySubject: Map<string, SubjectControl> }>();
  for (const row of rows) {
    const key = `${row.academicYear}|${row.semester ?? ""}|${row.group}`;
    const entry = groups.get(key) ?? {
      key, group: row.group, academicYear: row.academicYear, semester: row.semester ?? null, subjects: [], bySubject: new Map(),
    };
    const subject = entry.bySubject.get(row.subject) ?? { subject: row.subject, sessions: 0, completed: 0 };
    subject.sessions += 1;
    if (row.finalStatement) subject.completed += 1;
    entry.bySubject.set(row.subject, subject);
    groups.set(key, entry);
  }
  return [...groups.values()]
    .map(({ bySubject, ...entry }) => ({ ...entry, subjects: [...bySubject.values()].sort((a, b) => a.subject.localeCompare(b.subject)) }))
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear) || (a.semester ?? 0) - (b.semester ?? 0) || a.group.localeCompare(b.group));
};

const ALL = "";

/**
 * "Nazoratlar": guruhlar kesimida fanlar bo'yicha nazorat (imtihon) sessiyalari holati — o'tkazilgan / rejalashtirilgan.
 * Sessiyalarni yaratish va o'tkazish "Imtihonlar" sahifasida.
 */
export function ControlsOverview() {
  const navigate = useNavigate();
  const [year, setYear] = useState(ALL);
  const [semester, setSemester] = useState(ALL);
  const [search, setSearch] = useState("");
  const statements = useQuery({ queryKey: ["academic-statements", "all"], queryFn: () => listAcademicStatements(), staleTime: 30_000 });
  const rows = useMemo(() => groupControls(statements.data ?? []), [statements.data]);
  const years = [...new Set(rows.map((r) => r.academicYear).filter(Boolean))].sort().reverse();
  const semesters = [...new Set(rows.map((r) => r.semester).filter((s): s is number => s != null))].sort((a, b) => a - b);
  const needle = search.trim().toLowerCase();
  const visible = rows.filter((r) => (!year || r.academicYear === year) && (!semester || String(r.semester) === semester)
    && (!needle || r.group.toLowerCase().includes(needle) || r.subjects.some((s) => s.subject.toLowerCase().includes(needle))));

  return <div className="space-y-6 p-3 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">Nazoratlar</h1>
        <p className="text-sm text-muted-foreground">Guruhlar kesimida fanlar bo'yicha nazorat (imtihon) sessiyalari: nechtasi o'tkazilgan va nechtasi rejalashtirilgan.</p>
      </div>
      <Button variant="outline" onClick={() => navigate("/exams")}><ClipboardList className="mr-2 h-4 w-4" />Imtihonlarni boshqarish</Button>
    </div>

    <div className="flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <label className="space-y-1 text-xs">O'quv yili
        <select aria-label="O'quv yili" className="block h-10 min-w-40 rounded-md border bg-background px-3 text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value={ALL}>Barchasi</option>{years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs">Semestr
        <select aria-label="Semestr" className="block h-10 min-w-32 rounded-md border bg-background px-3 text-sm" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value={ALL}>Barchasi</option>{semesters.map((s) => <option key={s} value={String(s)}>{s}-semestr</option>)}
        </select>
      </label>
      <Input className="max-w-xs" aria-label="Guruh yoki fan qidirish" placeholder="Guruh yoki fan" value={search} onChange={(e) => setSearch(e.target.value)} />
    </div>

    {statements.isLoading && <div className="flex justify-center p-12"><Loader2 className="animate-spin" aria-label="Yuklanmoqda" /></div>}
    {statements.isError && <Card className="border-destructive"><CardContent className="space-y-3 p-10 text-center">
      <p className="text-sm text-destructive">{statements.error instanceof Error ? statements.error.message : "Ma'lumot yuklanmadi"}</p>
      <Button variant="outline" onClick={() => void statements.refetch()}>Qayta urinish</Button>
    </CardContent></Card>}

    {statements.isSuccess && <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader><TableRow>
          <TableHead className="w-12">№</TableHead>
          <TableHead>Guruh</TableHead>
          <TableHead>O'quv yili</TableHead>
          <TableHead>Semestr</TableHead>
          <TableHead>Fanlar (o'tkazilgan / jami nazorat)</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {visible.map((row, index) => <TableRow key={row.key}>
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="font-medium">{row.group || "—"}</TableCell>
            <TableCell>{row.academicYear || "—"}</TableCell>
            <TableCell>{row.semester ?? "—"}</TableCell>
            <TableCell><div className="flex flex-wrap gap-1.5">{row.subjects.map((s) => {
              const done = s.completed === s.sessions;
              return <Badge key={s.subject} variant={done ? "default" : "outline"}
                title={done ? "Barcha nazoratlar o'tkazilgan" : `${s.sessions - s.completed} ta nazorat hali o'tkazilmagan`}>
                {s.subject} · {s.completed}/{s.sessions}
              </Badge>;
            })}</div></TableCell>
          </TableRow>)}
          {visible.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nazorat sessiyalari topilmadi</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>}
  </div>;
}
