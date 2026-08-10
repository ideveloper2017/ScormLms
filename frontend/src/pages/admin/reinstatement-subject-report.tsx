import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listReinstatementSubjectReport } from '@/lib/student-api';
import type { CourseEnrollmentStatus } from '@/types/student.types';

const enrollmentLabel: Record<CourseEnrollmentStatus, string> = {
  ACTIVE: 'Faol',
  COMPLETED: 'Yakunlangan',
  WITHDRAWN: 'Bekor qilingan',
};

export function AdminReinstatementSubjectReport() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const report = useQuery({
    queryKey: ['students', 'reinstatements', 'subjects-report', debouncedSearch, academicYear, page],
    queryFn: () => listReinstatementSubjectReport({
      search: debouncedSearch || undefined,
      academicYear: academicYear.trim() || undefined,
      page,
      size: 20,
    }),
  });

  return <div className="space-y-6 p-3 sm:p-4 md:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><RotateCcw className="h-6 w-6" />Tiklangan talabalar fanlari</h1>
        <p className="text-sm text-muted-foreground">Har talabaning eng so'nggi qayta tiklash buyrug'i va joriy kurs/fan biriktirishlari.</p>
      </div>
      <Badge variant="outline">Faqat o'qish</Badge>
    </div>

    <Card><CardContent className="grid gap-4 pt-6 md:grid-cols-2">
      <div className="space-y-2"><Label htmlFor="reinstatement-search">Talaba</Label><Input id="reinstatement-search" value={search} placeholder="F.I.O. yoki talaba raqami" onChange={event => { setSearch(event.target.value); setPage(0); }} /></div>
      <div className="space-y-2"><Label htmlFor="reinstatement-year">O'quv yili</Label><Input id="reinstatement-year" value={academicYear} placeholder="2026-2027" maxLength={9} onChange={event => { setAcademicYear(event.target.value); setPage(0); }} /></div>
    </CardContent></Card>

    {report.isLoading && <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>}
    {report.isError && <Card><CardContent className="py-10 text-center text-destructive">Hisobotni olib bo'lmadi. O'quv yilini YYYY-YYYY formatida kiriting va qayta urinib ko'ring.</CardContent></Card>}
    {report.data?.items.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">Mos qayta tiklash yozuvi topilmadi.</CardContent></Card>}

    <div className="space-y-4">{report.data?.items.map(item => <Card key={item.reinstatementEventId}>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><CardTitle className="text-lg">{item.studentName}</CardTitle><p className="font-mono text-xs text-muted-foreground">{item.studentNumber}</p></div>
        <Badge>{item.studentStatus === 'ACTIVE' ? 'Faol' : item.studentStatus}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border p-3 text-sm md:grid-cols-3">
          <div><p className="text-xs text-muted-foreground">Tiklash buyrug'i</p><p className="font-medium">{item.orderNumber} / {item.orderDate}</p><p className="text-xs text-muted-foreground">Amal sanasi: {item.effectiveDate}</p></div>
          <div><p className="text-xs text-muted-foreground">Akademik joylashuv</p><p className="font-medium">{item.programName ?? 'Dastur ko\'rsatilmagan'}</p><p className="text-xs text-muted-foreground">{item.groupName ?? (item.groupId ? `Guruh #${item.groupId}` : 'Guruhsiz')} · {item.academicYear ?? 'Yil yo\'q'} · {item.semesterNumber ?? '—'}-semestr</p></div>
          <div><p className="text-xs text-muted-foreground">Asos</p><p>{item.reason}</p></div>
        </div>

        {item.subjects.length === 0 ? <div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground"><BookOpenCheck className="mx-auto mb-2 h-5 w-5" />Joriy kurs/fan biriktirishi topilmadi.</div> : <div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Fan</th><th className="p-3">O'quv yili</th><th className="p-3">Semestr</th><th className="p-3">Kredit</th><th className="p-3">Turi</th><th className="p-3">Holati</th><th className="p-3">Progress</th></tr></thead>
          <tbody>{item.subjects.map(subject => <tr key={subject.enrollmentId} className="border-t"><td className="p-3"><p className="font-medium">{subject.subjectName}</p><p className="text-xs text-muted-foreground">{subject.subjectCode ?? subject.courseTitle}</p></td><td className="p-3">{subject.academicYear}</td><td className="p-3">{subject.semester}</td><td className="p-3">{subject.credits}</td><td className="p-3">{subject.required ? 'Majburiy' : 'Tanlov'}</td><td className="p-3"><Badge variant={subject.status === 'ACTIVE' ? 'default' : 'secondary'}>{enrollmentLabel[subject.status]}</Badge></td><td className="p-3">{subject.progress}%</td></tr>)}</tbody>
        </table></div>}
      </CardContent>
    </Card>)}</div>

    {report.data && report.data.totalElements > 0 && <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>{report.data.totalElements} ta tiklangan talaba · {report.data.page + 1} / {Math.max(report.data.totalPages, 1)} sahifa</span>
      <div className="flex gap-2"><Button variant="outline" size="sm" disabled={report.data.page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Oldingi</Button><Button variant="outline" size="sm" disabled={report.data.page + 1 >= report.data.totalPages} onClick={() => setPage(value => value + 1)}>Keyingi<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
    </div>}
  </div>;
}
