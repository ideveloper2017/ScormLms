import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, BarChart3, BookOpen, CheckCircle2, Download, GraduationCap, RefreshCw, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { downloadInstitutionReport, getContentCompletenessReport, getInstitutionReport, type ReportExportFormat } from "@/services/api/reports-api";

const today = new Date().toISOString().slice(0, 10);
const sixMonthsAgo = (() => { const value = new Date(); value.setMonth(value.getMonth() - 6); value.setDate(1); return value.toISOString().slice(0, 10); })();
const defaultAcademicYear = (() => { const value = new Date(); const first = value.getMonth() >= 8 ? value.getFullYear() : value.getFullYear() - 1; return `${first}-${first + 1}`; })();
const metricIcons: Record<string, typeof Users> = { STUDENTS: Users, COURSES: BookOpen, COMPLETION_RATE: GraduationCap, AVERAGE_SCORE: BarChart3, ATTENDANCE_RATE: Activity };

export function Reports() {
  const { toast } = useToast();
  const [from, setFrom] = useState(sixMonthsAgo);
  const [to, setTo] = useState(today);
  const [applied, setApplied] = useState({ from: sixMonthsAgo, to: today });
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [appliedAcademicYear, setAppliedAcademicYear] = useState(defaultAcademicYear);
  const [exporting, setExporting] = useState<ReportExportFormat | null>(null);
  const report = useQuery({ queryKey: ["reports", "institution", applied], queryFn: () => getInstitutionReport(applied.from, applied.to), staleTime: 60_000 });
  const completeness = useQuery({
    queryKey: ["reports", "content-completeness", appliedAcademicYear],
    queryFn: () => getContentCompletenessReport(appliedAcademicYear),
    staleTime: 60_000,
  });
  const exportFile = async (format: ReportExportFormat) => {
    try { setExporting(format); await downloadInstitutionReport(applied.from, applied.to, format); toast({ title: `${format} hisobot yuklandi` }); }
    catch (error) { toast({ variant: "destructive", title: "Eksport bajarilmadi", description: (error as Error).message }); }
    finally { setExporting(null); }
  };
  if (report.isLoading) return <div className="space-y-5 p-6"><Skeleton className="h-10 w-60" /><div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map((item) => <Skeleton key={item} className="h-28" />)}</div><Skeleton className="h-80" /></div>;
  if (report.error || !report.data) return <div className="p-6"><Card className="border-destructive"><CardContent className="space-y-3 p-8 text-center"><p className="text-destructive">{(report.error as Error)?.message ?? "Hisobot yuklanmadi"}</p><Button variant="outline" onClick={() => report.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button></CardContent></Card></div>;
  const data = report.data;
  const important = ["STUDENTS", "COURSES", "COMPLETION_RATE", "AVERAGE_SCORE", "ATTENDANCE_RATE", "ACTIVITY_EVENTS"];
  return <div className="space-y-6 p-3 sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><h1 className="text-2xl font-bold">Tashkilot hisobotlari</h1><p className="text-sm text-muted-foreground">Kontingent, o'zlashtirish, kontent va haqiqiy o'quv faolligi.</p><Badge variant="outline" className="mt-2">{data.scope === "INSTITUTION" ? "Tashkilot kesimi" : "Faqat mening kurslarim"}</Badge></div><div className="flex flex-wrap items-end gap-2"><div><Label className="text-xs">Dan</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div><div><Label className="text-xs">Gacha</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div><Button variant="outline" disabled={!from || !to || from > to} onClick={() => setApplied({ from, to })}>Qo'llash</Button><Button variant="outline" disabled={exporting != null} onClick={() => exportFile("CSV")}><Download className="mr-1 h-4 w-4" />CSV</Button><Button disabled={exporting != null} onClick={() => exportFile("XLSX")}><Download className="mr-1 h-4 w-4" />XLSX</Button></div></div>
    <p className="text-xs text-muted-foreground">Hisoblangan: {new Date(data.generatedAt).toLocaleString("uz-Latn")} · davr {data.from} — {data.to}</p>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{data.metrics.filter((metric) => important.includes(metric.code)).map((metric) => { const Icon = metricIcons[metric.code] ?? BarChart3; return <Card key={metric.code}><CardHeader className="pb-2"><CardDescription className="flex items-center justify-between">{metric.label}<Icon className="h-4 w-4" /></CardDescription></CardHeader><CardContent><div className="text-2xl font-bold">{metric.value.toLocaleString("uz-Latn", { maximumFractionDigits: 2 })}<span className="ml-1 text-xs font-normal text-muted-foreground">{metric.unit}</span></div></CardContent></Card>; })}</div>
    <Card>
      <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><CardTitle>Yillik kontent to'liqligi</CardTitle><CardDescription className="mt-1">Har bir kursning nashr, kontent, nazorat va sinxron/asinxron mashg'ulot mezonlari.</CardDescription></div>
        <div className="flex items-end gap-2"><div><Label className="text-xs">O'quv yili</Label><Input className="w-36" placeholder="2026-2027" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} /></div><Button variant="outline" disabled={!/^\d{4}-\d{4}$/.test(academicYear)} onClick={() => setAppliedAcademicYear(academicYear)}>Ko'rsatish</Button></div>
      </CardHeader>
      <CardContent className="space-y-5">
        {completeness.isLoading ? <Skeleton className="h-52 w-full" /> : completeness.error || !completeness.data ? <div className="rounded-md border border-destructive/40 p-6 text-center"><p className="text-sm text-destructive">{(completeness.error as Error)?.message ?? "Kontent to'liqligi yuklanmadi"}</p><Button className="mt-3" variant="outline" onClick={() => completeness.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button></div> : <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Jami kurs</p><p className="text-2xl font-bold">{completeness.data.totalCourses}</p></div>
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">To'liq kurs</p><p className="text-2xl font-bold text-emerald-600">{completeness.data.completeCourses}</p></div>
            <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">O'rtacha to'liqlik</p><p className="text-2xl font-bold">{completeness.data.averageCompleteness}%</p></div>
          </div>
          <p className="text-xs text-muted-foreground">{completeness.data.academicYear} · qamrov {completeness.data.coverageFrom} — {completeness.data.coverageTo} · {completeness.data.scope === "INSTITUTION" ? "tashkilot" : "mening kurslarim"} kesimi. READY SCORM soni ma'lumot sifatida ko'rsatiladi.</p>
          {completeness.data.courses.length === 0 ? <p className="py-8 text-center text-muted-foreground">Hisobot uchun kurs topilmadi.</p> : <div className="space-y-3">{completeness.data.courses.map((course) => <div key={course.courseId} className="rounded-lg border p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{course.courseTitle}</p><Badge variant={course.complete ? "default" : "destructive"}>{course.complete ? <><CheckCircle2 className="mr-1 h-3 w-3" />To'liq</> : <><AlertTriangle className="mr-1 h-3 w-3" />{course.gaps.length} kamchilik</>}</Badge></div><p className="text-xs text-muted-foreground">{course.ownerName || "Mas'ul ko'rsatilmagan"} · {course.courseStatus}</p></div><div className="text-left lg:text-right"><p className="text-2xl font-bold">{course.completenessPercentage}%</p><div className="mt-1 h-2 w-40 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${course.completenessPercentage}%` }} /></div></div></div>
            <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4"><span>Enrollment: <b>{course.academicYearEnrollmentCount}</b></span><span>Modul: <b>{course.publishedModules}/{course.totalModules}</b></span><span>Yillik kontent: <b>{course.annualCoverageContents}</b></span><span>Topshiriq / test: <b>{course.publishedAssignments}/{course.publishedQuizzes}</b></span><span>Sinxron / asinxron: <b>{course.synchronousSessions}/{course.asynchronousSessions}</b></span><span>Kontent jami: <b>{course.totalContents}</b></span><span>Tasdiqlangan: <b>{course.approvedPublishedContents}</b></span><span>SCORM READY: <b>{course.readyScormPackages}</b></span></div>
            {course.gaps.length > 0 && <div className="mt-4 grid gap-2 md:grid-cols-2">{course.gaps.map((gap) => <div key={gap.code} className="rounded-md bg-amber-50 p-3 text-xs text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><p className="font-medium">{gap.label}</p>{gap.details.length > 0 && <p className="mt-1 opacity-80">{gap.details.join(", ")}</p>}</div>)}</div>}
          </div>)}</div>}
        </>}
      </CardContent>
    </Card>
    <Card><CardHeader><CardTitle>Kurslar bo'yicha o'zlashtirish</CardTitle><CardDescription>Yakunlash, baho va davomat foizi</CardDescription></CardHeader><CardContent>{data.courses.length === 0 ? <p className="py-12 text-center text-muted-foreground">Tanlangan davrda kurs topilmadi.</p> : <ResponsiveContainer width="100%" height={320}><BarChart data={data.courses.slice(0, 15)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="courseTitle" tick={{ fontSize: 10 }} /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="completionRate" name="Yakunlash %" fill="#8b5cf6" /><Bar dataKey="averageScore" name="Ball %" fill="#3b82f6" /><Bar dataKey="attendanceRate" name="Davomat %" fill="#10b981" /></BarChart></ResponsiveContainer>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Kurslar kesimi</CardTitle><CardDescription>Eksportdagi real yozuvlarning ekrandagi ko'rinishi</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="p-2">Kurs</th><th>Mas'ul</th><th>Holat</th><th>Talaba</th><th>Yakunlash</th><th>Ball</th><th>Davomat</th><th>Kontent</th><th>SCORM</th><th>Faollik</th></tr></thead><tbody>{data.courses.map((row) => <tr key={row.courseId} className="border-b"><td className="p-2 font-medium">{row.courseTitle}</td><td>{row.ownerName || "—"}</td><td><Badge variant="outline">{row.status}</Badge></td><td>{row.enrolledStudents}</td><td>{row.completedStudents} · {row.completionRate}%</td><td>{row.averageScore}%</td><td>{row.attendanceRate}%</td><td>{row.contentCount}</td><td>{row.scormPackageCount}</td><td>{row.activityEventCount}</td></tr>)}</tbody></table></CardContent></Card>
  </div>;
}
