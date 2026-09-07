import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { fetchTranscript } from '@/services/api/grade-api';
import { downloadStudentDocument, fetchStudentReport, type StudentReportFilters } from '@/services/api/student-report-api';

function ExportButtons({ document, filters, disabled }: { document: 'transcript' | 'reports'; filters?: StudentReportFilters; disabled?: boolean }) {
  const [pending, setPending] = useState<string>();
  const { toast } = useToast();
  async function download(format: 'PDF' | 'XLSX') {
    setPending(format);
    try { await downloadStudentDocument(document, format, filters); toast({ title: 'Fayl yuklab olindi' }); }
    catch { toast({ title: "Faylni yuklab bo'lmadi", description: "Qayta urinib ko'ring.", variant: 'destructive' }); }
    finally { setPending(undefined); }
  }
  return <div className="flex gap-2">{(['PDF', 'XLSX'] as const).map(format => <Button key={format} variant="outline" disabled={disabled || !!pending} onClick={() => void download(format)} className="gap-2">
    {pending === format ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{format === 'XLSX' ? 'Excel' : 'PDF'}
  </Button>)}</div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <Card><CardHeader className="pb-4"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>;
}
function Failure({ retry }: { retry: () => void }) {
  return <div role="alert" className="rounded-lg border p-6 space-y-3"><p>Ma'lumotni yuklab bo'lmadi.</p><Button variant="outline" onClick={retry}>Qayta urinish</Button></div>;
}
const tableClass = 'w-full text-sm text-left [&_th]:p-3 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:p-3 [&_tr]:border-b';

export function StudentTranscript() {
  const query = useQuery({ queryKey: ['grades', 'transcript'], queryFn: fetchTranscript });
  const data = query.data;
  return <div className="p-3 sm:p-6 space-y-6">
    <div className="flex flex-wrap justify-between items-start gap-3"><div><h1 className="text-2xl font-bold">Transkript</h1><p className="text-muted-foreground">Fanlar, semestr natijalari va kreditlar · {data?.studentName}</p></div><ExportButtons document="transcript" disabled={!data || query.isError} /></div>
    <div className="flex gap-4 text-sm"><Link className="text-primary underline" to="/student/grades">Barcha baholar</Link><Link className="text-primary underline" to="/student/reports">O'qish hisoboti</Link></div>
    {query.isLoading ? <p role="status">Transkript yuklanmoqda...</p> : query.isError || !data ? <Failure retry={() => void query.refetch()} /> : <>
      <div className="grid sm:grid-cols-3 gap-3"><Metric label="Umumiy GPA" value={data.assessedCredits ? data.cumulativeGPA.toFixed(2) : '—'} /><Metric label="Biriktirilgan kredit" value={data.totalCredits} /><Metric label="O'zlashtirilgan kredit" value={data.completedCredits ?? 0} /></div>
      <p className="text-sm text-muted-foreground">GPA testlar o'rtachasi va e'lon qilingan yakuniy nazorat natijasidan, kreditga vaznlab hisoblanadi. Topshiriq baholari GPAga kirmaydi. Baholanmagan fan GPAga qo'shilmaydi; kamida 60 ball olgan fan krediti o'zlashtirilgan hisoblanadi.</p>
      {data.semesters.length === 0 && <Card><CardContent className="py-8 text-center">Hozircha sizga fan biriktirilmagan.</CardContent></Card>}
      {data.semesters.map(term => <Card key={`${term.academicYear}-${term.semester}`}><CardHeader><CardTitle className="text-lg">{term.academicYear || "O'quv yili belgilanmagan"} · {term.semester}-semestr</CardTitle><CardDescription>GPA: {term.assessedCredits ? term.semesterGPA.toFixed(2) : '—'} · O'zlashtirilgan: {term.creditsEarned} kredit</CardDescription></CardHeader><CardContent className="overflow-x-auto">
        <table className={tableClass}><thead><tr><th>Fan / kurs</th><th>O'qituvchi</th><th>Kredit</th><th>Ball / 100</th><th>Baho</th></tr></thead><tbody>{term.courses.map(course => <tr key={course.courseId}>
          <td><Link to={`/student/courses/${course.courseId}/learn`} className="text-primary hover:underline">{course.courseName}</Link></td><td>{course.instructor || '—'}</td><td>{course.credits}</td><td>{course.score ?? '—'}</td><td>{course.score == null ? <span className="text-muted-foreground">Baholanmagan</span> : course.gradeLetter}</td>
        </tr>)}</tbody></table>
      </CardContent></Card>)}
    </>}
  </div>;
}

function initialDates(): StudentReportFilters {
  const now = new Date();
  const local = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { from: local(new Date(now.getFullYear(), now.getMonth() - 5, 1)), to: local(now) };
}
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
export function StudentReports() {
  const [draft, setDraft] = useState<StudentReportFilters>(initialDates);
  const [filters, setFilters] = useState(draft);
  const query = useQuery({ queryKey: ['student', 'reports', filters], queryFn: () => fetchStudentReport(filters) });
  const transcript = useQuery({ queryKey: ['grades', 'transcript'], queryFn: fetchTranscript });
  const courses = transcript.data?.semesters.flatMap(term => term.courses) ?? [];
  const data = query.data;
  const invalid = !draft.from || !draft.to || draft.from > draft.to || (Date.parse(draft.to) - Date.parse(draft.from)) / 86400000 > 731;
  return <div className="p-3 sm:p-6 space-y-6">
    <div className="flex flex-wrap justify-between items-start gap-3"><div><h1 className="text-2xl font-bold">O'qish hisoboti</h1><p className="text-muted-foreground">Baholar, davomat va kurslarning bajarilishi</p></div><ExportButtons document="reports" filters={filters} disabled={!data || query.isError || query.isFetching} /></div>
    <form className="flex flex-wrap items-end gap-3 rounded-lg border p-4" onSubmit={e => { e.preventDefault(); if (!invalid) setFilters({ ...draft }); }}>
      <label className="space-y-1 text-sm">Boshlanish sanasi<Input type="date" aria-label="Boshlanish sanasi" value={draft.from} onChange={e => setDraft({ ...draft, from: e.target.value })} /></label>
      <label className="space-y-1 text-sm">Tugash sanasi<Input type="date" aria-label="Tugash sanasi" value={draft.to} onChange={e => setDraft({ ...draft, to: e.target.value })} /></label>
      <label className="space-y-1 text-sm">Kurs<select aria-label="Kurs" className="block h-10 max-w-full rounded-md border bg-background px-3" value={draft.courseId ?? ''} onChange={e => setDraft({ ...draft, courseId: e.target.value || undefined })}><option value="">Barcha kurslar</option>{courses.map(course => <option key={course.courseId} value={course.courseId}>{course.courseName}</option>)}</select></label>
      <Button type="submit" disabled={invalid || query.isFetching}>{query.isFetching ? 'Yuklanmoqda...' : "Qo'llash"}</Button>
      {invalid && <p role="alert" className="w-full text-sm text-destructive">Sana oralig'ini to'g'ri tanlang (ko'pi bilan 2 yil).</p>}
      {transcript.isError && <p className="w-full text-sm text-destructive">Kurslar ro'yxati yuklanmadi. <button type="button" className="underline" onClick={() => void transcript.refetch()}>Qayta urinish</button></p>}
    </form>
    {query.isLoading ? <p role="status">Hisobot yuklanmoqda...</p> : query.isError || !data ? <Failure retry={() => void query.refetch()} /> : <>
      <p className="text-sm text-muted-foreground">Hisobot davri: {data.from} — {data.to}. Baholar va davomat shu davrga tegishli. Kredit, GPA va kurs bajarilishi tanlangan kurslarning joriy umumiy holatini ko'rsatadi.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"><Metric label="Davrdagi o'rtacha ball" value={data.gradeCount ? `${data.stats.avgScore.toFixed(1)} / 100` : '—'} /><Metric label="Baholar soni" value={data.gradeCount} /><Metric label="Joriy GPA" value={data.assessedCredits ? data.stats.gpa.toFixed(2) : '—'} /><Metric label="O'zlashtirilgan / jami kredit" value={`${data.stats.completedCredits} / ${data.stats.totalCredits}`} /></div>
      <Card><CardHeader><CardTitle className="text-lg">Oylar bo'yicha</CardTitle><CardDescription>Ma'lumot yo'q bo'lsa — belgisi ko'rsatiladi. Davomat: qatnashgan va kechikkan darslar ulushi.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className={tableClass}><thead><tr><th>Oy</th><th>O'rtacha ball</th><th>Baholar</th><th>Davomat</th><th>Darslar</th><th>Yakunlangan kurslar</th></tr></thead><tbody>{data.monthly.map(month => <tr key={month.month}><td>{monthNames[Number(month.month.slice(5, 7)) - 1]} {month.month.slice(0, 4)}</td><td>{month.gradeCount ? month.avgScore.toFixed(1) : '—'}</td><td>{month.gradeCount}</td><td>{month.attendanceCount ? `${month.attendance}%` : '—'}</td><td>{month.attendanceCount}</td><td>{month.completedCourses}</td></tr>)}</tbody></table></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-lg">Kurslar</CardTitle><CardDescription>{data.stats.coursesActive} faol · {data.stats.coursesCompleted} yakunlangan</CardDescription></CardHeader><CardContent className="space-y-5">{data.courses.length === 0 && <p>Tanlangan filtr bo'yicha kurs topilmadi.</p>}{data.courses.map(course => <div key={course.courseId} className="space-y-2"><div className="flex flex-wrap justify-between gap-2"><Link className="text-primary hover:underline" to={`/student/courses/${course.courseId}/learn`}>{course.courseTitle}</Link><span className="text-sm">{course.completion}% · O'rtacha: {course.gradeCount ? course.avgScore.toFixed(1) : '—'} ({course.gradeCount} baho)</span></div><Progress value={course.completion} /></div>)}</CardContent></Card>
      <Link className="inline-block text-sm text-primary underline" to="/student/transcript">Transkriptni ochish</Link>
    </>}
  </div>;
}
