import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, RefreshCw, Users, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAcademicDashboard,
  listFailedStudentSummary,
  listGradeDistribution,
  listProgramAppropriation,
  listStudentTaskReports,
  listSubjectReports,
  type FailedStudentSummaryRow,
  type ProgramAppropriationRow,
  type StudentTaskReportRow,
  type SubjectGradeDistributionRow,
  type SubjectReportRow,
} from "@/services/api/academic-results-api";

const ALL = "__all__";
const num = (value: number) => value.toLocaleString("uz-Latn", { maximumFractionDigits: 2 });
const date = (value?: string | null) => value ? new Date(value).toLocaleString("uz-Latn") : "—";

function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
}

function Header({ title, description, onExport }: { title: string; description: string; onExport?: () => void }) {
  return <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>{onExport && <Button variant="outline" onClick={onExport}><Download className="mr-2 h-4 w-4" />Excel uchun CSV</Button>}</div>;
}

function State({ loading, error, retry }: { loading: boolean; error: unknown; retry: () => void }) {
  if (loading) return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Yuklanmoqda...</CardContent></Card>;
  if (error) return <Card className="border-destructive"><CardContent className="space-y-3 p-10 text-center"><p className="text-sm text-destructive">{error instanceof Error ? error.message : "Ma'lumot yuklanmadi"}</p><Button variant="outline" onClick={retry}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button></CardContent></Card>;
  return null;
}

function Filter({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <div className="min-w-40 space-y-1"><Label className="text-xs">{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>Barchasi</SelectItem>{values.filter(Boolean).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>;
}

export function AcademicStatisticsDashboard() {
  const query = useQuery({ queryKey: ["academic-statistics-dashboard"], queryFn: getAcademicDashboard, staleTime: 30_000 });
  const data = query.data;
  return <div className="space-y-6 p-3 sm:p-6">
    <Header title="Statistika dashbordi" description="Talabalar va o'qituvchilar kontingenti real ma'lumotlar asosida." />
    <State loading={query.isLoading} error={query.error} retry={() => query.refetch()} />
    {data && <>
      <div className="grid gap-4 sm:grid-cols-2"><Card><CardHeader className="pb-2"><CardDescription className="flex items-center justify-between">Talabalar<Users className="h-4 w-4" /></CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{num(data.totalStudents)}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardDescription className="flex items-center justify-between">O'qituvchilar<UserCog className="h-4 w-4" /></CardDescription></CardHeader><CardContent><p className="text-3xl font-bold">{num(data.totalTeachers)}</p></CardContent></Card></div>
      <div className="grid gap-4 lg:grid-cols-2">{data.students.map((row) => <Card key={row.degree}><CardHeader><CardTitle>{row.degree === "BACHELOR" ? "Bakalavr" : "Magistr"}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-3"><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Erkak</p><p className="text-2xl font-bold">{row.male}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Ayol</p><p className="text-2xl font-bold">{row.female}</p></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Jami</p><p className="text-2xl font-bold">{row.total}</p></div></div><div className="flex flex-wrap gap-2">{Object.entries(row.byCourse).map(([course,count]) => <Badge key={course} variant="outline">{course}-kurs: {count}</Badge>)}</div></CardContent></Card>)}</div>
      <Card><CardHeader><CardTitle>O'quv yillari</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{data.activeAcademicYears.map((year) => <Badge key={year}>{year}</Badge>)}{data.activeAcademicYears.length === 0 && <span className="text-sm text-muted-foreground">Ma'lumot mavjud emas</span>}</CardContent></Card>
    </>}
  </div>;
}

export function AppropriationStatistics() {
  const query = useQuery({ queryKey: ["program-appropriation"], queryFn: listProgramAppropriation, staleTime: 30_000 });
  const rows = query.data ?? [];
  const columns: ColumnDef<ProgramAppropriationRow>[] = [
    { accessorKey: "program", header: "Yo'nalish nomi" }, { accessorKey: "studentCount", header: "Talaba soni" },
    { id: "average", header: "O'zlashtirish (%)", cell: ({ row }) => num(row.original.averageScore) },
    { id: "five", header: "5 (soni/foiz)", cell: ({ row }) => `${row.original.mark5Count} / ${num(row.original.mark5Percent)}%` },
    { id: "four", header: "4 (soni/foiz)", cell: ({ row }) => `${row.original.mark4Count} / ${num(row.original.mark4Percent)}%` },
    { id: "three", header: "3 (soni/foiz)", cell: ({ row }) => `${row.original.mark3Count} / ${num(row.original.mark3Percent)}%` },
    { id: "two", header: "2 (soni/foiz)", cell: ({ row }) => `${row.original.mark2Count} / ${num(row.original.mark2Percent)}%` },
  ];
  return <div className="space-y-6 p-3 sm:p-6"><Header title="O'zlashtirish statistikasi" description="Yo'nalish bo'yicha talabalar va 2/3/4/5 baholar taqsimoti." onExport={() => downloadCsv("appropriation.csv", ["Yo'nalish","Talabalar","O'rtacha","5","4","3","2"], rows.map((row)=>[row.program,row.studentCount,row.averageScore,row.mark5Count,row.mark4Count,row.mark3Count,row.mark2Count]))}/><State loading={query.isLoading} error={query.error} retry={() => query.refetch()}/>{!query.isLoading&&!query.error&&<DataTable columns={columns} data={rows} searchPlaceholder="Yo'nalish bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas"/>}</div>;
}

type SubjectMode = "content" | "tests" | "semester";

export function SubjectStatisticsReport({ mode }: { mode: SubjectMode }) {
  const [year,setYear]=useState(ALL); const [program,setProgram]=useState(ALL); const [semester,setSemester]=useState(ALL);
  const query=useQuery({queryKey:["subject-statistics"],queryFn:listSubjectReports,staleTime:30_000}); const rows=query.data??[];
  const values=(selector:(row:SubjectReportRow)=>string[])=>[...new Set(rows.flatMap(selector).filter(Boolean))].sort();
  const filtered=rows.filter((row)=>(year===ALL||row.academicYears.includes(year))&&(program===ALL||row.program===program)&&(semester===ALL||row.semesters.includes(Number(semester))));
  const title=mode==="content"?"Fan ma'lumotlari":mode==="tests"?"Fandagi test ma'lumotlari":"Semestr fanlari hisoboti";
  const description=mode==="content"?"Fan kontenti, o'qituvchi, guruh va tekshiruv holati.":mode==="tests"?"Har bir fan bo'yicha yaratilgan testlar soni.":"Semestr kesimida modul, resurs, topshiriq, video va testlar.";
  const contentColumns:ColumnDef<SubjectReportRow>[]=[
    {id:"year",header:"O'quv yili",cell:({row})=>row.original.academicYears.join(", ")||"—"},{accessorKey:"program",header:"O'quv dasturi nomi"},{id:"semester",header:"Semestr",cell:({row})=>row.original.semesters.join(", ")||"—"},{accessorKey:"subject",header:"Fan nomi"},{accessorKey:"contentName",header:"Fan kontenti nomi"},{accessorKey:"teacher",header:"O'qituvchi F.I.O"},{id:"groups",header:"Biriktirilgan guruhlar",cell:({row})=>row.original.groups.join(", ")||"—"},{accessorKey:"totalContent",header:"Umumiy"},{id:"checks",header:"Tekshirilgan / tekshirilmagan",cell:({row})=>`${row.original.approvedContent} / ${row.original.uncheckedContent}`},
  ];
  const testColumns:ColumnDef<SubjectReportRow>[]=[{accessorKey:"subject",header:"Fan nomi"},{accessorKey:"tests",header:"Testlar soni"},{accessorKey:"teacher",header:"O'qituvchi"},{accessorKey:"studentCount",header:"Talabalar"}];
  const semesterColumns:ColumnDef<SubjectReportRow>[]=[{accessorKey:"program",header:"O'quv dasturining nomi"},{id:"semester",header:"Semestr",cell:({row})=>row.original.semesters.join(", ")||"—"},{accessorKey:"subject",header:"Fan"},{accessorKey:"modules",header:"Modullar soni"},{accessorKey:"resources",header:"Resurslar soni"},{accessorKey:"assignments",header:"Topshiriqlar soni"},{accessorKey:"videos",header:"Videolar soni"},{accessorKey:"tests",header:"Testlar soni"}];
  const columns=mode==="content"?contentColumns:mode==="tests"?testColumns:semesterColumns;
  return <div className="space-y-6 p-3 sm:p-6"><Header title={title} description={description} onExport={()=>downloadCsv(`${mode}-subjects.csv`,["Yil","Dastur","Semestr","Fan","Kontent","O'qituvchi","Guruh","Modul","Resurs","Topshiriq","Video","Test"],filtered.map((row)=>[row.academicYears.join(";"),row.program,row.semesters.join(";"),row.subject,row.contentName,row.teacher,row.groups.join(";"),row.modules,row.resources,row.assignments,row.videos,row.tests]))}/>{mode!=="tests"&&<div className="flex flex-wrap gap-3 rounded-lg border p-4"><Filter label="O'quv yili" value={year} values={values((row)=>row.academicYears)} onChange={setYear}/><Filter label="O'quv dasturi" value={program} values={values((row)=>[row.program])} onChange={setProgram}/><Filter label="Semestr" value={semester} values={values((row)=>row.semesters.map(String))} onChange={setSemester}/></div>}<State loading={query.isLoading} error={query.error} retry={()=>query.refetch()}/>{!query.isLoading&&!query.error&&<DataTable columns={columns} data={filtered} searchPlaceholder="Fan nomi bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas"/>}</div>;
}

export function StudentTaskStatisticsReport() {
  const [year,setYear]=useState(ALL); const [semester,setSemester]=useState(ALL); const [status,setStatus]=useState(ALL);
  const query=useQuery({queryKey:["student-task-statistics"],queryFn:listStudentTaskReports,staleTime:30_000}); const rows=query.data??[];
  const vals=(selector:(row:StudentTaskReportRow)=>string)=>[...new Set(rows.map(selector).filter(Boolean))].sort();
  const filtered=rows.filter((row)=>(year===ALL||row.academicYear===year)&&(semester===ALL||String(row.semester)===semester)&&(status===ALL||row.status===status));
  const columns:ColumnDef<StudentTaskReportRow>[]=[{id:"status",header:"Holati",cell:({row})=><Badge variant={row.original.status==="Tekshirilgan"?"default":"secondary"}>{row.original.status}</Badge>},{accessorKey:"academicYear",header:"O'quv yili"},{id:"semester",header:"Semestr & Qaydnoma",cell:({row})=>`${row.original.semester}-semestr / ${row.original.statement}`},{accessorKey:"subject",header:"Fan nomi"},{id:"student",header:"Talaba F.I.O",cell:({row})=><div><p>{row.original.student}</p><p className="text-xs text-muted-foreground">{row.original.group} · {row.original.assignment}</p></div>},{id:"submitted",header:"Kiritilgan sana",cell:({row})=>date(row.original.submittedAt)},{id:"graded",header:"Tekshirish sanasi",cell:({row})=>date(row.original.gradedAt)},{accessorKey:"turnaroundDays",header:"Sana farqi"}];
  return <div className="space-y-6 p-3 sm:p-6"><Header title={`Talabalarning yuklagan amaliy ishlari (${filtered.length})`} description="Topshiriq yuborish, tekshirish holati va tekshirishgacha o'tgan kunlar." onExport={()=>downloadCsv("student-tasks.csv",["Holat","Yil","Semestr","Fan","Topshiriq","Talaba","Guruh","Yuborilgan","Tekshirilgan","Kun"],filtered.map((row)=>[row.status,row.academicYear,row.semester,row.subject,row.assignment,row.student,row.group,row.submittedAt,row.gradedAt,row.turnaroundDays]))}/><div className="flex flex-wrap gap-3 rounded-lg border p-4"><Filter label="O'quv yili" value={year} values={vals((row)=>row.academicYear)} onChange={setYear}/><Filter label="Semestr" value={semester} values={vals((row)=>String(row.semester))} onChange={setSemester}/><Filter label="Holati" value={status} values={vals((row)=>row.status)} onChange={setStatus}/></div><State loading={query.isLoading} error={query.error} retry={()=>query.refetch()}/>{!query.isLoading&&!query.error&&<DataTable columns={columns} data={filtered} searchPlaceholder="Talaba yoki fan bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas"/>}</div>;
}

export function GradeDistributionReport() {
  const query=useQuery({queryKey:["grade-distribution"],queryFn:listGradeDistribution,staleTime:30_000}); const rows=query.data??[];
  const columns:ColumnDef<SubjectGradeDistributionRow>[]=[{id:"subject",header:"Kafedra & Fan nomi",cell:({row})=><div><p className="font-medium">{row.original.subject}</p><p className="text-xs text-muted-foreground">{row.original.program}</p></div>},{accessorKey:"semester",header:"Semestr"},{accessorKey:"mark2",header:"2 baholar"},{accessorKey:"mark3",header:"3 baholar"},{accessorKey:"mark4",header:"4 baholar"},{accessorKey:"mark5",header:"5 baholar"},{accessorKey:"students",header:"Talabalar soni"},{id:"average",header:"O'rtacha",cell:({row})=>num(row.original.averageScore)}];
  return <div className="space-y-6 p-3 sm:p-6"><Header title="Fan bo'yicha qo'yilgan baho ma'lumotlari" description="Fan va semestr bo'yicha 2/3/4/5 baholar taqsimoti." onExport={()=>downloadCsv("grade-distribution.csv",["Fan","Dastur","Semestr","2","3","4","5","Talabalar","O'rtacha"],rows.map((row)=>[row.subject,row.program,row.semester,row.mark2,row.mark3,row.mark4,row.mark5,row.students,row.averageScore]))}/><State loading={query.isLoading} error={query.error} retry={()=>query.refetch()}/>{!query.isLoading&&!query.error&&<DataTable columns={columns} data={rows} searchPlaceholder="Fan bo'yicha qidirish..." emptyText="Ma'lumot mavjud emas"/>}</div>;
}

export function FailedStudentsStatistics() {
  const query=useQuery({queryKey:["failed-student-summary"],queryFn:listFailedStudentSummary,staleTime:30_000}); const rows=query.data??[];
  const columns:ColumnDef<FailedStudentSummaryRow>[]=[{id:"course",header:"Kurs",cell:({row})=>`${row.original.courseNumber}-kurs`},{accessorKey:"semester",header:"Semestr"},{accessorKey:"students",header:"Qarzdor talabalar"},{accessorKey:"failedEnrollments",header:"Qarzdor fanlar"}];
  return <div className="space-y-6 p-3 sm:p-6"><Header title="Akademik qarzdor talabalar" description="Kurs va semestr kesimida o'ta olmagan talabalar va fanlar soni." onExport={()=>downloadCsv("failed-students.csv",["Kurs","Semestr","Talabalar","Fanlar"],rows.map((row)=>[row.courseNumber,row.semester,row.students,row.failedEnrollments]))}/><State loading={query.isLoading} error={query.error} retry={()=>query.refetch()}/>{!query.isLoading&&!query.error&&<DataTable columns={columns} data={rows} emptyText="Ma'lumot mavjud emas"/>}</div>;
}
