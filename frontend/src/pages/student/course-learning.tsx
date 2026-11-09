import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { workspaceApi } from '@/services/api/workspace-api';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  Eye,
  ClipboardCheck,
  Download,
  FileText,
  Layers,
  Loader2,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { topicTypeMeta } from "@/lib/syllabus";
import type { SyllabusTopicType } from "@/services/api/syllabus-api";
import { useToast } from "@/hooks/use-toast";
import { scormApi } from "@/services/api/scorm-api";
import { studyPlanApi, type LearningContent } from "@/services/api/study-plan-api";
import { groupBySyllabusModule } from "@/lib/syllabus-modules";
import { UNASSIGNED_UNIT_TITLE } from "@/lib/course-units";
import { teacherPortalApi, type CourseContentAsset } from "@/services/api/teacher-portal-api";
import { CourseForum } from "@/components/course-forum";
import { LessonContentViewer } from "@/components/learning/lesson-content-viewer";
import { RichTextContent } from "@/components/editor/rich-text-content";
import { fetchTests } from "@/services/test-api";

/** Kontentlar kurs bo'limi (dars) bo'yicha — backend ularni bo'lim tartibida qaytaradi */
function sectionsOf(contents: LearningContent[]) {
  const sections: { moduleId: number; title: string; items: LearningContent[] }[] = [];
  for (const content of contents) {
    const last = sections[sections.length - 1];
    if (last && last.moduleId === content.moduleId) last.items.push(content);
    else sections.push({ moduleId: content.moduleId, title: content.moduleTitle, items: [content] });
  }
  return sections;
}

const topicLabel = (type: string) => topicTypeMeta[type as SyllabusTopicType]?.short ?? type;

/**
 * Mavzuni o'qish sahifasi: chapda kontent, ostida xulosa, resurslar, test va forum; o'ngda progress va modullar
 * bo'yicha mavzular ro'yxati (ochiladi-yopiladi).
 */
export function StudentCourseLearning() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const selectedContentId = Number(params.get('content'));
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const enabled = Number.isInteger(courseId) && courseId > 0;
  const contentsQuery = useQuery({
    queryKey: ["student", "course", courseId, "contents"],
    queryFn: () => studyPlanApi.getCourseContents(courseId),
    enabled,
  });
  const packagesQuery = useQuery({
    queryKey: ["student", "course", courseId, "scorm"],
    queryFn: () => scormApi.listPackages(courseId),
    enabled,
  });
  const progressQuery = useQuery({
    queryKey: ["student", "course", courseId, "progress"],
    queryFn: () => studyPlanApi.getCourseProgress(courseId),
    enabled,
  });
  // Dars testlari (Test va Savol/Javob) — dars ostida, ishlash testlar sahifasida (proktoring ham o'sha yerda)
  const testsQuery = useQuery({
    queryKey: ["student", "course", courseId, "tests"],
    queryFn: () => fetchTests({ courseId: String(courseId) }),
    enabled,
  });
  const lessonTests = (lessonId: number) => (testsQuery.data ?? []).filter((test) => test.lessonId === String(lessonId));
  const completeMutation = useMutation({
    mutationFn: (contentId: number) =>
      studyPlanApi.recordContentProgress(courseId, contentId, 100),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["student", "study-plan"] }),
        queryClient.invalidateQueries({
          queryKey: ["student", "course", courseId, "progress"],
        }),
        queryClient.invalidateQueries({ queryKey: ["courses"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace"] }),
      ]);
      toast({ title: "Kontent bajarildi deb belgilandi" });
    },
    onError: (cause: Error) =>
      toast({
        variant: "destructive",
        title: "Progress saqlanmadi",
        description: cause.message,
      }),
  });
  const viewMutation = useMutation({
    mutationFn: (contentId: number) => workspaceApi.viewed(courseId, contentId),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['workspace'] }); },
    onError: () => toast({ variant: 'destructive', title: 'Oxirgi dars saqlanmadi. Qayta ochib ko‘ring.' }),
  });
  const contents = contentsQuery.data ?? [];
  const activeIndex = Math.max(0, contents.findIndex(content => content.id === selectedContentId));
  const activeContent = contents[activeIndex];
  const lastViewed = useRef<string | null>(null);
  const { mutate: saveViewed } = viewMutation;
  useEffect(() => {
    if (!activeContent) return;
    const key = `${courseId}:${activeContent.id}`;
    if (lastViewed.current === key) return;
    lastViewed.current = key;
    saveViewed(activeContent.id);
  }, [courseId, activeContent?.id, saveViewed]);

  function selectLesson(index: number) {
    const content = contents[index];
    if (content) setParams({ content: String(content.id) });
  }

  async function downloadContent(contentId: number, asset: CourseContentAsset) {
    setDownloadingId(contentId);
    try {
      const blob = await teacherPortalApi.downloadContentFile(String(courseId), contentId);
      setParams({ content: String(contentId) }, { replace: true });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = asset.originalFileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      toast({ variant: "destructive", title: "Material yuklab olinmadi", description: cause instanceof Error ? cause.message : undefined });
    } finally {
      setDownloadingId(null);
    }
  }

  const loading =
    contentsQuery.isLoading ||
    packagesQuery.isLoading ||
    progressQuery.isLoading;
  const error =
    contentsQuery.error || packagesQuery.error || progressQuery.error;
  if (!enabled)
    return (
      <div className="p-8 text-center text-destructive">
        Kurs identifikatori noto'g'ri.
      </div>
    );
  if (loading)
    return (
      <div className="p-8 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Kurs materiallari yuklanmoqda...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-destructive">{error.message}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Qayta urinish
        </Button>
      </div>
    );

  const packages = packagesQuery.data ?? [];
  const progress = progressQuery.data;
  const done = (contentId: number) => progress?.completedContentIds?.includes(contentId) ?? false;
  const groups = groupBySyllabusModule(contents, (content) => content.unitTitle, UNASSIGNED_UNIT_TITLE);
  const activeLesson = activeContent ? contents.filter((content) => content.moduleId === activeContent.moduleId) : [];
  const activeTests = activeContent ? lessonTests(activeContent.moduleId) : [];
  const toggleGroup = (key: string) => setCollapsed((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  return (
    <div className="grid gap-4 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Kurslar ro‘yxatiga qaytish" onClick={() => navigate("/student/courses")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{activeContent ? [activeContent.unitTitle, activeContent.moduleTitle].filter(Boolean).join(" · ") : "Kurs materiallari"}</p>
            <h1 className="truncate text-xl font-bold sm:text-2xl">{activeContent?.title ?? "Kurs materiallari"}</h1>
          </div>
          {activeContent?.topicType && <Badge variant="outline">{topicLabel(activeContent.topicType)}</Badge>}
        </div>

        {contents.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Hozir amal qilayotgan va nashr qilingan oddiy kontent yo'q.</CardContent></Card>
        )}
        {(activeContent ? [activeContent] : []).map((content) => (
          <Card key={content.id} id={`content-${content.id}`} className="scroll-mt-4 overflow-hidden">
            <CardContent className="space-y-3 p-4">
              {viewMutation.isError && <Button variant="outline" onClick={() => viewMutation.mutate(content.id)}>Davom ettirish uchun darsni qayta saqlash</Button>}
              <LessonContentViewer courseId={String(courseId)} content={content} />
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {content.asset && (
                  <Button variant="outline" className="gap-2" disabled={downloadingId === content.id} onClick={() => void downloadContent(content.id, content.asset!)}>
                    {downloadingId === content.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {content.asset.originalFileName}
                  </Button>
                )}
                <Button onClick={() => completeMutation.mutate(content.id)} disabled={completeMutation.isPending || done(content.id)} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {done(content.id) ? 'Dars bajarilgan' : completeMutation.isPending ? 'Saqlanmoqda...' : 'Darsni yakunlash'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {activeContent && <div className="flex items-center justify-between gap-3">
          <Button variant="outline" disabled={activeIndex === 0} onClick={() => selectLesson(activeIndex - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Oldingi dars</Button>
          <span className="text-sm text-muted-foreground">{activeIndex + 1} / {contents.length}</span>
          <Button variant="outline" disabled={activeIndex === contents.length - 1} onClick={() => selectLesson(activeIndex + 1)}>Keyingi dars<ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>}

        {activeContent && <Tabs defaultValue="summary">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
            {[["summary", "Xulosa"], ["resources", `Resurslar (${activeLesson.length})`], ["test", `Test (${activeTests.length})`], ["forum", "Forum"]].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-foreground data-[state=active]:shadow-none">{label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="summary" className="space-y-2 pt-3 text-sm">
            <RichTextContent value={activeContent.description || "Dars uchun qisqa xulosa kiritilmagan."} contained className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Muallif: {activeContent.authorName} · Til: {activeContent.languageCode} · Manba: {activeContent.sourceName} · v{activeContent.contentVersion}
              {activeContent.durationMinutes ? ` · ${activeContent.durationMinutes} daqiqa` : ""}
            </p>
          </TabsContent>
          <TabsContent value="resources" className="space-y-1.5 pt-3">
            {activeLesson.map((content) => {
              const Icon = content.contentType === 'video' ? PlayCircle : FileText;
              return <button key={content.id} type="button" onClick={() => selectLesson(contents.indexOf(content))}
                className={`flex w-full items-center gap-3 rounded-md bg-muted/40 px-3 py-2.5 text-left text-sm hover:bg-muted ${content.id === activeContent.id ? 'ring-1 ring-primary' : ''}`}>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="flex-1">{content.title}</span>
                {done(content.id) ? <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Bajarilgan" /> : <Eye className="h-4 w-4 text-green-600" aria-hidden="true" />}
              </button>;
            })}
          </TabsContent>
          <TabsContent value="test" className="space-y-1.5 pt-3">
            {activeTests.length === 0 ? <p className="text-sm text-muted-foreground">Bu darsda test yo'q.</p> : activeTests.map((test) => (
              <button key={test.id} type="button" onClick={() => navigate("/student/tests")} className="flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm hover:bg-muted/50">
                <ClipboardCheck className="h-4 w-4 text-primary" /><span className="flex-1">{test.title}</span>
                <Badge variant={test.status === "completed" ? "default" : "outline"}>{test.status === "completed" ? `${test.score ?? 0}%` : `${test.questionCount} savol · ${test.duration} daq`}</Badge>
              </button>
            ))}
          </TabsContent>
          <TabsContent value="forum" className="pt-3"><CourseForum courseId={courseId} /></TabsContent>
        </Tabs>}

        {packages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{packages[0].title}</CardTitle>
              <CardDescription>{packages.length} ta SCORM paket · oxirgi tayyor paket ishga tushiriladi</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(`/course/${courseId}`)} className="gap-2"><PlayCircle className="h-4 w-4" />SCORM kursni ochish</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <Card className="shadow-none"><CardContent className="space-y-3 p-3">
          {progress && <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>{progress.progress}% · {progress.completedContents}/{progress.totalContents} tugallandi</span>
              <Badge variant={progress.status === "completed" ? "default" : "secondary"} className="h-5 text-[10px]">{progress.progress}%</Badge></div>
            <Progress value={progress.progress} className="h-1.5" />
          </div>}
          {contents.length > 0 && <nav aria-label="Darslar" className="space-y-2">
            {groups.map((group, groupIndex) => {
              const key = `${groupIndex}-${group.name ?? ""}`;
              const expanded = !collapsed.has(key);
              return <section key={key} aria-label={group.name ?? undefined} className="overflow-hidden rounded-lg border bg-background">
                {group.name && <button type="button" aria-expanded={expanded} onClick={() => toggleGroup(key)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/40">
                  <Layers className="h-4 w-4 text-primary" /><span className="flex-1">{group.name}</span>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>}
                {expanded && <div className="space-y-2 px-2 pb-2">
                  {sectionsOf(group.items).map((section) => (
                    <div key={section.moduleId} role="group" aria-label={section.title} className="space-y-1">
                      <p className="px-1 pt-1 text-xs font-medium text-muted-foreground">{section.title}</p>
                      {section.items.map((content) => {
                        const index = contents.indexOf(content);
                        const current = content.id === activeContent?.id;
                        return <button key={content.id} type="button" aria-current={current ? 'step' : undefined} onClick={() => selectLesson(index)}
                          className={`flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs ${current ? 'border-primary bg-primary/5 font-medium text-primary' : 'hover:bg-muted/50'}`}>
                          {done(content.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="Bajarilgan" /> : <span className="text-muted-foreground">{index + 1}.</span>}
                          <span className="flex-1">{content.title}</span>
                          {content.durationMinutes ? <span className="text-muted-foreground">{content.durationMinutes} daq</span> : null}
                        </button>;
                      })}
                      {lessonTests(section.moduleId).map((test) => (
                        <button key={`test-${test.id}`} type="button" onClick={() => navigate("/student/tests")}
                          className="flex w-full items-center gap-2 rounded-md border border-dashed px-2.5 py-2 text-left text-xs hover:bg-muted/50">
                          <ClipboardCheck className="h-4 w-4 shrink-0 text-primary" />
                          <span className="flex-1">{test.title}</span>
                          <Badge variant={test.status === "completed" ? "default" : "outline"} className="text-[10px]">
                            {test.status === "completed" ? `${test.score ?? 0}%` : `Test · ${test.questionCount} savol`}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>}
              </section>;
            })}
          </nav>}
        </CardContent></Card>
      </aside>
    </div>
  );
}
