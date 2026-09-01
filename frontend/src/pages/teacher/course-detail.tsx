import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  BookOpen,
  ClipboardList,
  ChevronDown,
  DollarSign,
  Download,
  Edit,
  FileText,
  FlaskConical,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  History,
  Loader2,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  Users,
  Video,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LazyRichTextEditor } from "@/components/editor/lazy-rich-text-editor";
import { isRichTextEmpty, richTextToPlainText } from "@/components/editor/rich-text-utils";
import { FileDropzone } from "@/components/file-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CourseForum } from "@/components/course-forum";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  teacherPortalApi,
  type CourseContent,
  type CourseModule,
} from "@/services/api/teacher-portal-api";

const CONTENT_META: Record<
  string,
  { icon: ElementType; label: string; className: string }
> = {
  video: { icon: Video, label: "Video", className: "text-red-500" },
  document: { icon: FileText, label: "Hujjat", className: "text-red-700" },
  link: { icon: LinkIcon, label: "Havola", className: "text-blue-600" },
  file: { icon: FileText, label: "Fayl", className: "text-slate-500" },
  text: { icon: FileText, label: "Matn", className: "text-emerald-600" },
};

type ItemStatus = "DRAFT" | "PUBLISHED";
type ContentType = "VIDEO" | "DOCUMENT" | "LINK" | "FILE" | "TEXT";
const today = () => {
  const value = new Date();
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
};

export function TeacherCourseDetail({
  defaultTab = "overview",
}: {
  defaultTab?: string;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const courseId = id ?? "";

  const [studentIds, setStudentIds] = useState("");
  const currentYear = new Date().getFullYear();
  const academicYearStart =
    new Date().getMonth() >= 8 ? currentYear : currentYear - 1;
  const [enrollmentAcademicYear, setEnrollmentAcademicYear] = useState(
    `${academicYearStart}-${academicYearStart + 1}`,
  );
  const [enrollmentSemester, setEnrollmentSemester] = useState("1");
  const [enrollmentCredits, setEnrollmentCredits] = useState("0");
  const [enrollmentRequired, setEnrollmentRequired] = useState("true");
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentAssetId, setContentAssetId] = useState<number | null>(null);
  const [contentAssetName, setContentAssetName] = useState("");
  const [downloadingContentId, setDownloadingContentId] = useState<
    number | null
  >(null);
  const [contentType, setContentType] = useState<ContentType>("LINK");
  const [contentModuleId, setContentModuleId] = useState("");
  const [contentLanguage, setContentLanguage] = useState("uz");
  const [contentAuthor, setContentAuthor] = useState("");
  const [contentVersion, setContentVersion] = useState("1.0");
  const [contentSourceName, setContentSourceName] = useState("");
  const [contentSourceUrl, setContentSourceUrl] = useState("");
  const [contentValidFrom, setContentValidFrom] = useState(today());
  const [contentValidUntil, setContentValidUntil] = useState("");
  const [contentDuration, setContentDuration] = useState("");
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const [historyContent, setHistoryContent] = useState<CourseContent | null>(
    null,
  );
  const [bankModuleId, setBankModuleId] = useState("");
  const [bankMaterialId, setBankMaterialId] = useState("");

  const courseQuery = useQuery({
    queryKey: ["teacher", "course", courseId],
    queryFn: () => teacherPortalApi.getCourse(courseId),
    enabled: Boolean(courseId),
  });
  const profileQuery = useQuery({
    queryKey: ["teacher", "profile"],
    queryFn: teacherPortalApi.getProfile,
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
  const contentsQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "contents"],
    queryFn: () => teacherPortalApi.getContents(courseId),
    enabled: Boolean(courseId),
  });
  const subjectMaterialsQuery = useQuery({
    queryKey: ["teacher", "subject-materials"],
    queryFn: teacherPortalApi.getSubjectMaterials,
  });
  const revisionsQuery = useQuery({
    queryKey: [
      "teacher",
      "course",
      courseId,
      "contents",
      historyContent?.id,
      "revisions",
    ],
    queryFn: () =>
      teacherPortalApi.getContentRevisions(courseId, historyContent!.id),
    enabled: Boolean(courseId && historyContent),
  });
  const reviewsQuery = useQuery({
    queryKey: [
      "teacher",
      "course",
      courseId,
      "contents",
      historyContent?.id,
      "reviews",
    ],
    queryFn: () =>
      teacherPortalApi.getContentReviews(courseId, historyContent!.id),
    enabled: Boolean(courseId && historyContent),
  });

  const refreshCourse = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId],
      }),
      queryClient.invalidateQueries({ queryKey: ["teacher", "courses"] }),
    ]);
  const refreshEnrollments = () =>
    Promise.all([
      refreshCourse(),
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId, "enrollments"],
      }),
    ]);
  const refreshLearningItems = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId, "modules"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId, "contents"],
      }),
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
  const updateCourseMutation = useMutation({
    mutationFn: () =>
      teacherPortalApi.updateCourse(courseId, {
        title: courseTitle.trim(),
        description: courseDescription.trim(),
      }),
    onSuccess: async () => {
      setEditingCourse(false);
      await refreshCourse();
      toast({ title: "Kurs yangilandi" });
    },
    onError: showError("Kurs yangilanmadi"),
  });
  const enrollMutation = useMutation({
    mutationFn: (ids: number[]) =>
      teacherPortalApi.enrollStudents(courseId, ids, {
        academicYear: enrollmentAcademicYear,
        semester: Number(enrollmentSemester),
        credits: Number(enrollmentCredits),
        required: enrollmentRequired === "true",
      }),
    onSuccess: async () => {
      setStudentIds("");
      await refreshEnrollments();
      toast({ title: "Talabalar biriktirildi" });
    },
    onError: showError("Talabalar biriktirilmadi"),
  });
  const withdrawMutation = useMutation({
    mutationFn: (studentId: number) =>
      teacherPortalApi.withdrawStudent(courseId, studentId),
    onSuccess: async () => {
      await refreshEnrollments();
      toast({ title: "Talaba kursdan chiqarildi" });
    },
    onError: showError("Talaba chiqarilmadi"),
  });
  const saveModuleMutation = useMutation({
    mutationFn: () =>
      editingModuleId
        ? teacherPortalApi.updateModule(courseId, editingModuleId, {
            title: moduleTitle.trim(),
          })
        : teacherPortalApi.createModule(courseId, {
            title: moduleTitle.trim(),
          }),
    onSuccess: async () => {
      setModuleTitle("");
      setEditingModuleId(null);
      await refreshLearningItems();
      toast({
        title: editingModuleId ? "Modul yangilandi" : "Modul yaratildi",
      });
    },
    onError: showError("Modul saqlanmadi"),
  });
  const moduleStatusMutation = useMutation({
    mutationFn: ({
      moduleId,
      status,
    }: {
      moduleId: number;
      status: ItemStatus;
    }) => teacherPortalApi.updateModuleStatus(courseId, moduleId, status),
    onSuccess: async () => {
      await refreshLearningItems();
    },
    onError: showError("Modul holati yangilanmadi"),
  });
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: number) =>
      teacherPortalApi.deleteModule(courseId, moduleId),
    onSuccess: async () => {
      await refreshLearningItems();
      toast({ title: "Modul o'chirildi" });
    },
    onError: showError("Modul o'chirilmadi"),
  });
  const saveContentMutation = useMutation({
    mutationFn: async () => {
      const uploadedAsset = contentFile
        ? await teacherPortalApi.uploadContentAsset(courseId, contentFile)
        : null;
      const assetId = uploadedAsset?.id ?? contentAssetId ?? undefined;
      const payload = {
        title: contentTitle.trim(),
        description: contentDescription.trim() || undefined,
        contentType,
        contentUrl:
          contentType === "TEXT" || assetId
            ? undefined
            : contentUrl.trim() || undefined,
        contentBody: contentType === "TEXT" ? contentBody.trim() : undefined,
        assetId:
          contentType === "TEXT" || contentType === "LINK"
            ? undefined
            : assetId,
        durationMinutes: contentDuration ? Number(contentDuration) : undefined,
        languageCode: contentLanguage.trim(),
        authorName: contentAuthor.trim(),
        contentVersion: contentVersion.trim(),
        sourceName: contentSourceName.trim(),
        sourceUrl: contentSourceUrl.trim() || undefined,
        validFrom: contentValidFrom,
        validUntil: contentValidUntil || undefined,
      };
      if (editingContentId)
        return teacherPortalApi.updateContent(
          courseId,
          editingContentId,
          payload,
        );
      return teacherPortalApi.createContent(
        courseId,
        Number(contentModuleId),
        payload,
      );
    },
    onSuccess: async () => {
      setLessonDialogOpen(false);
      resetContentForm();
      await refreshLearningItems();
      toast({
        title: editingContentId ? "Dars yangilandi" : "Dars yaratildi",
      });
    },
    onError: showError("Dars saqlanmadi"),
  });
  const attachMaterialMutation = useMutation({
    mutationFn: () =>
      teacherPortalApi.attachSubjectMaterial(
        courseId,
        Number(bankModuleId),
        Number(bankMaterialId),
      ),
    onSuccess: async () => {
      setBankMaterialId("");
      await refreshLearningItems();
      toast({ title: "Fan materiali modulga biriktirildi" });
    },
    onError: showError("Fan materiali biriktirilmadi"),
  });
  const reorderContentsMutation = useMutation({
    mutationFn: ({
      moduleId,
      contentIds,
    }: {
      moduleId: number;
      contentIds: number[];
    }) => teacherPortalApi.reorderContents(courseId, moduleId, contentIds),
    onSuccess: async () => {
      await refreshLearningItems();
      toast({ title: "Darslar tartibi saqlandi" });
    },
    onError: showError("Darslar tartibi saqlanmadi"),
  });
  const contentStatusMutation = useMutation({
    mutationFn: ({
      contentId,
      status,
    }: {
      contentId: number;
      status: ItemStatus;
    }) => teacherPortalApi.updateContentStatus(courseId, contentId, status),
    onSuccess: async () => {
      await refreshLearningItems();
    },
    onError: showError("Kontent holati yangilanmadi"),
  });
  const submitReviewMutation = useMutation({
    mutationFn: (contentId: number) =>
      teacherPortalApi.submitContentReview(courseId, contentId),
    onSuccess: async () => {
      await refreshLearningItems();
      toast({ title: "Kontent ekspertizaga yuborildi" });
    },
    onError: showError("Kontent ekspertizaga yuborilmadi"),
  });
  const deleteContentMutation = useMutation({
    mutationFn: (contentId: number) =>
      teacherPortalApi.deleteContent(courseId, contentId),
    onSuccess: async () => {
      await refreshLearningItems();
      toast({ title: "Kontent o'chirildi" });
    },
    onError: showError("Kontent o'chirilmadi"),
  });

  function showError(title: string) {
    return (cause: Error) =>
      toast({
        variant: "destructive",
        title,
        description: cause instanceof Error ? cause.message : undefined,
      });
  }

  function resetContentForm() {
    setContentTitle("");
    setContentDescription("");
    setContentUrl("");
    setContentBody("");
    setContentFile(null);
    setContentAssetId(null);
    setContentAssetName("");
    setContentType("LINK");
    setContentModuleId("");
    setContentLanguage(courseQuery.data?.language || "uz");
    setContentAuthor(profileQuery.data?.fullName || "");
    setContentVersion("1.0");
    setContentSourceName("");
    setContentSourceUrl("");
    setContentValidFrom(today());
    setContentValidUntil("");
    setContentDuration("");
    setEditingContentId(null);
  }

  function enrollStudents() {
    const ids = [
      ...new Set(
        studentIds
          .split(/[\s,;]+/)
          .filter(Boolean)
          .map(Number),
      ),
    ].filter((value) => Number.isInteger(value) && value > 0);
    if (!ids.length)
      return toast({
        variant: "destructive",
        title: "Talaba IDlarini kiriting",
      });
    enrollMutation.mutate(ids);
  }

  function saveModule() {
    if (!moduleTitle.trim())
      return toast({ variant: "destructive", title: "Modul nomini kiriting" });
    saveModuleMutation.mutate();
  }

  function saveContent() {
    if (
      !contentTitle.trim() ||
      (!editingContentId && !contentModuleId) ||
      !contentLanguage.trim() ||
      !contentAuthor.trim() ||
      !contentVersion.trim() ||
      !contentSourceName.trim() ||
      !contentValidFrom
    ) {
      return toast({
        variant: "destructive",
        title: "Majburiy kontent metadata maydonlarini kiriting",
      });
    }
    if (contentValidUntil && contentValidUntil < contentValidFrom) {
      return toast({
        variant: "destructive",
        title:
          "Amal qilish yakuni boshlanish sanasidan oldin bo'lmasligi kerak",
      });
    }
    if (
      contentDuration &&
      (!Number.isInteger(Number(contentDuration)) || Number(contentDuration) < 0)
    ) {
      return toast({
        variant: "destructive",
        title: "Dars davomiyligi 0 yoki undan katta butun son bo'lishi kerak",
      });
    }
    if (contentType === "TEXT" && isRichTextEmpty(contentBody)) {
      return toast({
        variant: "destructive",
        title: "Matnli dars mazmunini kiriting",
      });
    }
    if (contentType === "LINK" && !contentUrl.trim()) {
      return toast({ variant: "destructive", title: "Havolani kiriting" });
    }
    if (["VIDEO", "DOCUMENT", "FILE"].includes(contentType)) {
      if (!contentFile && !contentAssetId && !contentUrl.trim()) {
        return toast({
          variant: "destructive",
          title: "Fayl tanlang yoki URL kiriting",
        });
      }
      if ((contentFile || contentAssetId) && contentUrl.trim()) {
        return toast({
          variant: "destructive",
          title: "Fayl yoki URLdan faqat bittasini tanlang",
        });
      }
    }
    saveContentMutation.mutate();
  }

  function editModule(module: CourseModule) {
    setEditingModuleId(module.id);
    setModuleTitle(module.title);
  }

  function editContent(content: CourseContent) {
    setEditingContentId(content.id);
    setContentTitle(content.title);
    setContentDescription(content.description ?? "");
    setContentUrl(content.contentUrl ?? "");
    setContentBody(content.contentBody ?? "");
    setContentFile(null);
    setContentAssetId(content.asset?.id ?? null);
    setContentAssetName(content.asset?.originalFileName ?? "");
    setContentType(content.contentType.toUpperCase() as ContentType);
    setContentModuleId(String(content.moduleId));
    setContentLanguage(content.languageCode);
    setContentAuthor(content.authorName);
    setContentVersion(content.contentVersion);
    setContentSourceName(content.sourceName);
    setContentSourceUrl(content.sourceUrl ?? "");
    setContentValidFrom(content.validFrom);
    setContentValidUntil(content.validUntil ?? "");
    setContentDuration(
      content.durationMinutes == null ? "" : String(content.durationMinutes),
    );
    setLessonDialogOpen(true);
  }

  function startNewLesson(moduleId: number) {
    resetContentForm();
    setContentModuleId(String(moduleId));
    setContentType("VIDEO");
    setContentSourceName(courseQuery.data?.subjectName || "Mualliflik materiali");
    setLessonDialogOpen(true);
  }

  function selectContentFile(file: File | null) {
    if (file && file.size > 200 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Fayl hajmi 200 MB dan oshmasligi kerak",
      });
      return;
    }
    setContentFile(file);
    if (!file) {
      setContentAssetId(null);
      setContentAssetName("");
    } else {
      setContentUrl("");
      setContentAssetId(null);
      setContentAssetName("");
    }
  }

  async function downloadContent(content: CourseContent) {
    if (!content.asset) return;
    setDownloadingContentId(content.id);
    try {
      const blob = await teacherPortalApi.downloadContentFile(
        courseId,
        content.id,
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = content.asset.originalFileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      showError("Fayl yuklab olinmadi")(cause as Error);
    } finally {
      setDownloadingContentId(null);
    }
  }

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
  const contents = contentsQuery.data ?? [];
  const subjectMaterials = (subjectMaterialsQuery.data ?? []).filter(
    (material) => material.subjectId === course.subjectId,
  );
  const activeStudents = enrollments.filter(
    (item) => item.status === "active",
  ).length;
  const initialTab = defaultTab === "lessons" ? "contents" : defaultTab;
  const statusLabel =
    course.status === "published"
      ? "Faol"
      : course.status === "archived"
        ? "Arxivlangan"
        : "Qoralama";

  const moveContent = (
    moduleId: number,
    contentId: number,
    direction: -1 | 1,
  ) => {
    const orderedIds = contents
      .filter((content) => content.moduleId === moduleId)
      .map((content) => content.id);
    const currentIndex = orderedIds.indexOf(contentId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedIds.length)
      return;
    [orderedIds[currentIndex], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[currentIndex],
    ];
    reorderContentsMutation.mutate({ moduleId, contentIds: orderedIds });
  };

  const startCourseEdit = () => {
    setCourseTitle(course.title);
    setCourseDescription(course.description ?? "");
    setEditingCourse(true);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
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
          <Button variant="outline" onClick={startCourseEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            Tahrirlash
          </Button>
          {course.status === "draft" && (
            <Button onClick={() => courseStatusMutation.mutate("PUBLISHED")}>
              Nashr qilish
            </Button>
          )}
          {course.status === "published" && (
            <Button
              variant="outline"
              onClick={() => courseStatusMutation.mutate("ARCHIVED")}
            >
              Arxivlash
            </Button>
          )}
          {course.status === "archived" && (
            <Button
              variant="outline"
              onClick={() => courseStatusMutation.mutate("DRAFT")}
            >
              Qoralamaga qaytarish
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sectionlar", value: modules.length, color: "text-blue-600" },
          {
            label: "Darslar",
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

      <Tabs defaultValue={initialTab}>
        <div className="mb-5 flex flex-wrap gap-3 border-y py-4">
          <Button variant="default">Kurs ko'rinishi</Button>
          <Button variant="default" onClick={() => navigate(`/teacher/courses/${courseId}/contents`)}>Kurs playeri</Button>
          <Badge variant="secondary" className="px-4 py-2 text-sm">{statusLabel}</Badge>
          <Button variant="default">Tasdiqlash holati</Button>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <Card className="lg:sticky lg:top-5">
            <CardContent className="p-2">
              <TabsList className="flex h-auto w-full flex-col items-stretch bg-transparent p-0">
                <SideTab value="contents" icon={BookOpen} label="Curriculum" />
                <SideTab value="live" icon={Video} label="Live Class" />
                <SideTab value="assignment" icon={ClipboardList} label="Assignment" />
                <SideTab value="overview" icon={Settings} label="Basic" />
                <SideTab value="pricing" icon={DollarSign} label="Pricing" />
                <SideTab value="info" icon={Info} label="Info" />
                <SideTab value="media" icon={ImageIcon} label="Media" />
                <SideTab value="seo" icon={FlaskConical} label="SEO" />
                <SideTab value="students" icon={Users} label="Talabalar" />
                <SideTab value="forum" icon={LinkIcon} label="Forum" />
              </TabsList>
            </CardContent>
          </Card>
          <div className="min-w-0">

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Kurs holati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingCourse ? (
                <div className="space-y-3">
                  <Input
                    value={courseTitle}
                    onChange={(event) => setCourseTitle(event.target.value)}
                    placeholder="Kurs nomi"
                  />
                  <Input
                    value={courseDescription}
                    onChange={(event) =>
                      setCourseDescription(event.target.value)
                    }
                    placeholder="Kurs tavsifi"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setEditingCourse(false)}
                    >
                      Bekor qilish
                    </Button>
                    <Button
                      disabled={
                        !courseTitle.trim() || updateCourseMutation.isPending
                      }
                      onClick={() => updateCourseMutation.mutate()}
                    >
                      {updateCourseMutation.isPending
                        ? "Saqlanmoqda..."
                        : "Saqlash"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {course.description || "Kurs tavsifi kiritilmagan"}
                </p>
              )}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Kontent tayyorligi</span>
                  <span>
                    {contents.length
                      ? Math.round(
                          (contents.filter(
                            (item) => item.status === "published",
                          ).length /
                            contents.length) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    contents.length
                      ? (contents.filter((item) => item.status === "published")
                          .length /
                          contents.length) *
                        100
                      : 0
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contents" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fan darslari</CardTitle>
              <CardDescription>
                Avval section yarating, keyin uning ichiga video, matn yoki
                hujjat ko'rinishidagi darslarni qo'shing.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={moduleTitle}
                onChange={(event) => setModuleTitle(event.target.value)}
                placeholder="Section nomi, masalan: 1-mavzu. Kirish"
              />
              <Button
                onClick={saveModule}
                disabled={saveModuleMutation.isPending}
                className="gap-2 sm:shrink-0"
              >
                {saveModuleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editingModuleId ? "Sectionni yangilash" : "Section qo'shish"}
              </Button>
              {editingModuleId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingModuleId(null);
                    setModuleTitle("");
                  }}
                >
                  Bekor qilish
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Tayyor materialni biriktirish
              </CardTitle>
              <CardDescription>
                Fan kutubxonasidagi materialni section ichiga biriktiring.
                Fayl qayta yuklanmaydi.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 md:items-end">
              <Field label="Section *">
                <Select value={bankModuleId} onValueChange={setBankModuleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sectionni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={String(module.id)}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fan materiali *">
                <Select
                  value={bankMaterialId}
                  onValueChange={setBankMaterialId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Materialni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectMaterials.map((material) => (
                      <SelectItem
                        key={material.id}
                        value={String(material.id)}
                      >
                        {material.title} · {material.contentType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Button
                className="gap-2"
                disabled={
                  !bankModuleId ||
                  !bankMaterialId ||
                  attachMaterialMutation.isPending
                }
                onClick={() => attachMaterialMutation.mutate()}
              >
                {attachMaterialMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Biriktirish
              </Button>
              {!subjectMaterialsQuery.isLoading &&
                subjectMaterials.length === 0 && (
                  <p className="md:col-span-3 text-sm text-muted-foreground">
                    Bu fan uchun material yo'q. Avval “Fan materiallari”
                    bo'limida material yarating.
                  </p>
                )}
            </CardContent>
          </Card>
          {(modulesQuery.isLoading || contentsQuery.isLoading) && <Loading />}
          {!modulesQuery.isLoading && modules.length === 0 && (
            <Empty text="Dars qo'shish uchun avval section yarating" />
          )}
          {modules.map((module, sectionIndex) => {
            const sectionLessons = contents.filter(
              (content) => content.moduleId === module.id,
            );
            return (
              <Collapsible key={module.id} defaultOpen>
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                        {sectionIndex + 1}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">
                          {module.title}
                        </CardTitle>
                        <CardDescription>
                          {sectionLessons.length} ta dars
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          module.status === "published" ? "default" : "secondary"
                        }
                      >
                        {module.status === "published" ? "Nashrda" : "Qoralama"}
                      </Badge>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => startNewLesson(module.id)}
                      >
                        <Plus className="h-4 w-4" />
                        Dars qo'shish
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sectionni tahrirlash"
                        onClick={() => editModule(module)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          moduleStatusMutation.mutate({
                            moduleId: module.id,
                            status:
                              module.status === "published" ? "DRAFT" : "PUBLISHED",
                          })
                        }
                      >
                        {module.status === "published" ? "Yashirish" : "Nashr"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sectionni o'chirish"
                        className="text-destructive"
                        onClick={() => deleteModuleMutation.mutate(module.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Sectionni ochish yoki yopish">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                <CardContent className="space-y-2 p-3 sm:p-4">
                  {sectionLessons.length === 0 && (
                    <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                      Bu sectionda dars yo'q. “Dars qo'shish” tugmasini bosing.
                    </div>
                  )}
                  {sectionLessons.map((content, contentIndex) => {
            const meta = CONTENT_META[content.contentType] ?? CONTENT_META.file;
            const Icon = meta.icon;
            const modulePublished = module.status === "published";
            const validity = content.effective
              ? "Amalda"
              : content.validFrom > today()
                ? "Rejalashtirilgan"
                : "Muddati tugagan";
            const reviewLabel =
              content.reviewStatus === "approved"
                ? "Tasdiqlangan"
                : content.reviewStatus === "in_review"
                  ? "Ekspertizada"
                  : content.reviewStatus === "changes_requested"
                    ? "Tuzatishga qaytarilgan"
                    : "Ekspertizaga yuborilmagan";
            const compatible = content.compatibility.compatible;
            const compatibilityMessage = content.compatibility.issues
              .map((issue) => issue.message)
              .join("; ");
            return (
              <Card key={content.id}>
                <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-3">
                  <Icon className={`h-5 w-5 ${meta.className}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{content.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      #{content.position} · {meta.label} · v{content.contentVersion} ·{" "}
                      {content.languageCode} · {content.authorName}
                    </p>
                    {content.durationMinutes != null && (
                      <p className="text-xs text-muted-foreground">
                        Davomiyligi: {content.durationMinutes} daqiqa
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {content.sourceName} · {content.validFrom} —{" "}
                      {content.validUntil || "cheklanmagan"}
                    </p>
                    {content.asset && (
                      <p className="text-xs text-muted-foreground truncate">
                        {content.asset.originalFileName} · {formatBytes(content.asset.sizeBytes)}
                      </p>
                    )}
                    {content.contentBody && (
                      <p className="mt-1 text-sm line-clamp-2">{richTextToPlainText(content.contentBody)}</p>
                    )}
                    {!compatible && (
                      <p className="mt-2 text-xs text-destructive">
                        {compatibilityMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Darsni yuqoriga ko'chirish"
                      disabled={contentIndex === 0 || reorderContentsMutation.isPending}
                      onClick={() => moveContent(module.id, content.id, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Darsni pastga ko'chirish"
                      disabled={
                        contentIndex === sectionLessons.length - 1 ||
                        reorderContentsMutation.isPending
                      }
                      onClick={() => moveContent(module.id, content.id, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Badge variant="outline">{meta.label}</Badge>
                    <Badge
                      variant={content.effective ? "default" : "secondary"}
                    >
                      {validity}
                    </Badge>
                    <Badge variant={compatible ? "default" : "destructive"}>
                      {compatible ? "Til/dastur mos" : "Til/dastur nomos"}
                    </Badge>
                    <Badge
                      variant={
                        content.reviewStatus === "approved"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {reviewLabel}
                    </Badge>
                    <Badge
                      variant={
                        content.status === "published" ? "default" : "secondary"
                      }
                    >
                      {content.status === "published" ? "Nashrda" : "Qoralama"}
                    </Badge>
                    {content.asset && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        disabled={downloadingContentId === content.id}
                        onClick={() => void downloadContent(content)}
                      >
                        {downloadingContentId === content.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Yuklab olish
                      </Button>
                    )}
                    {content.contentUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={content.contentUrl} target="_blank" rel="noreferrer">
                          Ochish
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => setHistoryContent(content)}
                    >
                      <History className="h-4 w-4" />
                      Tarix
                    </Button>
                    {content.status === "draft" &&
                      ["draft", "changes_requested"].includes(
                        content.reviewStatus,
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            submitReviewMutation.isPending || !compatible
                          }
                          title={!compatible ? compatibilityMessage : undefined}
                          onClick={() =>
                            submitReviewMutation.mutate(content.id)
                          }
                        >
                          Ekspertizaga
                        </Button>
                      )}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={content.reviewStatus === "in_review"}
                      onClick={() => editContent(content)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        content.status === "draft" &&
                        (!modulePublished ||
                          content.reviewStatus !== "approved" ||
                          !compatible)
                      }
                      title={
                        !compatible
                          ? compatibilityMessage
                          : content.reviewStatus !== "approved"
                            ? "Avval mustaqil ekspert tasdig'ini oling"
                            : !modulePublished
                              ? "Avval modulni nashr qiling"
                              : undefined
                      }
                      onClick={() =>
                        contentStatusMutation.mutate({
                          contentId: content.id,
                          status:
                            content.status === "published"
                              ? "DRAFT"
                              : "PUBLISHED",
                        })
                      }
                    >
                      {content.status === "published" ? "Yashirish" : "Nashr"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={content.reviewStatus === "in_review"}
                      className="text-destructive"
                      onClick={() => deleteContentMutation.mutate(content.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
                    );
                  })}
                </CardContent>
                </CollapsibleContent>
              </Card>
              </Collapsible>
            );
          })}
        </TabsContent>

        <TabsContent value="students" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Talabani biriktirish
              </CardTitle>
              <CardDescription>
                {course.subjectGroupId
                  ? "Faqat shu fan-guruhga tegishli talabalar biriktiriladi; o'quv yili, semestr va kredit o'quv rejadan avtomatik olinadi."
                  : "Talaba profil IDlari bilan birga individual reja parametrlarini kiriting."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-2">
              <Input
                className="flex-1"
                value={studentIds}
                onChange={(event) => setStudentIds(event.target.value)}
                placeholder="Talaba IDlari: 12, 15"
                disabled={course.status === "archived"}
              />
              {course.subjectGroupId ? (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  {course.academicYear || "O'quv yili"} · {course.semester ?? "?"}-semestr · {course.credits ?? 0} kredit
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-[2]">
                  <Input value={enrollmentAcademicYear} onChange={(event) => setEnrollmentAcademicYear(event.target.value)} placeholder="2026-2027" disabled={course.status === "archived"} />
                  <Input type="number" min={1} max={20} value={enrollmentSemester} onChange={(event) => setEnrollmentSemester(event.target.value)} placeholder="Semestr" disabled={course.status === "archived"} />
                  <Input type="number" min={0} max={100} value={enrollmentCredits} onChange={(event) => setEnrollmentCredits(event.target.value)} placeholder="Kredit" disabled={course.status === "archived"} />
                  <Select value={enrollmentRequired} onValueChange={setEnrollmentRequired}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Majburiy</SelectItem><SelectItem value="false">Tanlov</SelectItem></SelectContent></Select>
                </div>
              )}
                <Button
                  onClick={enrollStudents}
                  disabled={
                    course.status === "archived" || enrollMutation.isPending
                  }
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Biriktirish
                </Button>
            </CardContent>
          </Card>
          {enrollmentsQuery.isLoading && <Loading />}
          {!enrollmentsQuery.isLoading && enrollments.length === 0 && (
            <Empty text="Hozircha talaba biriktirilmagan" />
          )}
          {enrollments.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{item.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.studentNumber} · ID {item.studentId} ·{" "}
                    {item.academicYear} · {item.semester}-semestr ·{" "}
                    {item.credits} kredit ·{" "}
                    {item.required ? "majburiy" : "tanlov"} · {item.progress}%
                  </p>
                </div>
                <Badge
                  variant={item.status === "active" ? "default" : "secondary"}
                >
                  {item.status === "active"
                    ? "Faol"
                    : item.status === "completed"
                      ? "Yakunlagan"
                      : "Chiqarilgan"}
                </Badge>
                {item.status === "active" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => withdrawMutation.mutate(item.studentId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="live" className="mt-0">
          <SettingsCard title="Live Class" description="Kurs uchun jonli darslar jadvali va videokonferensiya havolalari shu bo'limda boshqariladi.">
            <p className="text-sm text-muted-foreground">Jonli darsni qo'shish uchun kurs jadvalidagi videokonferensiya modulidan foydalaning.</p>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="assignment" className="mt-0">
          <SettingsCard title="Assignment" description="Kurs topshiriqlarini yaratish va tekshirish.">
            <Button onClick={() => navigate("/teacher/assignments/create")}><Plus className="mr-2 h-4 w-4" />Topshiriq yaratish</Button>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="pricing" className="mt-0">
          <SettingsCard title="Pricing" description="Kurs narxi va amal qilish muddati.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Summary label="Narxlash" value={course.paid ? "Pullik" : "Bepul"} />
              <Summary
                label="Narx"
                value={
                  course.paid
                    ? `${course.discountEnabled ? (course.discountedPrice ?? course.price ?? 0) : (course.price ?? 0)} so'm`
                    : "—"
                }
              />
              <Summary label="Chegirma" value={course.discountEnabled ? "Yoqilgan" : "O'chirilgan"} />
              <Summary label="Amal qilish" value={course.expiryPeriodType === "limited_time" ? "Cheklangan" : "Doimiy"} />
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="info" className="mt-0">
          <SettingsCard title="Info" description="Kursning akademik va katalog ma'lumotlari.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Summary label="Kategoriya" value={course.categoryName || "—"} />
              <Summary label="Fan" value={course.subjectName || "—"} />
              <Summary label="Dastur" value={course.programName || "—"} />
              <Summary label="Fan guruhi" value={course.groupName || "—"} />
              <Summary label="Til" value={(course.language || "—").toUpperCase()} />
              <Summary label="Daraja" value={course.level || "—"} />
              <Summary label="Drip content" value={course.dripContent ? "Yoqilgan" : "O'chirilgan"} />
              <Summary label="Davr" value={`${course.startDate || "—"} — ${course.endDate || "cheklanmagan"}`} />
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <SettingsCard title="Media" description="Kurs thumbnail va media holati.">
            {course.thumbnailAvailable ? <CourseThumbnail courseId={courseId} title={course.title} /> : <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Kurs rasmi yuklanmagan</div>}
          </SettingsCard>
        </TabsContent>

        <TabsContent value="seo" className="mt-0">
          <SettingsCard title="SEO" description="Qidiruv tizimlari uchun kurs metadata ma'lumotlari.">
            <div className="space-y-3">
              <Summary label="Kalit so'zlar" value={course.metaKeywords || "Kiritilmagan"} />
              <Summary label="Meta tavsif" value={course.metaDescription || "Kiritilmagan"} />
            </div>
          </SettingsCard>
        </TabsContent>

        <TabsContent value="forum" className="mt-4">
          <CourseForum courseId={courseId} />
        </TabsContent>
          </div>
        </div>
      </Tabs>
      <Dialog
        open={lessonDialogOpen}
        onOpenChange={(open) => {
          setLessonDialogOpen(open);
          if (!open) resetContentForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContentId ? "Darsni tahrirlash" : "Yangi dars qo'shish"}
            </DialogTitle>
            <DialogDescription>
              Sectionni tanlang, dars turini belgilang va materialni kiriting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Dars nomi *">
              <Input
                value={contentTitle}
                onChange={(event) => setContentTitle(event.target.value)}
                placeholder="Dars mavzusi"
              />
            </Field>
            <Field label="Section *">
              <Select
                value={contentModuleId}
                onValueChange={setContentModuleId}
                disabled={Boolean(editingContentId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sectionni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={String(module.id)}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Dars turi *" className="md:col-span-2">
              <Select
                value={contentType}
                onValueChange={(value) => {
                  setContentType(value as ContentType);
                  setContentFile(null);
                  setContentUrl("");
                  setContentAssetId(null);
                  setContentAssetName("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Video dars</SelectItem>
                  <SelectItem value="TEXT">Matnli dars va formula</SelectItem>
                  <SelectItem value="DOCUMENT">PDF yoki hujjat</SelectItem>
                  <SelectItem value="LINK">Tashqi havola</SelectItem>
                  <SelectItem value="FILE">Boshqa fayl</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {contentType === "TEXT" ? (
              <Field label="Dars matni *" className="md:col-span-2">
                <LazyRichTextEditor
                  value={contentBody}
                  onChange={setContentBody}
                  placeholder="Dars mazmunini yozing yoki MathType orqali formula kiriting..."
                />
              </Field>
            ) : contentType === "LINK" ? (
              <Field label="Dars havolasi *" className="md:col-span-2">
                <Input
                  value={contentUrl}
                  onChange={(event) => setContentUrl(event.target.value)}
                  placeholder="https://..."
                />
              </Field>
            ) : (
              <div className="space-y-4 md:col-span-2">
                <Field label={contentType === "VIDEO" ? "Video fayl" : "Fayl"}>
                  <FileDropzone
                    accept={
                      contentType === "VIDEO"
                        ? ".mp4,.webm"
                        : contentType === "DOCUMENT"
                          ? ".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                          : ".pdf,.txt,.csv,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.mp4,.webm"
                    }
                    file={contentFile}
                    existingFileName={contentAssetName || undefined}
                    hint={
                      contentType === "VIDEO"
                        ? "Videoni shu yerga tashlang yoki tanlang"
                        : "Faylni shu yerga tashlang yoki tanlang"
                    }
                    onFileChange={selectContentFile}
                  />
                </Field>
                <Field label="Yoki tashqi URL">
                  <Input
                    value={contentUrl}
                    disabled={Boolean(contentFile || contentAssetId)}
                    onChange={(event) => setContentUrl(event.target.value)}
                    placeholder="https://..."
                  />
                </Field>
              </div>
            )}
            <Field label="Til *">
              <Select value={contentLanguage} onValueChange={setContentLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbekcha</SelectItem>
                  <SelectItem value="ru">Ruscha</SelectItem>
                  <SelectItem value="en">Inglizcha</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={editingContentId ? "Yangi versiya *" : "Versiya *"}>
              <Input
                value={contentVersion}
                onChange={(event) => setContentVersion(event.target.value)}
                placeholder="1.0"
              />
            </Field>
            <Field label="Muallif *">
              <Input
                value={contentAuthor}
                onChange={(event) => setContentAuthor(event.target.value)}
              />
            </Field>
            <Field label="Manba nomi *">
              <Input
                value={contentSourceName}
                onChange={(event) => setContentSourceName(event.target.value)}
                placeholder={course.subjectName || "Mualliflik materiali"}
              />
            </Field>
            <Field label="Manba URL">
              <Input
                value={contentSourceUrl}
                onChange={(event) => setContentSourceUrl(event.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Amal qilish boshlanishi *">
              <Input
                type="date"
                value={contentValidFrom}
                onChange={(event) => setContentValidFrom(event.target.value)}
              />
            </Field>
            <Field label="Amal qilish yakuni">
              <Input
                type="date"
                min={contentValidFrom}
                value={contentValidUntil}
                onChange={(event) => setContentValidUntil(event.target.value)}
              />
            </Field>
            <Field label="Davomiyligi (daqiqa)">
              <Input
                type="number"
                min="0"
                step="1"
                value={contentDuration}
                onChange={(event) => setContentDuration(event.target.value)}
                placeholder="Masalan: 45"
              />
            </Field>
            <Field label="Qisqa tavsif" className="md:col-span-2">
              <Textarea
                value={contentDescription}
                onChange={(event) => setContentDescription(event.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setLessonDialogOpen(false);
                resetContentForm();
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={saveContent}
              disabled={saveContentMutation.isPending || modules.length === 0}
              className="gap-2"
            >
              {saveContentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingContentId ? "Yangi versiyani saqlash" : "Darsni saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(historyContent)}
        onOpenChange={(open) => {
          if (!open) setHistoryContent(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kontent versiyalari</DialogTitle>
            <DialogDescription>
              {historyContent?.title} uchun o'zgarmas tahrirlar tarixi.
            </DialogDescription>
          </DialogHeader>
          {revisionsQuery.isLoading && <Loading />}
          {revisionsQuery.error && (
            <p className="text-sm text-destructive">
              {revisionsQuery.error.message}
            </p>
          )}
          <div className="space-y-3">
            {(revisionsQuery.data ?? []).map((revision) => (
              <Card key={revision.id}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex justify-between gap-2">
                    <strong>
                      #{revision.revisionNumber} · v{revision.contentVersion}
                    </strong>
                    <span className="text-xs text-muted-foreground">
                      {new Date(revision.changedAt).toLocaleString("uz-UZ")}
                    </span>
                  </div>
                  <p className="text-sm">{revision.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {revision.languageCode} · {revision.authorName} ·{" "}
                    {revision.sourceName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {revision.validFrom} —{" "}
                    {revision.validUntil || "cheklanmagan"} · foydalanuvchi ID{" "}
                    {revision.changedBy}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <h3 className="pt-2 font-semibold">Ekspertiza qarorlari</h3>
          {reviewsQuery.isLoading && <Loading />}
          {reviewsQuery.error && (
            <p className="text-sm text-destructive">
              {reviewsQuery.error.message}
            </p>
          )}
          {(reviewsQuery.data ?? []).length === 0 &&
            !reviewsQuery.isLoading && (
              <p className="text-sm text-muted-foreground">
                Hali ekspertizaga yuborilmagan.
              </p>
            )}
          <div className="space-y-3">
            {(reviewsQuery.data ?? []).map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex justify-between gap-2">
                    <strong>
                      Revision #{review.revisionNumber} · v
                      {review.contentVersion}
                    </strong>
                    <Badge
                      variant={
                        review.status === "approved" ? "default" : "secondary"
                      }
                    >
                      {review.status === "pending"
                        ? "Kutilmoqda"
                        : review.status === "approved"
                          ? "Tasdiqlangan"
                          : "Tuzatishga qaytarilgan"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Yuborildi:{" "}
                    {new Date(review.submittedAt).toLocaleString("uz-UZ")} · ID{" "}
                    {review.submittedBy}
                  </p>
                  {review.reviewedAt && (
                    <p className="text-xs text-muted-foreground">
                      Qaror:{" "}
                      {new Date(review.reviewedAt).toLocaleString("uz-UZ")} ·
                      ekspert ID {review.reviewedBy}
                    </p>
                  )}
                  {review.decisionComment && (
                    <p className="text-sm">{review.decisionComment}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loading() {
  return (
    <div className="py-8 flex justify-center">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
        {text}
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
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
      className="w-full justify-start gap-3 rounded-md border-l-4 border-transparent px-4 py-3 text-left data-[state=active]:border-primary data-[state=active]:bg-muted"
    >
      <Icon className="h-4 w-4" /> {label}
    </TabsTrigger>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function CourseThumbnail({ courseId, title }: { courseId: string; title: string }) {
  const thumbnailQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "thumbnail"],
    queryFn: () => teacherPortalApi.downloadCourseThumbnail(courseId),
  });
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!thumbnailQuery.data) return;
    const objectUrl = URL.createObjectURL(thumbnailQuery.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailQuery.data]);

  if (thumbnailQuery.isLoading) return <Loading />;
  if (thumbnailQuery.error) return <p className="text-sm text-destructive">Kurs rasmi yuklanmadi</p>;
  return url ? <img src={url} alt={title} className="max-h-80 w-full rounded-xl border object-cover" /> : null;
}
