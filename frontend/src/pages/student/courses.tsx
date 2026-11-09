import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, CheckCircle2, GraduationCap, Loader2, Play, RefreshCw, ScrollText, Search } from 'lucide-react';
import { useCourses } from '@/hooks/courses/useCourses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SyllabusView, hoursText } from '@/components/learning/student-curriculum';
import { studyPlanApi } from '@/services/api/study-plan-api';
import type { CurriculumSubject } from '@/services/api/curriculum-api';
import type { SubjectSyllabus } from '@/services/api/syllabus-api';
import type { Course } from '@/types/course.types';

const statusLabel: Record<string, string> = { active: 'Faol', completed: 'Yakunlangan', draft: 'Qoralama' };
const ALL = 'all';

/**
 * Kurs o'quv rejadagi fanga bog'lanadi: fan bo'yicha (bir necha semestrli fanda — o'z semestri, bo'lmasa birinchi
 * qatori), fani yo'q kurs — nomi bo'yicha. Bog'lanmaganlari "Boshqa kurslar"da qoladi.
 */
export function assignCourses(subjects: CurriculumSubject[], courses: Course[]) {
  const bySubject = new Map<number, Course[]>();
  const other: Course[] = [];
  const norm = (value?: string | null) => value?.trim().toLocaleLowerCase('uz') ?? '';
  for (const course of courses) {
    const candidates = subjects.filter(s => course.subjectId != null
      ? s.subjectId === course.subjectId
      : norm(s.subjectName) !== '' && (norm(s.subjectName) === norm(course.subjectName) || norm(s.subjectName) === norm(course.title)));
    const row = candidates.find(s => s.semester === course.semester) ?? candidates[0];
    if (row) bySubject.set(row.id, [...(bySubject.get(row.id) ?? []), course]);
    else other.push(course);
  }
  return { bySubject, other };
}

/**
 * Talaba "Fanlar": o'quv rejasidagi fanlar (joriy semestr bo'yicha), har birida shu fanning kursi (o'zlashtirish,
 * davom ettirish) va tasdiqlangan o'quv dasturi. Rejaga bog'lanmagan kurslar pastda.
 */
export function StudentCourses() {
  const navigate = useNavigate();
  const coursesQuery = useCourses();
  const curriculumQuery = useQuery({ queryKey: ['student', 'curriculum'], queryFn: () => studyPlanApi.getMyCurriculum() });
  const [search, setSearch] = useState('');
  const [semesterChoice, setSemesterChoice] = useState<string | null>(null);
  const [syllabusOpen, setSyllabusOpen] = useState<SubjectSyllabus | null>(null);

  const curriculum = curriculumQuery.data?.curriculum ?? null;
  const subjects = useMemo(() => curriculum?.subjects ?? [], [curriculum]);
  const semesters = [...new Set(subjects.map(s => s.semester))].sort((a, b) => a - b);
  const current = curriculumQuery.data?.currentSemester;
  const semester = semesterChoice ?? (current && semesters.includes(current) ? String(current) : ALL);
  const { bySubject, other } = useMemo(() => assignCourses(subjects, coursesQuery.data ?? []), [subjects, coursesQuery.data]);
  const syllabusOf = (id?: number | null) => curriculumQuery.data?.syllabi.find(s => s.id === id);

  const term = search.trim().toLocaleLowerCase('uz');
  const matches = (text: string) => !term || text.toLocaleLowerCase('uz').includes(term);
  const visible = subjects.filter(s => (semester === ALL || s.semester === Number(semester))
    && matches(`${s.subjectName} ${s.subjectCode} ${(bySubject.get(s.id) ?? []).map(c => c.instructor).join(' ')}`));
  const otherVisible = other.filter(c => matches(`${c.title} ${c.description} ${c.instructor}`));
  const loading = coursesQuery.isLoading || curriculumQuery.isLoading;
  const failed = coursesQuery.isError && curriculumQuery.isError;
  const activeCount = (coursesQuery.data ?? []).filter(course => course.status === 'active').length;
  const completedCount = (coursesQuery.data ?? []).filter(course => course.status === 'completed').length;

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div><h1 className="text-2xl font-bold">Fanlar</h1><p className="mt-1 text-sm text-muted-foreground">O‘quv rejangizdagi fanlar, ularning kurslari va o‘quv dasturlari</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4"><GraduationCap className="h-6 w-6 text-primary" /><div><p className="text-2xl font-bold">{subjects.length}</p><p className="text-sm text-muted-foreground">Rejadagi fan</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Play className="h-6 w-6 text-blue-600" /><div><p className="text-2xl font-bold">{activeCount}</p><p className="text-sm text-muted-foreground">Faol kurs</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-6 w-6 text-emerald-600" /><div><p className="text-2xl font-bold">{completedCount}</p><p className="text-sm text-muted-foreground">Yakunlangan kurs</p></div></CardContent></Card>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Fan qidirish" value={search} onChange={event => setSearch(event.target.value)} placeholder="Fan nomi, kodi yoki o‘qituvchi bo‘yicha qidiring" className="pl-9" /></div>
        {semesters.length > 0 && <Select value={semester} onValueChange={setSemesterChoice}>
          <SelectTrigger aria-label="Semestr" className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Barcha semestrlar</SelectItem>
            {semesters.map(n => <SelectItem key={n} value={String(n)}>{n}-semestr{n === current ? ' (joriy)' : ''}</SelectItem>)}
          </SelectContent>
        </Select>}
      </div>

      {loading ? <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        : failed ? <Card className="border-destructive/40"><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><AlertTriangle className="h-10 w-10 text-destructive" /><div><p className="font-medium">Fanlarni yuklab bo‘lmadi</p><p className="text-sm text-muted-foreground">Server bilan aloqani tekshirib qayta urinib ko‘ring.</p></div><Button onClick={() => { void coursesQuery.refetch(); void curriculumQuery.refetch(); }}><RefreshCw className="mr-2 h-4 w-4" />Qayta urinish</Button></CardContent></Card>
        : <>
          {!curriculum && <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><GraduationCap className="mx-auto mb-2 h-8 w-8 opacity-50" />{curriculumQuery.data?.reason ?? "O‘quv reja topilmadi"}. Quyida sizga biriktirilgan kurslar.</CardContent></Card>}
          {curriculum && visible.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground"><BookOpen className="mx-auto mb-2 h-9 w-9 opacity-50" />Fan topilmadi — semestr yoki qidiruvni o‘zgartiring.</CardContent></Card>}
          {visible.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map(subject => {
              const courses = bySubject.get(subject.id) ?? [];
              const syllabus = syllabusOf(subject.syllabusId);
              return <Card key={subject.id} role="region" aria-label={subject.subjectName} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-lg"><button type="button" className="text-left hover:underline" onClick={() => navigate(`/student/subjects/${subject.id}`)}>{subject.subjectName}</button></CardTitle>
                    <Badge variant="outline">{subject.semester}-semestr</Badge>
                  </div>
                  <CardDescription>{subject.subjectCode} · {subject.credits} kredit · {subject.planItemType === 'ELECTIVE' ? 'Tanlov' : 'Majburiy'}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="text-xs text-muted-foreground">{hoursText(subject)}</p>
                  <div className="mt-auto space-y-3">
                    {courses.length === 0 && <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">Kurs hali ochilmagan</p>}
                    {courses.map(course => <div key={course.id} className="space-y-2 rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{course.instructor || 'O‘qituvchi biriktirilmagan'}</span>
                        <Badge variant={course.status === 'completed' ? 'default' : 'secondary'}>{statusLabel[course.status] ?? course.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs"><span>O‘zlashtirish</span><span className="font-medium">{course.progress}%</span></div>
                      <Progress value={course.progress} className="h-2" />
                      <Button className="w-full" size="sm" onClick={() => navigate(`/student/courses/${course.id}/learn`)}>
                        <Play className="mr-2 h-4 w-4" />{course.progress > 0 ? 'Davom ettirish' : 'Kursni boshlash'}
                      </Button>
                    </div>)}
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate(`/student/subjects/${subject.id}`)}><BookOpen className="mr-2 h-4 w-4" />Fanni ochish</Button>
                    {syllabus
                      ? <Button variant="outline" size="sm" className="w-full" onClick={() => setSyllabusOpen(syllabus)}><ScrollText className="mr-2 h-4 w-4" />O‘quv dasturi</Button>
                      : <p className="text-center text-xs text-muted-foreground">O‘quv dasturi hali tasdiqlanmagan</p>}
                  </div>
                </CardContent>
              </Card>;
            })}
          </div>}

          {otherVisible.length > 0 && <section aria-label="Boshqa kurslar" className="space-y-3">
            <h2 className="text-lg font-semibold">{curriculum ? 'Boshqa kurslar' : 'Kurslar'}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{otherVisible.map(course => <Card key={course.id} className="flex flex-col"><CardHeader className="pb-3"><div className="flex items-start justify-between gap-2"><CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle><Badge variant={course.status === 'completed' ? 'default' : 'secondary'}>{statusLabel[course.status] ?? course.status}</Badge></div><CardDescription>{course.instructor || 'O‘qituvchi biriktirilmagan'}</CardDescription></CardHeader><CardContent className="mt-auto space-y-3"><div className="flex items-center justify-between text-sm"><span>O‘zlashtirish</span><span className="font-medium">{course.progress}%</span></div><Progress value={course.progress} className="h-2" /><Button className="w-full" onClick={() => navigate(`/student/courses/${course.id}/learn`)}><Play className="mr-2 h-4 w-4" />{course.progress > 0 ? 'Davom ettirish' : 'Kursni boshlash'}</Button></CardContent></Card>)}</div>
          </section>}
          {!curriculum && otherVisible.length === 0 && <Card><CardContent className="py-14 text-center"><BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">Kurs topilmadi</p><p className="mt-1 text-sm text-muted-foreground">Administrator sizni kursga biriktirishini kuting.</p></CardContent></Card>}
        </>}

      <Dialog open={syllabusOpen != null} onOpenChange={open => { if (!open) setSyllabusOpen(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{syllabusOpen?.subjectName}</DialogTitle>
            <DialogDescription>{syllabusOpen?.name} — o‘quv dasturi</DialogDescription>
          </DialogHeader>
          {syllabusOpen && <SyllabusView syllabus={syllabusOpen} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
