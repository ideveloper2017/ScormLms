import { useEffect, useState, type ElementType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2 as CheckCircleIcon,
  ClipboardList,
  CalendarDays,
  Edit,
  FlaskConical,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Loader2,
  Settings,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseForum } from "@/components/course-forum";
import { TeacherCourseCreate } from "./course-create";
import { CoursePreview } from "@/components/course-preview";
import { useToast } from "@/hooks/use-toast";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";
import { useConfirm } from "@/components/confirm-dialog";
import { ContentHistoryDialog } from "./course-detail/content-history-dialog";
import { ContentsTab } from "./course-detail/contents-tab";
import { LessonDialog } from "./course-detail/lesson-dialog";
import { OverviewTab } from "./course-detail/overview-tab";
import { ReviewsTab } from "./course-detail/reviews-tab";
import {
  AcademicInfoTab,
  AssignmentsTab,
  DurationTab,
  MediaTab,
  ScheduleTab,
  SeoTab,
} from "./course-detail/settings-tabs";
import { createShowError } from "./course-detail/shared";
import { StudentsTab } from "./course-detail/students-tab";
import { useContentsTab } from "./course-detail/use-contents-tab";
import { useStudentsTab } from "./course-detail/use-students-tab";

export function TeacherCourseDetail({
  defaultTab = "overview",
}: {
  defaultTab?: string;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm, confirmDialog } = useConfirm();
  const showError = createShowError(toast);
  const courseId = id ?? "";
  const requestedTab = ['lessons', 'modules'].includes(defaultTab) ? 'contents' : defaultTab;
  const [activeTab, setActiveTab] = useState(requestedTab);
  const [previewMode, setPreviewMode] = useState<'overview' | 'player' | null>(null);
  const [previewContentId, setPreviewContentId] = useState<number>();
  useEffect(() => { setActiveTab(requestedTab); setPreviewMode(null); }, [courseId, requestedTab]);
  const [editingCourse, setEditingCourse] = useState(false);

  const courseQuery = useQuery({
    queryKey: ["teacher", "course", courseId],
    queryFn: () => teacherPortalApi.getCourse(courseId),
    enabled: Boolean(courseId),
  });
  const enrollmentsQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "enrollments"],
    queryFn: () => teacherPortalApi.getEnrollments(courseId),
    enabled: Boolean(courseId),
  });
  const modulesQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "modules"],
    queryFn: () => teacherPortalApi.getModules(courseId),
    enabled: Boolean(courseId),
  });
  const unitsQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "units"],
    queryFn: () => teacherPortalApi.getUnits(courseId),
    enabled: Boolean(courseId),
  });
  const contentsQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "contents"],
    queryFn: () => teacherPortalApi.getContents(courseId),
    enabled: Boolean(courseId),
  });

  const refreshCourse = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId],
      }),
      queryClient.invalidateQueries({ queryKey: ["teacher", "courses"] }),
    ]);

  const courseStatusMutation = useMutation({
    mutationFn: (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") =>
      teacherPortalApi.updateCourseStatus(courseId, status),
    onSuccess: async () => {
      await refreshCourse();
      toast({ title: "Kurs holati yangilandi" });
    },
    onError: showError("Kurs holati yangilanmadi"),
  });

  // Tablarning holati va so'rovlari shu yerda (yuklanish/xato/tahrirlash ko'rinishlaridan oldin)
  // chaqiriladi: so'rovlar kurs so'rovi bilan birga ketadi, forma holati esa tab almashganda ham,
  // kursni tahrirlash oynasiga o'tib qaytganda ham saqlanadi.
  const contentsTab = useContentsTab({
    courseId,
    course: courseQuery.data,
    modules: modulesQuery.data ?? [],
    contents: contentsQuery.data ?? [],
    confirm,
  });
  const studentsTab = useStudentsTab({ courseId, refreshCourse });

  if (courseQuery.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Kurs yuklanmoqda...
      </div>
    );
  }
  const course = courseQuery.data;
  if (courseQuery.error || !course) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-destructive">
          {courseQuery.error?.message ?? "Kurs topilmadi"}
        </p>
        <Button variant="outline" onClick={() => navigate("/teacher/courses")}>
          Kurslarga qaytish
        </Button>
      </div>
    );
  }

  const enrollments = enrollmentsQuery.data ?? [];
  const modules = modulesQuery.data ?? [];
  const units = unitsQuery.data ?? [];
  const contents = contentsQuery.data ?? [];
  const activeStudents = enrollments.filter(
    (item) => item.status === "active",
  ).length;
  const statusLabel =
    course.status === "published"
      ? "Faol"
      : course.status === "archived"
        ? "Arxivlangan"
        : "Qoralama";

  const startCourseEdit = () => {
    setPreviewMode(null);
    setEditingCourse(true);
  };

  if (editingCourse) return <TeacherCourseCreate key={course.id} course={course}
    onSaved={() => { setEditingCourse(false); void refreshCourse(); }}
    onCancel={() => setEditingCourse(false)} />;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Kurslar ro'yxatiga qaytish"
          onClick={() => navigate("/teacher/courses")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <Badge
              variant={course.status === "published" ? "default" : "secondary"}
            >
              {statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {course.subjectName || "Fan ko'rsatilmagan"} ·{" "}
            {course.programName || "Dastur biriktirilmagan"} ·{" "}
            {course.language || "til yo'q"} ·{" "}
            {course.groupName || "Guruh biriktirilmagan"} · {activeStudents}{" "}
            talaba
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={course.status === "archived"} onClick={startCourseEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Tahrirlash
          </Button>
          {course.status === "draft" && (
            <Button disabled={courseStatusMutation.isPending} onClick={() => courseStatusMutation.mutate("PUBLISHED")}>
              Nashr qilish
            </Button>
          )}
          {course.status === "published" && (
            <Button
              variant="outline"
              disabled={courseStatusMutation.isPending}
              onClick={async () => {
                if (await confirm({ title: `“${course.title}” kursi arxivlansinmi?`, description: "Arxivlangan kursni tahrirlab bo'lmaydi. Keyin uni qoralamaga qaytarishingiz mumkin.", confirmLabel: "Arxivlash" }))
                  courseStatusMutation.mutate("ARCHIVED");
              }}
            >
              Arxivlash
            </Button>
          )}
          {course.status === "archived" && (
            <Button
              variant="outline"
              disabled={courseStatusMutation.isPending}
              onClick={() => courseStatusMutation.mutate("DRAFT")}
            >
              Qoralamaga qaytarish
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Modul / dars", value: `${units.length} / ${modules.length}`, color: "text-blue-600" },
          {
            label: "Materiallar",
            value: contents.length,
            color: "text-green-600",
          },
          {
            label: "Talabalar",
            value: activeStudents,
            color: "text-purple-600",
          },
          {
            label: "Nashr qilingan",
            value: contents.filter((item) => item.status === "published")
              .length,
            color: "text-amber-600",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${item.color}`}>
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex-col">
        <div className="mb-5 flex flex-wrap gap-3 border-y py-4">
          <Button variant="default" disabled={modulesQuery.isPending || contentsQuery.isPending || modulesQuery.isError || contentsQuery.isError} onClick={() => setPreviewMode('overview')}>Kurs ko'rinishi</Button>
          <Button variant="default" disabled={modulesQuery.isPending || contentsQuery.isPending || modulesQuery.isError || contentsQuery.isError} onClick={() => setPreviewMode('player')}>Kurs playeri</Button>
          <Badge variant="secondary" className="px-4 py-2 text-sm">{statusLabel}</Badge>
          <Button variant="default" onClick={() => setActiveTab('reviews')}>Tasdiqlash holati</Button>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <Card className="py-0 lg:sticky lg:top-5">
            <CardContent className="p-2">
              <TabsList aria-label="Kurs bo'limlari" className="flex h-auto w-full flex-col items-stretch bg-transparent p-0">
                <SideTab value="contents" icon={BookOpen} label="Darslar" />
                <SideTab value="live" icon={Video} label="Dars jadvali" />
                <SideTab value="assignment" icon={ClipboardList} label="Topshiriqlar" />
                <SideTab value="overview" icon={Settings} label="Asosiy ma'lumotlar" />
                <SideTab value="duration" icon={CalendarDays} label="Amal qilish muddati" />
                <SideTab value="info" icon={Info} label="Akademik ma'lumotlar" />
                <SideTab value="media" icon={ImageIcon} label="Kurs rasmi" />
                <SideTab value="seo" icon={FlaskConical} label="Qidiruv ma'lumotlari" />
                <SideTab value="students" icon={Users} label="Talabalar" />
                <SideTab value="forum" icon={LinkIcon} label="Forum" />
                <SideTab value="reviews" icon={CheckCircleIcon} label="Tasdiqlash holati" />
              </TabsList>
            </CardContent>
          </Card>
          <div className="min-w-0">
            <OverviewTab course={course} contents={contents} />
            <ContentsTab
              course={course}
              courseId={courseId}
              units={units}
              modulesQuery={modulesQuery}
              contentsQuery={contentsQuery}
              controller={contentsTab}
              confirm={confirm}
              onPreviewContent={(contentId) => { setPreviewContentId(contentId); setPreviewMode('player'); }}
            />
            <StudentsTab
              course={course}
              courseId={courseId}
              enrollmentsQuery={enrollmentsQuery}
              controller={studentsTab}
              confirm={confirm}
            />
            <ScheduleTab courseId={courseId} />
            <AssignmentsTab course={course} courseId={courseId} />
            <DurationTab course={course} />
            <AcademicInfoTab course={course} />
            <MediaTab course={course} courseId={courseId} />
            <SeoTab course={course} />
            <TabsContent value="forum" className="mt-4">
              <CourseForum courseId={courseId} />
            </TabsContent>
            <ReviewsTab contentsQuery={contentsQuery} setHistoryContent={contentsTab.setHistoryContent} />
          </div>
        </div>
      </Tabs>
      {previewMode && <CoursePreview mode={previewMode} initialContentId={previewContentId} course={course} units={units} modules={modules} contents={contents} onClose={() => { setPreviewMode(null); setPreviewContentId(undefined); }} onDownload={content => void contentsTab.downloadContent(content)} downloadingId={contentsTab.downloadingContentId} />}
      {/* Dialoglar tablardan tashqarida: qoralamadan tiklangan material dialogi istalgan tabda ochiladi */}
      <LessonDialog course={course} modules={modules} controller={contentsTab} />
      <ContentHistoryDialog controller={contentsTab} />
      {confirmDialog}
    </div>
  );
}

function SideTab({
  value,
  icon: Icon,
  label,
}: {
  value: string;
  icon: ElementType;
  label: string;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-auto w-full flex-none justify-start gap-3 rounded-md border-l-4 border-transparent px-4 py-3 text-left data-[state=active]:border-primary data-[state=active]:bg-muted"
    >
      <Icon className="h-4 w-4" /> {label}
    </TabsTrigger>
  );
}
