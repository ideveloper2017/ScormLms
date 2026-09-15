import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { workspaceApi } from '@/services/api/workspace-api';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  FileText,
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
import { useToast } from "@/hooks/use-toast";
import { scormApi } from "@/services/api/scorm-api";
import { studyPlanApi } from "@/services/api/study-plan-api";
import { teacherPortalApi, type CourseContentAsset } from "@/services/api/teacher-portal-api";
import { CourseForum } from "@/components/course-forum";
import { LessonContentViewer } from "@/components/learning/lesson-content-viewer";

export function StudentCourseLearning() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const selectedContentId = Number(params.get('content'));
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
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
  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Kurslar ro‘yxatiga qaytish"
          onClick={() => navigate("/student/courses")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Kurs materiallari</h1>
          <p className="text-sm text-muted-foreground">
            Darsni tanlang, o‘qing va yakunlang
          </p>
        </div>
        {progress && (
          <Badge
            variant={progress.status === "completed" ? "default" : "secondary"}
          >
            {progress.progress}%
          </Badge>
        )}
      </div>
      {progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Fan progressi</span>
              <strong>{progress.progress}%</strong>
            </div>
            <Progress value={progress.progress} />
            <div className="mt-2 text-xs text-muted-foreground">
              Kontent {progress.completedContents}/{progress.totalContents} ·
              SCORM {progress.completedScormPackages}/
              {progress.totalScormPackages}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">O'quv kontenti</h2>
        {contents.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Hozir amal qilayotgan va nashr qilingan oddiy kontent yo'q.
            </CardContent>
          </Card>
        )}
        {contents.length > 0 && <nav aria-label="Darslar" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((content, index) => <button key={content.id} type="button"
            aria-current={content.id === activeContent?.id ? 'step' : undefined}
            onClick={() => selectLesson(index)}
            className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm ${content.id === activeContent?.id ? 'border-primary bg-primary/5 font-medium' : 'hover:bg-muted/50'}`}>
            {progress?.completedContentIds?.includes(content.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="Bajarilgan" /> : <span className="text-muted-foreground">{index + 1}.</span>}
            <span>{content.title}</span>
          </button>)}
        </nav>}
        {(activeContent ? [activeContent] : []).map((content) => (
          <Card key={content.id} id={`content-${content.id}`} className={selectedContentId === content.id ? 'scroll-mt-4 border-primary ring-1 ring-primary' : 'scroll-mt-4'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex flex-wrap items-center gap-2">
                <FileText className="h-4 w-4" />
                {content.title}

                <Badge variant="outline">v{content.contentVersion}</Badge>
              </CardTitle>
              <CardDescription>
                {content.moduleTitle}
                {content.durationMinutes
                  ? ` · ${content.durationMinutes} daqiqa`
                  : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {viewMutation.isError && <Button variant="outline" onClick={() => viewMutation.mutate(content.id)}>Davom ettirish uchun darsni qayta saqlash</Button>}
              <details className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                <summary className="cursor-pointer font-medium">Dars haqida: muallif va manba</summary>
                <p>
                  <span className="font-medium text-foreground">Muallif:</span>{" "}
                  {content.authorName} ·{" "}
                  <span className="font-medium text-foreground">Til:</span>{" "}
                  {content.languageCode}
                </p>
                <p>
                  <span className="font-medium text-foreground">Manba:</span>{" "}
                  {content.sourceName}
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Amal qilish davri:
                  </span>{" "}
                  {content.validFrom} — {content.validUntil || "cheklanmagan"}
                </p>
              </details>
              <LessonContentViewer courseId={String(courseId)} content={content} />
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                {content.asset && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={downloadingId === content.id}
                    onClick={() => void downloadContent(content.id, content.asset!)}
                  >
                    {downloadingId === content.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {content.asset.originalFileName}
                  </Button>
                )}
                <Button
                  onClick={() => completeMutation.mutate(content.id)}
                  disabled={completeMutation.isPending || progress?.completedContentIds?.includes(content.id)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {progress?.completedContentIds?.includes(content.id) ? 'Dars bajarilgan' : completeMutation.isPending ? 'Saqlanmoqda...' : 'Darsni yakunlash'}
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
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">SCORM paketlari</h2>
        {packages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Ushbu kursga SCORM paket biriktirilmagan.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{packages[0].title}</CardTitle>
              <CardDescription>
                {packages.length} ta SCORM paket · oxirgi tayyor paket ishga
                tushiriladi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate(`/course/${courseId}`)}
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                SCORM kursni ochish
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
      <section className="border-t pt-6">
        <CourseForum courseId={courseId} />
      </section>
    </div>
  );
}
