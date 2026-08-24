import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CrudSection, useCrudData } from "@/components/admin/crud-section";
import { useAuth } from "@/contexts/auth-context";
import { hasAuthority } from "@/lib/rbac-api";
import {
  createRatingSystem,
  deleteRatingSystem,
  listAcademicStatements,
  listAcademicTestResults,
  listRatingSystems,
  listStudentAcademicResults,
  listStudentGpa,
  updateRatingSystem,
  type AcademicStatementRow,
  type RatingSystemRecord,
  type SaveRatingSystemRequest,
  type StudentAcademicResult,
  type StudentGpaRow,
  type TestResultRow,
} from "@/services/api/academic-results-api";

const ALL = "__all__";
const number = (value?: number | null) => value == null ? "—" : value.toLocaleString("uz-Latn", { maximumFractionDigits: 2 });
const date = (value?: string | null) => value ? new Date(value).toLocaleString("uz-Latn") : "—";

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

function Header({ title, description, onExport, action }: { title: string; description: string; onExport?: () => void; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div><div className="flex gap-2">{action}{onExport && <Button variant="outline" onClick={onExport}><Download className="mr-2 h-4 w-4" />Excel uchun CSV</Button>}</div></div>;
}

function QueryState({ loading, error, retry }: { loading: boolean; error: unknown; retry: () => void }) {
  if (loading) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Yuklanmoqda...</CardContent></Card>;
  if (error) return <Card className="border-destructive"><CardContent className="space-y-3 p-10 text-center"><p className="text-sm text-destructive">{error instanceof Error ? error.message : "Ma'lumot yuklanmadi"}</p><Button variant="outline" onClick={retry}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button></CardContent></Card>;
  return null;
}

function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <div className="min-w-40 space-y-1"><Label className="text-xs">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Barchasi</SelectItem>{values.filter(Boolean).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>;
}

const emptyRating = (): SaveRatingSystemRequest => ({ name: "", shortName: "", minScore: 0, maxScore: 100, passScore: 60, active: true });

export function AdminRatingSystems() {
  const { user } = useAuth();
  const data = useCrudData<RatingSystemRecord>(["rating-systems"], listRatingSystems);
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  return <div className="space-y-6 p-3 sm:p-6">
    <Header title="Baholash tizimi" description="Baholash shkalasi, qisqa nomi, Min-Max va o'tish bali." />
    <CrudSection<RatingSystemRecord, SaveRatingSystemRequest>
      title="Baholash tizimlari" items={data.items} loading={data.loading} error={data.error} onReload={data.reload}
      canWrite={canWrite} getId={(item) => item.id} getName={(item) => item.name}
      search={(item) => `${item.name} ${item.shortName}`}
      columns={[
        { header: "Nomi", cell: (item) => <span className="font-medium">{item.name}</span> },
        { header: "Qisqacha nomi", cell: (item) => item.shortName },
        { header: "Min-Max", cell: (item) => `${item.minScore} — ${item.maxScore}` },
        { header: "O'tish bali", cell: (item) => item.passScore },
        { header: "Holati", cell: (item) => <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Faol" : "Faol emas"}</Badge> },
      ]}
      blankForm={emptyRating} toForm={(item) => ({ ...item })}
      validate={(form) => !form.name.trim() ? "Nomi majburiy" : !form.shortName.trim() ? "Qisqacha nom majburiy" : form.maxScore <= form.minScore ? "Max qiymat Min qiymatdan katta bo'lishi kerak" : form.passScore < form.minScore || form.passScore > form.maxScore ? "O'tish bali Min-Max oralig'ida bo'lishi kerak" : null}
      onCreate={(form) => createRatingSystem(form).then(() => undefined)}
      onUpdate={(id, form) => updateRatingSystem(id, form).then(() => undefined)}
      onDelete={deleteRatingSystem}
      renderForm={(form, set) => <div className="grid gap-4">
        <div className="space-y-1.5"><Label>Nomi *</Label><Input value={form.name} onChange={(event) => set({ name: event.target.value })} /></div>
        <div className="space-y-1.5"><Label>Qisqacha nomi *</Label><Input value={form.shortName} onChange={(event) => set({ shortName: event.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label>Min</Label><Input type="number" value={form.minScore} onChange={(event) => set({ minScore: Number(event.target.value) })} /></div>
          <div className="space-y-1.5"><Label>Max</Label><Input type="number" value={form.maxScore} onChange={(event) => set({ maxScore: Number(event.target.value) })} /></div>
          <div className="space-y-1.5"><Label>O'tish</Label><Input type="number" value={form.passScore} onChange={(event) => set({ passScore: Number(event.target.value) })} /></div>
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2"><Label>Faol</Label><Switch checked={form.active} onCheckedChange={(active) => set({ active })} /></div>
      </div>}
    />
  </div>;
}

export function AcademicStatements({ finalStatement }: { finalStatement: boolean }) {
  const [year, setYear] = useState(ALL); const [subject, setSubject] = useState(ALL);
  const [semester, setSemester] = useState(ALL); const [group, setGroup] = useState(ALL);
  const query = useQuery({ queryKey: ["academic-statements", finalStatement], queryFn: () => listAcademicStatements(finalStatement), staleTime: 30_000 });
  const rows = query.data ?? [];
  const values = (selector: (row: AcademicStatementRow) => string) => [...new Set(rows.map(selector).filter(Boolean))].sort();
  const filtered = useMemo(() => rows.filter((row) =>
    (year === ALL || row.academicYear === year) && (subject === ALL || row.subject === subject)
    && (semester === ALL || String(row.semester ?? "") === semester) && (group === ALL || row.group === group)
  ), [rows, year, subject, semester, group]);
  const columns: ColumnDef<AcademicStatementRow>[] = [
    { accessorKey: "topic", header: "Mavzu" }, { accessorKey: "group", header: "Guruh" },
    { accessorKey: "academicYear", header: "O'quv yili" }, { id: "semester", header: "Semestr", cell: ({ row }) => row.original.semester ?? "—" },
    ...(finalStatement ? [] : [{ accessorKey: "controlType", header: "Nazorat turi" } as ColumnDef<AcademicStatementRow>]),
    { accessorKey: "statement", header: "Vedmost" }, { accessorKey: "addedDate", header: "Qo'shilgan sana" },
    { id: "results", header: "Natijalar", cell: ({ row }) => `${row.original.passedCount}/${row.original.resultCount}` },
    { id: "average", header: "O'rtacha", cell: ({ row }) => number(row.original.averageScore) },
    { id: "status", header: "Holati", cell: ({ row }) => <Badge variant={row.original.status === "COMPLETED" ? "default" : "secondary"}>{row.original.status}</Badge> },
  ];
  return <div className="space-y-6 p-3 sm:p-6">
    <Header title={finalStatement ? "Yakuniy vedmost" : "Vedmost"} description="Mavjud nazorat sessiyalari va ularning auditli natijalaridan hosil qilingan qaydnomalar." onExport={() => downloadCsv(finalStatement ? "yakuniy-vedmost.csv" : "vedmost.csv", ["Mavzu","Guruh","O'quv yili","Semestr","Nazorat","Vedmost","Sana","Natijalar","O'rtacha"], filtered.map((row) => [row.topic,row.group,row.academicYear,row.semester,row.controlType,row.statement,row.addedDate,`${row.passedCount}/${row.resultCount}`,row.averageScore]))} />
    <div className="flex flex-wrap gap-3 rounded-lg border p-4">
      <FilterSelect label="O'quv yili" value={year} values={values((row) => row.academicYear)} onChange={setYear} />
      <FilterSelect label="Fan" value={subject} values={values((row) => row.subject)} onChange={setSubject} />
      <FilterSelect label="Semestr" value={semester} values={values((row) => String(row.semester ?? ""))} onChange={setSemester} />
      <FilterSelect label="Guruh" value={group} values={values((row) => row.group)} onChange={setGroup} />
    </div>
    <QueryState loading={query.isLoading} error={query.error} retry={() => query.refetch()} />
    {!query.isLoading && !query.error && <DataTable columns={columns} data={filtered} searchPlaceholder="Mavzu yoki fan bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas" />}
  </div>;
}

type ResultMode = "debtors" | "monitoring" | "average" | "hemis";
const resultMeta: Record<ResultMode, { title: string; description: string }> = {
  debtors: { title: "Akademik qarzdorlar", description: "Nazorat natijasi 60 balldan past bo'lgan fan biriktirishlari." },
  monitoring: { title: "Reyting monitoringi", description: "Har bir talaba va fan kesimida oraliq, yakuniy va umumiy natija." },
  average: { title: "Talabalarning o'zlashtirish ko'rsatkichlari", description: "Talaba kesimida baholangan fanlar bo'yicha o'rtacha natija." },
  hemis: { title: "Baholarini HEMIS ga yuborish", description: "HEMIS bilan bog'langan talabalar va yuborishga tayyor hisoblangan baholar." },
};

interface AverageRow { studentId: number; fullName: string; studentNumber: string; group: string; program: string; academicYear: string; semester: number; average: number; subjects: number }

export function StudentAcademicResultsView({ mode }: { mode: ResultMode }) {
  const navigate = useNavigate();
  const [year, setYear] = useState(ALL); const [program, setProgram] = useState(ALL); const [semester, setSemester] = useState(ALL);
  const [group, setGroup] = useState(ALL); const [subject, setSubject] = useState(ALL);
  const query = useQuery({ queryKey: ["student-academic-results"], queryFn: listStudentAcademicResults, staleTime: 30_000 });
  const rows = query.data ?? [];
  const values = (selector: (row: StudentAcademicResult) => string) => [...new Set(rows.map(selector).filter(Boolean))].sort();
  const base = useMemo(() => rows.filter((row) =>
    (year === ALL || row.academicYear === year) && (program === ALL || row.program === program)
    && (semester === ALL || String(row.semester) === semester) && (group === ALL || row.group === group)
    && (subject === ALL || row.subject === subject)
  ), [rows, year, program, semester, group, subject]);
  const resultRows = mode === "debtors" ? base.filter((row) => row.assessed && !row.passed) : base;
  const averages = useMemo<AverageRow[]>(() => {
    const map = new Map<number, StudentAcademicResult[]>();
    base.filter((row) => row.assessed).forEach((row) => map.set(row.studentId, [...(map.get(row.studentId) ?? []), row]));
    return [...map.values()].map((studentRows) => { const first = studentRows[0]; return { studentId:first.studentId,fullName:first.fullName,studentNumber:first.studentNumber,group:first.group,program:first.program,academicYear:first.academicYear,semester:Math.max(...studentRows.map((row) => row.semester)),average:studentRows.reduce((sum,row)=>sum+(row.totalScore ?? 0),0)/studentRows.length,subjects:studentRows.length }; });
  }, [base]);
  const standardColumns: ColumnDef<StudentAcademicResult>[] = [
    { accessorKey: "fullName", header: "F.I.O." }, { accessorKey: "group", header: "Guruh" },
    { accessorKey: "academicYear", header: "O'quv yili" }, { accessorKey: "semester", header: "Semestr" },
    { accessorKey: "subject", header: "Fan" },
    { id: "interim", header: "Oraliq", cell: ({ row }) => number(row.original.interimScore) },
    { id: "final", header: "Yakuniy", cell: ({ row }) => number(row.original.finalScore) },
    { id: "total", header: "Jami ball", cell: ({ row }) => number(row.original.totalScore) },
    { id: "mark", header: "Baho", cell: ({ row }) => row.original.mark ?? "—" },
  ];
  const columns = mode === "debtors" ? standardColumns.slice(0, 5) : mode === "hemis" ? [...standardColumns, { id: "hemis", header: "HEMIS", cell: ({ row }: { row: { original: StudentAcademicResult } }) => <Badge variant={row.original.hemisStatus === "SYNCED" ? "default" : "secondary"}>{row.original.hemisStatus}</Badge> } as ColumnDef<StudentAcademicResult>] : standardColumns;
  const averageColumns: ColumnDef<AverageRow>[] = [
    { accessorKey: "fullName", header: "F.I.O." }, { accessorKey: "group", header: "Guruh" },
    { accessorKey: "program", header: "O'quv dasturi" }, { accessorKey: "semester", header: "Semestr" },
    { id: "average", header: "O'rtacha (%)", cell: ({ row }) => number(row.original.average) },
    { accessorKey: "subjects", header: "Baholangan fanlar" },
  ];
  const exportRows = mode === "average" ? averages.map((row) => [row.fullName,row.group,row.program,row.semester,row.average,row.subjects]) : resultRows.map((row) => [row.fullName,row.group,row.academicYear,row.semester,row.subject,row.interimScore,row.finalScore,row.totalScore,row.mark,row.hemisStatus]);
  return <div className="space-y-6 p-3 sm:p-6">
    <Header title={resultMeta[mode].title} description={resultMeta[mode].description} action={mode === "hemis" ? <Button onClick={() => navigate("/admin/integrations")}>HEMIS integratsiyasi</Button> : undefined} onExport={() => downloadCsv(`${mode}.csv`, mode === "average" ? ["F.I.O.","Guruh","Dastur","Semestr","O'rtacha","Fanlar"] : ["F.I.O.","Guruh","Yil","Semestr","Fan","Oraliq","Yakuniy","Jami","Baho","HEMIS"], exportRows)} />
    <div className="flex flex-wrap gap-3 rounded-lg border p-4">
      <FilterSelect label="O'quv yili" value={year} values={values((row) => row.academicYear)} onChange={setYear} />
      <FilterSelect label="O'quv dasturi" value={program} values={values((row) => row.program)} onChange={setProgram} />
      <FilterSelect label="Semestr" value={semester} values={values((row) => String(row.semester))} onChange={setSemester} />
      <FilterSelect label="Guruh" value={group} values={values((row) => row.group)} onChange={setGroup} />
      <FilterSelect label="Fan" value={subject} values={values((row) => row.subject)} onChange={setSubject} />
    </div>
    <QueryState loading={query.isLoading} error={query.error} retry={() => query.refetch()} />
    {!query.isLoading && !query.error && (mode === "average" ? <DataTable columns={averageColumns} data={averages} searchPlaceholder="F.I.O. bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas" /> : <DataTable columns={columns} data={resultRows} searchPlaceholder="F.I.O. yoki fan bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas" />)}
  </div>;
}

export function StudentGpaRegistry() {
  const query = useQuery({ queryKey: ["student-gpa"], queryFn: listStudentGpa, staleTime: 30_000 });
  const rows = query.data ?? [];
  const columns: ColumnDef<StudentGpaRow>[] = [
    { accessorKey: "fullName", header: "F.I.O." }, { accessorKey: "group", header: "Guruh" },
    { accessorKey: "semester", header: "Semestr" }, { accessorKey: "program", header: "Yo'nalishi" },
    { id: "gpa", header: "GPA", cell: ({ row }) => <Badge>{number(row.original.gpa)}</Badge> },
    { accessorKey: "totalCredits", header: "Kredit" }, { accessorKey: "assessedSubjects", header: "Fanlar" },
  ];
  return <div className="space-y-6 p-3 sm:p-6"><Header title="GPA ballari" description="Mavjud baholar va kreditlar asosida serverda hisoblangan GPA reyestri." onExport={() => downloadCsv("gpa.csv", ["F.I.O.","Guruh","Semestr","Yo'nalish","GPA","Kredit"], rows.map((row) => [row.fullName,row.group,row.semester,row.program,row.gpa,row.totalCredits]))} /><QueryState loading={query.isLoading} error={query.error} retry={() => query.refetch()} />{!query.isLoading && !query.error && <DataTable columns={columns} data={rows} searchPlaceholder="Familiya, ism bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas" />}</div>;
}

export function AcademicTestResults() {
  const [year, setYear] = useState(ALL); const [semester, setSemester] = useState(ALL); const [subject, setSubject] = useState(ALL); const [group, setGroup] = useState(ALL);
  const query = useQuery({ queryKey: ["academic-test-results"], queryFn: listAcademicTestResults, staleTime: 30_000 });
  const rows = query.data ?? [];
  const values = (selector: (row: TestResultRow) => string) => [...new Set(rows.map(selector).filter(Boolean))].sort();
  const filtered = rows.filter((row) => (year===ALL||row.academicYear===year)&&(semester===ALL||String(row.semester)===semester)&&(subject===ALL||row.subject===subject)&&(group===ALL||row.group===group));
  const columns: ColumnDef<TestResultRow>[] = [
    { accessorKey: "fullName", header: "F.I.O." }, { accessorKey: "subject", header: "Fan" },
    { accessorKey: "methodology", header: "Fan metodologiyasi" }, { accessorKey: "totalQuestions", header: "Umumiy testlar" },
    { accessorKey: "correct", header: "To'g'ri" }, { accessorKey: "incorrect", header: "Noto'g'ri" },
    { accessorKey: "attempts", header: "Urinishlar" }, { accessorKey: "mark", header: "Baho" },
    { id: "date", header: "Test sanasi", cell: ({ row }) => date(row.original.testDate) },
    { id: "status", header: "Holati", cell: ({ row }) => <Badge variant={row.original.passed ? "default" : "destructive"}>{row.original.passed ? "O'tdi" : "O'tmadi"}</Badge> },
  ];
  return <div className="space-y-6 p-3 sm:p-6"><Header title="Test natijalari" description="Yakunlangan test urinishlari, to'g'ri/noto'g'ri javob va baholar." onExport={() => downloadCsv("test-results.csv", ["F.I.O.","Fan","Test","Jami","To'g'ri","Noto'g'ri","Urinish","Baho","Sana"], filtered.map((row) => [row.fullName,row.subject,row.methodology,row.totalQuestions,row.correct,row.incorrect,row.attempts,row.mark,row.testDate]))} /><div className="flex flex-wrap gap-3 rounded-lg border p-4"><FilterSelect label="O'quv yili" value={year} values={values((row)=>row.academicYear)} onChange={setYear}/><FilterSelect label="Semestr" value={semester} values={values((row)=>String(row.semester))} onChange={setSemester}/><FilterSelect label="Guruh" value={group} values={values((row)=>row.group)} onChange={setGroup}/><FilterSelect label="Fan" value={subject} values={values((row)=>row.subject)} onChange={setSubject}/></div><QueryState loading={query.isLoading} error={query.error} retry={() => query.refetch()} />{!query.isLoading&&!query.error&&<DataTable columns={columns} data={filtered} searchPlaceholder="F.I.O. bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas" />}</div>;
}
