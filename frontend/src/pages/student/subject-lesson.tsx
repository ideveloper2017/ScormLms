import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ClipboardCheck, Download, Eye, FileText,
  Layers, Loader2, PlayCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextContent } from '@/components/editor/rich-text-content';
import { LessonContentViewer, type LessonFileLoader } from '@/components/learning/lesson-content-viewer';
import { useToast } from '@/hooks/use-toast';
import { buildSyllabusModules } from '@/lib/student-subject';
import { languageLabel, topicTypeMeta } from '@/lib/syllabus';
import { studyPlanApi, type StudentLessonMaterial } from '@/services/api/study-plan-api';

/**
 * Fan darsini kurssiz o'qish: talaba o'quv rejasidagi tasdiqlangan o'quv dasturi darsi materiallari. Chapda material,
 * "Darsni yakunlash", oldingi/keyingi, xulosa/resurslar/testlar; o'ngda progress va modullar bo'yicha darslar.
 */
export function StudentSubjectLesson() {
  const { id, topicId } = useParams<{ id: string; topicId: string }>();
  const rowId = Number(id);
  const lessonTopicId = Number(topicId);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const curriculumQuery = useQuery({ queryKey: ['student', 'curriculum'], queryFn: () => studyPlanApi.getMyCurriculum() });
  const row = curriculumQuery.data?.curriculum?.subjects.find((s) => s.id === rowId);
  const syllabus = curriculumQuery.data?.syllabi.find((s) => s.id === row?.syllabusId);
  const syllabusId = syllabus?.id ?? 0;
  const lessonsKey = ['student', 'syllabus', syllabusId, 'lessons'];
  const lessonsQuery = useQuery({ queryKey: lessonsKey, queryFn: () => studyPlanApi.getSyllabusLessons(syllabusId), enabled: syllabusId > 0 });
  const modules = useMemo(() => syllabus ? buildSyllabusModules(syllabus, lessonsQuery.data) : [], [syllabus, lessonsQuery.data]);
  const completed = useMemo(() => new Set(lessonsQuery.data?.completedMaterialIds ?? []), [lessonsQuery.data]);

  const completeMutation = useMutation({
    mutationFn: (materialId: number) => studyPlanApi.completeSyllabusMaterial(syllabusId, materialId),
    onSuccess: (ids) => {
      queryClient.setQueryData(lessonsKey, (current: typeof lessonsQuery.data) => current ? { ...current, completedMaterialIds: ids } : current);
      toast({ title: 'Dars bajarildi deb belgilandi' });
    },
    onError: (cause: Error) => toast({ variant: 'destructive', title: 'Progress saqlanmadi', description: cause.message }),
  });

  if (curriculumQuery.isLoading || lessonsQuery.isLoading) {
    return <div className="flex items-center justify-center gap-2 p-10"><Loader2 className="h-5 w-5 animate-spin" />Dars yuklanmoqda...</div>;
  }
  if (!row || !syllabus) {
    return <div className="space-y-3 p-10 text-center"><p className="text-muted-foreground">Fan yoki uning tasdiqlangan o'quv dasturi topilmadi.</p>
      <Button variant="outline" onClick={() => navigate('/student/courses')}>Fanlarga qaytish</Button></div>;
  }
  if (lessonsQuery.error) {
    return <div className="space-y-3 p-10 text-center"><p className="text-destructive">{lessonsQuery.error.message}</p>
      <Button variant="outline" onClick={() => void lessonsQuery.refetch()}>Qayta urinish</Button></div>;
  }

  const lessons = modules.flatMap((module) => module.lessons.map((lesson) => ({ module, lesson })));
  const current = lessons.find((item) => item.lesson.topicId === lessonTopicId);
  const materials = (lessonsQuery.data?.materials ?? []);
  // Butun dastur bo'yicha materiallar tartibi — oldingi/keyingi shu bo'yicha
  const ordered: StudentLessonMaterial[] = lessons.flatMap((item) => item.lesson.contents
    .map((c) => materials.find((m) => m.id === c.id)).filter((m): m is StudentLessonMaterial => Boolean(m)));
  const lessonMaterials = ordered.filter((m) => m.topicId === lessonTopicId);
  const selectedId = Number(params.get('material'));
  const active = lessonMaterials.find((m) => m.id === selectedId) ?? lessonMaterials[0];
  const activeIndex = active ? ordered.indexOf(active) : -1;
  const go = (material: StudentLessonMaterial | undefined) => {
    if (!material) return;
    if (material.topicId === lessonTopicId) setParams({ material: String(material.id) });
    else navigate(`/student/subjects/${rowId}/lessons/${material.topicId}?material=${material.id}`);
  };
  const quizzes = current?.lesson.quizzes ?? [];
  const progress = materials.length ? Math.round((completed.size / materials.length) * 100) : 0;
  const loader = (material: StudentLessonMaterial): LessonFileLoader => ({
    file: () => studyPlanApi.syllabusMaterialFile(syllabusId, material.id),
    presentation: () => studyPlanApi.syllabusMaterialPresentation(syllabusId, material.id),
    legacyWord: () => studyPlanApi.syllabusMaterialLegacyWord(syllabusId, material.id),
  });

  async function download(material: StudentLessonMaterial) {
    if (!material.asset) return;
    setDownloading(true);
    try {
      const url = URL.createObjectURL(await studyPlanApi.syllabusMaterialFile(syllabusId, material.id));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = material.asset.originalFileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      toast({ variant: 'destructive', title: 'Material yuklab olinmadi', description: cause instanceof Error ? cause.message : undefined });
    } finally {
      setDownloading(false);
    }
  }
  const toggle = (key: string) => setCollapsed((value) => { const next = new Set(value); if (next.has(key)) next.delete(key); else next.add(key); return next; });

  return (
    <div className="grid gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Fan sahifasiga qaytish" onClick={() => navigate(`/student/subjects/${rowId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{[row.subjectName, current?.module.title].filter(Boolean).join(' · ')}</p>
            <h1 className="truncate text-xl font-bold sm:text-2xl">{current?.lesson.title ?? 'Dars topilmadi'}</h1>
          </div>
          {current?.lesson.type && <Badge variant="outline">{topicTypeMeta[current.lesson.type].short}</Badge>}
        </div>

        {!current && <Card><CardContent className="py-8 text-center text-muted-foreground">Bu dars o'quv dasturida topilmadi.</CardContent></Card>}
        {current && !active && <Card><CardContent className="py-8 text-center text-muted-foreground">
          {quizzes.length ? "Bu darsda faqat test bor — pastdagi \"Test\" bo'limiga qarang." : "Bu dars uchun material hali kiritilmagan."}</CardContent></Card>}
        {active && <Card className="overflow-hidden"><CardContent className="space-y-3 p-4">
          <LessonContentViewer key={active.id} courseId={`syllabus-${syllabusId}`} content={active} loader={loader(active)} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {active.asset && <Button variant="outline" className="gap-2" disabled={downloading} onClick={() => void download(active)}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{active.asset.originalFileName}
            </Button>}
            <Button className="gap-2" disabled={completeMutation.isPending || completed.has(active.id)} onClick={() => completeMutation.mutate(active.id)}>
              <CheckCircle2 className="h-4 w-4" />
              {completed.has(active.id) ? 'Dars bajarilgan' : completeMutation.isPending ? 'Saqlanmoqda...' : 'Darsni yakunlash'}
            </Button>
          </div>
        </CardContent></Card>}
        {active && <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={activeIndex <= 0} onClick={() => go(ordered[activeIndex - 1])}><ChevronLeft className="mr-1 h-4 w-4" />Oldingi</Button>
          <span className="text-sm text-muted-foreground">{activeIndex + 1} / {ordered.length}</span>
          <Button variant="outline" disabled={activeIndex >= ordered.length - 1} onClick={() => go(ordered[activeIndex + 1])}>Keyingi<ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>}

        {current && <Tabs defaultValue={active ? 'summary' : 'test'}>
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
            {[['summary', 'Xulosa'], ['resources', `Resurslar (${lessonMaterials.length})`], ['test', `Test (${quizzes.length})`]].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-foreground data-[state=active]:shadow-none">{label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="summary" className="space-y-2 pt-3 text-sm">
            <RichTextContent value={active?.description || current.lesson.description || "Dars uchun qisqa xulosa kiritilmagan."} contained
              className="text-muted-foreground" />
            {active && <p className="text-xs text-muted-foreground">
              Muallif: {active.authorName} · Til: {languageLabel(active.languageCode)} · Manba: {active.sourceName} · v{active.contentVersion}
              {active.durationSeconds ? ` · ${Math.round(active.durationSeconds / 60)} daqiqa` : ""}
            </p>}
          </TabsContent>
          <TabsContent value="resources" className="space-y-1.5 pt-3">
            {lessonMaterials.length === 0 ? <p className="text-sm text-muted-foreground">Material yo'q.</p> : lessonMaterials.map((material) => {
              const Icon = material.contentType === 'video' ? PlayCircle : FileText;
              return <button key={material.id} type="button" onClick={() => go(material)}
                className={`flex w-full items-center gap-3 rounded-md bg-muted/40 px-3 py-2.5 text-left text-sm hover:bg-muted ${material.id === active?.id ? 'ring-1 ring-primary' : ''}`}>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="flex-1">{material.title}</span>
                {completed.has(material.id) ? <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Bajarilgan" /> : <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
              </button>;
            })}
          </TabsContent>
          <TabsContent value="test" className="space-y-1.5 pt-3">
            {quizzes.length === 0 ? <p className="text-sm text-muted-foreground">Bu darsda test yo'q.</p> : <>
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm">
                  <ClipboardCheck className="h-4 w-4 text-primary" /><span className="flex-1">{quiz.title}</span>
                  <Badge variant="outline">{quiz.kind === 'QUESTION' ? 'Savol/Javob' : 'Test'} · {quiz.questionCount} savol · {quiz.durationMinutes} daq</Badge>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Dars testlarini ishlash keyingi bosqichda ochiladi.</p>
            </>}
          </TabsContent>
        </Tabs>}
      </div>

      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <Card className="shadow-none"><CardContent className="space-y-3 p-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{completed.size}/{materials.length} material bajarildi</span>
              <Badge variant={progress === 100 ? 'default' : 'secondary'} className="h-5 text-[10px]">{progress}%</Badge></div>
            <Progress value={progress} className="h-1.5" />
          </div>
          <nav aria-label="Darslar" className="space-y-2">
            {modules.map((module) => {
              const expanded = !collapsed.has(module.key);
              return <section key={module.key} aria-label={module.title} className="overflow-hidden rounded-lg border bg-background">
                <button type="button" aria-expanded={expanded} onClick={() => toggle(module.key)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40">
                  <Layers className="h-4 w-4 text-primary" /><span className="flex-1">{module.title}</span>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expanded && <div className="space-y-1 px-2 pb-2">
                  {module.lessons.map((lesson) => {
                    const isCurrent = lesson.topicId === lessonTopicId;
                    const empty = lesson.status === 'empty';
                    return <button key={lesson.key} type="button" disabled={empty} aria-current={isCurrent ? 'step' : undefined}
                      onClick={() => navigate(`/student/subjects/${rowId}/lessons/${lesson.topicId}${lesson.openContentId ? `?material=${lesson.openContentId}` : ''}`)}
                      className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs ${isCurrent ? 'border-primary bg-primary/5 font-medium text-primary' : 'hover:bg-muted/50'} ${empty ? 'cursor-default opacity-60 hover:bg-transparent' : ''}`}>
                      {lesson.status === 'done' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="Bajarilgan" />
                        : <span className="h-4 w-4 shrink-0 rounded-full border" aria-hidden="true" />}
                      <span className="flex-1">{lesson.title}</span>
                      {lesson.contents.length ? <span className="text-muted-foreground">{lesson.contents.filter((c) => completed.has(c.id)).length}/{lesson.contents.length}</span> : null}
                      {lesson.quizzes.length ? <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label={`${lesson.quizzes.length} ta test`} /> : null}
                    </button>;
                  })}
                </div>}
              </section>;
            })}
          </nav>
        </CardContent></Card>
      </aside>
    </div>
  );
}
