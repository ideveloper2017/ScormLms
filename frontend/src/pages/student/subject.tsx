import { useMemo, useState, type ElementType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlarmClock, ArrowLeft, ArrowRight, Award, BookOpen, Check, CheckCircle2, ChevronDown, ChevronUp, Circle, CircleDot,
  ClipboardCheck, Clock, FileText, FlaskConical, Languages, LayoutGrid, Layers, Link as LinkIcon, List,
  Loader2, MessageSquare, PencilLine, PlayCircle, Table as TableIcon, User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextContent } from '@/components/editor/rich-text-content';
import { SyllabusCover, SyllabusIntroVideo } from '@/components/learning/syllabus-media';
import { useCourses } from '@/hooks/courses/useCourses';
import { languageLabel, topicTypeMeta } from '@/lib/syllabus';
import {
  buildSubjectModules, buildSyllabusModules, linesOf, planHours, typeStats, upcomingDeadlines, type SubjectLesson, type SubjectModule,
} from '@/lib/student-subject';
import { cn } from '@/lib/utils';
import { fetchGrades } from '@/services/api/grade-api';
import { studyPlanApi, type LearningContent } from '@/services/api/study-plan-api';
import type { SyllabusTopicType } from '@/services/api/syllabus-api';
import { fetchTests } from '@/services/test-api';
import { assignCourses } from './courses';

const TYPE_BAR: Record<SyllabusTopicType, string> = {
  THEORETICAL: 'bg-violet-500', PRACTICAL: 'bg-teal-500', LABORATORY: 'bg-orange-500', SEMINAR: 'bg-pink-500',
};
const TYPE_ICON: Record<SyllabusTopicType, ElementType> = {
  THEORETICAL: BookOpen, PRACTICAL: PencilLine, LABORATORY: FlaskConical, SEMINAR: MessageSquare,
};
const CONTENT_ICON: Record<LearningContent['contentType'], ElementType> = {
  video: PlayCircle, document: FileText, file: FileText, link: LinkIcon, text: FileText,
};
type View = 'list' | 'type' | 'table';

/**
 * Talaba fan sahifasi: banner (fan, o'qituvchi, kredit, progress, davom ettirish), tablar — o'quv dasturi (ro'yxat /
 * turlar / jadval), fan haqida, talablar va natijalar, baholar; o'ngda keyingi mavzu, muddatlar, mashg'ulotlar,
 * o'qituvchi. Fan — talaba o'quv rejasidagi qator (id). Tasdiqlangan o'quv dasturi bo'lsa fan kurssiz, dastur
 * darslaridan o'qiladi (progress dasturda); dastur bo'lmasa — eski kurs bo'yicha.
 */
export function StudentSubject() {
  const { id } = useParams<{ id: string }>();
  const rowId = Number(id);
  const navigate = useNavigate();
  const curriculumQuery = useQuery({ queryKey: ['student', 'curriculum'], queryFn: () => studyPlanApi.getMyCurriculum() });
  const coursesQuery = useCourses();
  const subjects = useMemo(() => curriculumQuery.data?.curriculum?.subjects ?? [], [curriculumQuery.data]);
  const row = subjects.find((s) => s.id === rowId);
  const course = useMemo(() => row ? assignCourses(subjects, coursesQuery.data ?? []).bySubject.get(row.id)?.[0] : undefined,
    [row, subjects, coursesQuery.data]);
  const courseId = course ? Number(course.id) : 0;
  const syllabus = curriculumQuery.data?.syllabi.find((s) => s.id === row?.syllabusId);
  const syllabusId = syllabus?.id ?? 0;
  const lessonsQuery = useQuery({ queryKey: ['student', 'syllabus', syllabusId, 'lessons'], queryFn: () => studyPlanApi.getSyllabusLessons(syllabusId), enabled: syllabusId > 0 });
  const contentsQuery = useQuery({ queryKey: ['student', 'course', courseId, 'contents'], queryFn: () => studyPlanApi.getCourseContents(courseId), enabled: courseId > 0 });
  const progressQuery = useQuery({ queryKey: ['student', 'course', courseId, 'progress'], queryFn: () => studyPlanApi.getCourseProgress(courseId), enabled: courseId > 0 });
  const testsQuery = useQuery({ queryKey: ['student', 'course', courseId, 'tests'], queryFn: () => fetchTests({ courseId: String(courseId) }), enabled: courseId > 0 });
  const gradesQuery = useQuery({ queryKey: ['student', 'course', courseId, 'grades'], queryFn: () => fetchGrades({ courseId: String(courseId) }), enabled: courseId > 0 });
  const [view, setView] = useState<View>('list');

  const modules = useMemo(() => syllabus ? buildSyllabusModules(syllabus, lessonsQuery.data)
    : buildSubjectModules(undefined, contentsQuery.data ?? [], progressQuery.data?.completedContentIds ?? [], testsQuery.data ?? []),
  [syllabus, lessonsQuery.data, contentsQuery.data, progressQuery.data, testsQuery.data]);
  const lessons = modules.flatMap((m) => m.lessons);
  const next = lessons.find((l) => l.status === 'current');

  if (curriculumQuery.isLoading || coursesQuery.isLoading) {
    return <div className="flex items-center justify-center gap-2 p-10"><Loader2 className="h-5 w-5 animate-spin" />Fan yuklanmoqda...</div>;
  }
  if (!row) {
    return <div className="space-y-3 p-10 text-center"><p className="text-muted-foreground">Fan o'quv rejangizda topilmadi.</p>
      <Button variant="outline" onClick={() => navigate('/student/courses')}>Fanlarga qaytish</Button></div>;
  }

  // Dasturdan o'qish mumkin (kurssiz) yoki eski kurs bor
  const canLearn = Boolean(syllabus) || courseId > 0;
  const open = (lesson: SubjectLesson) => {
    if (syllabus) {
      if (lesson.topicId == null) return;
      navigate(`/student/subjects/${rowId}/lessons/${lesson.topicId}${lesson.openContentId ? `?material=${lesson.openContentId}` : ''}`);
      return;
    }
    if (!courseId) return;
    if (lesson.openContentId) navigate(`/student/courses/${courseId}/learn?content=${lesson.openContentId}`);
    else if (lesson.tests.length) navigate('/student/tests');
  };
  // O'quv rejada biriktirilgan mas'ul o'qituvchi (bo'lmasa — eski kurs o'qituvchisi)
  const instructor = row.teacherName || course?.instructor || '';
  const materialTotal = lessonsQuery.data?.materials.length ?? 0;
  const progress = syllabus
    ? (materialTotal ? Math.round(((lessonsQuery.data?.completedMaterialIds.length ?? 0) / materialTotal) * 100) : 0)
    : progressQuery.data?.progress ?? course?.progress ?? 0;
  const doneLessons = lessons.filter((l) => l.status === 'done').length;
  const withItems = lessons.filter((l) => l.status !== 'empty').length;

  return (
    <div className="space-y-4 p-3 sm:p-4 md:p-6">
      {/* Banner */}
      <section aria-label="Fan" className="grid gap-4 rounded-xl border bg-primary/5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
        <div className="flex min-w-0 gap-4">
          {syllabus?.coverImageAvailable && <SyllabusCover queryKey={['student', 'syllabus', syllabus.id, 'cover']} load={() => studyPlanApi.syllabusMedia(syllabus.id, 'cover')}
            available alt={row.subjectName} className="hidden h-28 w-28 shrink-0 rounded-lg border sm:block" />}
          <div className="min-w-0">
          <button type="button" onClick={() => navigate('/student/courses')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />Fanlar · {row.semester}-semestr · {row.planItemType === 'ELECTIVE' ? 'Tanlov' : 'Majburiy'}
          </button>
          <h1 className="mt-1 text-2xl font-bold">{row.subjectName}</h1>
          {syllabus?.shortDescription && <p className="mt-1 text-sm text-muted-foreground">{syllabus.shortDescription}</p>}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{instructor || "O'qituvchi biriktirilmagan"}</span>
            <span className="flex items-center gap-1.5"><Award className="h-4 w-4" />{row.credits} kredit</span>
            <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" />{modules.length} modul · {lessons.length} mavzu</span>
            {row.totalHours ? <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{row.totalHours} soat</span> : null}
            {syllabus && <span className="flex items-center gap-1.5"><Languages className="h-4 w-4" />{languageLabel(syllabus.language)}</span>}
          </div>
          </div>
        </div>
        <Card className="shadow-none"><CardContent className="space-y-3 p-4">
          <div className="flex items-baseline justify-between"><span className="text-2xl font-semibold">{progress}%</span>
            <span className="text-xs text-muted-foreground">{doneLessons} / {withItems} mavzu</span></div>
          <Progress value={progress} className="h-2" />
          <Button className="w-full" disabled={!next || !canLearn} onClick={() => next && open(next)}>
            {!canLearn ? "O'quv dasturi tasdiqlanmagan" : next ? (doneLessons ? 'Davom ettirish' : 'Boshlash') : withItems ? 'Hammasi bajarilgan' : "Material hali yo'q"}<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent></Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Card className="min-w-0 shadow-none"><Tabs defaultValue="program">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
            {[['program', "O'quv dasturi"], ['about', 'Fan haqida'], ['details', 'Talablar va natijalar'], ['grades', 'Baholar']].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="rounded-none border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-foreground data-[state=active]:shadow-none">{label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="program" className="mt-0 space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{modules.length} modul · {lessons.length} mavzu{row.auditoryHours ? ` · ${row.auditoryHours} soat auditoriya` : ''}</p>
              <div role="group" aria-label="Ko'rinish" className="flex rounded-md bg-muted p-0.5">
                {([['list', 'Ro\'yxat', List], ['type', 'Turlar', LayoutGrid], ['table', 'Jadval', TableIcon]] as const).map(([value, label, Icon]) => (
                  <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}
                    className={cn('flex items-center gap-1 rounded px-2.5 py-1 text-xs', view === value ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground')}>
                    <Icon className="h-3.5 w-3.5" />{label}</button>
                ))}
              </div>
            </div>
            {lessonsQuery.isLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Darslar yuklanmoqda...</p>}
            {modules.length === 0 && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {syllabus ? "O'quv dasturida hali modul va mavzular yo'q." : "Bu fan uchun o'quv dasturi hali tasdiqlanmagan."}</p>}
            {view === 'list' && <ListView modules={modules} onOpen={open} />}
            {view === 'type' && <TypeView modules={modules} onOpen={open} />}
            {view === 'table' && <TableView modules={modules} onOpen={open} />}
          </TabsContent>

          <TabsContent value="about" className="mt-0 space-y-4 p-4">
            {syllabus && (syllabus.introVideoName || syllabus.introVideoUrl) && <div className="max-w-3xl">
              <SyllabusIntroVideo queryKey={['student', 'syllabus', syllabus.id, 'video']} load={() => studyPlanApi.syllabusMedia(syllabus.id, 'video')}
                uploaded={!!syllabus.introVideoName} link={syllabus.introVideoUrl} title={`${row.subjectName} — tanishtiruv videosi`} /></div>}
            <div><h3 className="mb-1 font-semibold">Fan haqida</h3>
              <RichTextContent value={syllabus?.fullDescription || syllabus?.shortDescription || "Fan ta'rifi hali kiritilmagan."} contained
                className="text-sm leading-relaxed text-muted-foreground" /></div>
            {planHours(row).length > 0 && <div><h3 className="mb-2 font-semibold">Mashg'ulot turlari</h3>
              <div className="flex flex-wrap gap-2">{planHours(row).map((h) => <Badge key={h.label} variant="secondary">{h.label} · {h.hours} soat</Badge>)}</div></div>}
          </TabsContent>

          <TabsContent value="details" className="mt-0 grid gap-6 p-4 sm:grid-cols-2">
            <CheckList title="Talablar" items={linesOf(syllabus?.requirements)} />
            <CheckList title="Natijalar" items={linesOf(syllabus?.learningOutcomes)} />
          </TabsContent>

          <TabsContent value="grades" className="mt-0 space-y-3 p-4">
            {!courseId ? <p className="text-sm text-muted-foreground">Hali baho qo'yilmagan. Dars testlari va nazoratlar baholari shu yerda chiqadi.</p>
              : gradesQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" />
              : (gradesQuery.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Hali baho qo'yilmagan.</p>
              : (gradesQuery.data ?? []).map((grade) => (
                <div key={grade.id}>
                  <div className="flex justify-between text-sm"><span>{grade.testName || grade.assignmentName || 'Baho'}</span>
                    <span className="tabular-nums">{grade.earnedScore} / {grade.maxScore}</span></div>
                  <Progress value={grade.scorePercentage} className="mt-1 h-1.5" />
                </div>
              ))}
          </TabsContent>
        </Tabs></Card>

        <aside className="space-y-3">
          <Card className="shadow-none"><CardContent className="space-y-2 p-4">
            <p className="text-xs text-muted-foreground">Keyingi mavzu</p>
            {next ? <button type="button" onClick={() => open(next)} className="block w-full text-left">
              <div className="mb-2 flex h-16 items-center justify-center rounded-md bg-primary/10 text-primary"><PlayCircle className="h-7 w-7" /></div>
              <p className="text-sm font-medium">{next.title}</p>
              <p className="text-xs text-muted-foreground">{[next.type && topicTypeMeta[next.type].short, next.contents.length && `${next.contents.length} ta material`, testCount(next) && `${testCount(next)} ta test`].filter(Boolean).join(' · ')}</p>
            </button> : <p className="text-sm text-muted-foreground">{!canLearn ? "O'quv dasturi tasdiqlanmagan" : withItems ? 'Barcha mavzular bajarilgan' : "Material hali yo'q"}</p>}
          </CardContent></Card>
          <Card className="shadow-none"><CardContent className="p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><AlarmClock className="h-4 w-4" />Muddatlar</p>
            {upcomingDeadlines(testsQuery.data ?? []).length === 0 ? <p className="text-xs text-muted-foreground">Yaqin muddat yo'q</p>
              : upcomingDeadlines(testsQuery.data ?? []).map((test) => (
                <div key={test.id} className="flex justify-between gap-2 py-1 text-xs"><span className="truncate">{test.title}</span>
                  <span className="shrink-0 text-amber-600">{new Date(test.date).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}</span></div>
              ))}
          </CardContent></Card>
          {typeStats(modules).length > 0 && <Card className="shadow-none"><CardContent className="space-y-2.5 p-4">
            <p className="text-sm font-medium">Mashg'ulotlar</p>
            {typeStats(modules).map((s) => (
              <div key={s.type} className="text-xs">
                <div className="flex justify-between"><span>{topicTypeMeta[s.type].short}</span><span className="text-muted-foreground">{s.done}/{s.total}</span></div>
                <div className="mt-1 h-1 rounded bg-muted"><div className={cn('h-1 rounded', TYPE_BAR[s.type])} style={{ width: `${Math.round((s.done / s.total) * 100)}%` }} /></div>
              </div>
            ))}
          </CardContent></Card>}
          {instructor && <Card className="shadow-none"><CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {instructor.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium">{instructor}</p><p className="text-xs text-muted-foreground">O'qituvchi</p></div>
          </CardContent></Card>}
        </aside>
      </div>
    </div>
  );
}

const testCount = (lesson: SubjectLesson) => lesson.tests.length + lesson.quizzes.length;

function StatusIcon({ status }: { status: SubjectLesson['status'] }) {
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="Bajarilgan" />;
  if (status === 'current') return <CircleDot className="h-4 w-4 shrink-0 text-primary" aria-label="Joriy" />;
  return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />;
}

function LessonRow({ lesson, onOpen }: { lesson: SubjectLesson; onOpen: (lesson: SubjectLesson) => void }) {
  const Icon = lesson.contents[0] ? CONTENT_ICON[lesson.contents[0].contentType] : testCount(lesson) ? ClipboardCheck : lesson.type ? TYPE_ICON[lesson.type] : FileText;
  const empty = lesson.status === 'empty';
  return <button type="button" disabled={empty} onClick={() => onOpen(lesson)} aria-current={lesson.status === 'current' ? 'step' : undefined}
    className={cn('flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm',
      lesson.status === 'current' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50', empty && 'cursor-default opacity-70 hover:bg-transparent')}>
    <StatusIcon status={lesson.status} />
    <Icon className={cn('h-4 w-4 shrink-0', lesson.status === 'current' ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
    <span className="min-w-0 flex-1">
      <span className={cn(lesson.status === 'current' && 'font-medium text-primary')}>{lesson.title}</span>
      <span className="text-xs text-muted-foreground">
        {lesson.type ? ` · ${topicTypeMeta[lesson.type].short}` : ''}
        {lesson.contents.length ? ` · ${lesson.contents.length} ta material` : ''}
        {testCount(lesson) ? ` · ${testCount(lesson)} ta test` : ''}
        {empty ? ' · material hali yo\'q' : ''}
      </span>
    </span>
    {lesson.hours ? <span className="shrink-0 text-xs text-muted-foreground">{lesson.hours} soat</span> : null}
  </button>;
}

function ModuleBadge({ module, index }: { module: SubjectModule; index: number }) {
  return <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
    module.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
      : module.status === 'current' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
    {module.status === 'done' ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>;
}

function moduleProgress(module: SubjectModule) {
  const items = module.lessons.filter((l) => l.status !== 'empty');
  return { done: items.filter((l) => l.status === 'done').length, total: module.lessons.length, withItems: items.length };
}

function ListView({ modules, onOpen }: { modules: SubjectModule[]; onOpen: (lesson: SubjectLesson) => void }) {
  // Avvaliga joriy modul (bo'lmasa birinchisi) ochiq
  const initial = modules.find((m) => m.status === 'current')?.key ?? modules[0]?.key;
  const [opened, setOpened] = useState<Set<string>>(() => new Set(initial ? [initial] : []));
  const toggle = (key: string) => setOpened((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  return <div className="space-y-2">{modules.map((module, index) => {
    const expanded = opened.has(module.key);
    const { done, total, withItems } = moduleProgress(module);
    return <section key={module.key} aria-label={module.title} className="overflow-hidden rounded-xl border">
      <button type="button" aria-expanded={expanded} onClick={() => toggle(module.key)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
        <ModuleBadge module={module} index={index} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{module.title}</span>
          {withItems > 0 && <span className="mt-1 block h-1 max-w-40 rounded bg-muted"><span className="block h-1 rounded bg-primary" style={{ width: `${Math.round((done / withItems) * 100)}%` }} /></span>}
        </span>
        <span className={cn('text-xs', module.status === 'done' ? 'text-green-600' : 'text-muted-foreground')}>{done}/{total}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && <div className="space-y-1.5 px-3 pb-3">
        {module.description && <p className="px-1 pb-1 text-xs text-muted-foreground">{module.description}</p>}
        {module.lessons.map((lesson) => <LessonRow key={lesson.key} lesson={lesson} onOpen={onOpen} />)}
      </div>}
    </section>;
  })}</div>;
}

function TypeView({ modules, onOpen }: { modules: SubjectModule[]; onOpen: (lesson: SubjectLesson) => void }) {
  return <div className="space-y-3">{modules.map((module, index) => {
    const groups = (['THEORETICAL', 'PRACTICAL', 'LABORATORY', 'SEMINAR'] as SyllabusTopicType[])
      .map((type) => ({ type, lessons: module.lessons.filter((l) => l.type === type) })).filter((g) => g.lessons.length);
    const untyped = module.lessons.filter((l) => !l.type);
    const tests = [...module.lessons.flatMap((l) => l.tests.map((t) => ({ id: `t-${t.id}`, title: t.title, done: t.status === 'completed' }))),
      ...module.lessons.flatMap((l) => l.quizzes.map((q) => ({ id: `q-${q.id}`, title: q.title, done: false })))];
    return <section key={module.key} aria-label={module.title} className="overflow-hidden rounded-xl border">
      <div className="flex items-center gap-3 border-b px-4 py-3"><ModuleBadge module={module} index={index} /><span className="flex-1 text-sm font-medium">{module.title}</span>
        <span className="text-xs text-muted-foreground">{moduleProgress(module).done}/{module.lessons.length}</span></div>
      <div className="grid sm:grid-cols-2">
        {[...groups.map((g) => ({ key: g.type, title: topicTypeMeta[g.type].short, Icon: TYPE_ICON[g.type], hours: g.lessons.reduce((s, l) => s + (l.hours ?? 0), 0), lessons: g.lessons })),
          ...(untyped.length ? [{ key: 'other', title: 'Boshqa', Icon: FileText, hours: 0, lessons: untyped }] : [])].map((group) => (
          <div key={group.key} className="border-b p-3 sm:odd:border-r">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"><group.Icon className="h-3.5 w-3.5" />{group.title}{group.hours ? ` · ${group.hours} soat` : ''}</p>
            {group.lessons.map((lesson) => <button key={lesson.key} type="button" disabled={lesson.status === 'empty'} onClick={() => onOpen(lesson)}
              className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-muted/50 disabled:hover:bg-transparent">
              <StatusIcon status={lesson.status} /><span className={cn('flex-1', lesson.status === 'current' && 'font-medium text-primary')}>{lesson.title}</span></button>)}
          </div>
        ))}
        {tests.length > 0 && <div className="border-b p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-600"><ClipboardCheck className="h-3.5 w-3.5" />Testlar</p>
          {tests.map((test) => <p key={test.id} className="flex items-center gap-2 py-1 text-sm">
            {test.done ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}{test.title}</p>)}
        </div>}
      </div>
    </section>;
  })}</div>;
}

const TABLE_TYPES: [SyllabusTopicType, string][] = [['THEORETICAL', "Ma'r."], ['PRACTICAL', 'Amal.'], ['LABORATORY', 'Lab.'], ['SEMINAR', 'Sem.']];

function TableView({ modules, onOpen }: { modules: SubjectModule[]; onOpen: (lesson: SubjectLesson) => void }) {
  const cols = TABLE_TYPES.filter(([type]) => modules.some((m) => m.lessons.some((l) => l.type === type)));
  const cell = (lesson: SubjectLesson, type: SyllabusTopicType) => lesson.type === type ? (lesson.hours ?? '✓') : '—';
  const sum = (items: SubjectLesson[], type: SyllabusTopicType) => items.filter((l) => l.type === type).reduce((s, l) => s + (l.hours ?? 0), 0) || '';
  let number = 0;
  return <div className="overflow-x-auto rounded-xl border">
    <table className="w-full text-sm">
      <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
        <th className="w-10 px-3 py-2 text-left">№</th><th className="px-3 py-2 text-left">Mavzu</th>
        {cols.map(([type, label]) => <th key={type} className="w-14 px-2 py-2 text-center">{label}</th>)}
        <th className="w-20 px-3 py-2 text-center">Holat</th></tr></thead>
      <tbody>{modules.map((module) => [
        <tr key={module.key} className="border-t bg-muted/30 font-medium"><td className="px-3 py-2" /><td className="px-3 py-2">{module.title}</td>
          {cols.map(([type]) => <td key={type} className="px-2 py-2 text-center">{sum(module.lessons, type)}</td>)}
          <td className="px-3 py-2 text-center text-xs">{moduleProgress(module).done}/{module.lessons.length}</td></tr>,
        ...module.lessons.map((lesson) => { number += 1; return (
          <tr key={lesson.key} className={cn('border-t', lesson.status === 'current' && 'bg-primary/5')}>
            <td className="px-3 py-2 text-muted-foreground">{number}</td>
            <td className={cn('px-3 py-2', lesson.status === 'current' && 'font-medium text-primary')}>{lesson.title}</td>
            {cols.map(([type]) => <td key={type} className="px-2 py-2 text-center text-muted-foreground">{cell(lesson, type)}</td>)}
            <td className="px-3 py-2 text-center">
              {lesson.status === 'done' ? <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" aria-label="Bajarilgan" />
                : lesson.status === 'empty' ? <span className="text-xs text-muted-foreground">—</span>
                : <Button size="sm" variant={lesson.status === 'current' ? 'default' : 'outline'} className="h-7 px-2 text-xs" onClick={() => onOpen(lesson)}>Ochish</Button>}
            </td></tr>); }),
      ])}</tbody>
    </table>
  </div>;
}

function CheckList({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="mb-2 border-b pb-2 font-semibold">{title}</h3>
    {items.length === 0 ? <p className="text-sm text-muted-foreground">Kiritilmagan</p>
      : <ul className="space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />{item}</li>)}</ul>}
  </div>;
}

