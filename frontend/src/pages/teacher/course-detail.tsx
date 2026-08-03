import { useState, type ElementType } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, BarChart3, BookOpen, Edit, FileText, Link as LinkIcon,
  Loader2, Plus, Trash2, UserPlus, Users, Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  teacherPortalApi,
  type CourseContent,
  type CourseModule,
} from "@/services/api/teacher-portal-api";

const CONTENT_META: Record<string, { icon: ElementType; label: string; className: string }> = {
  video: { icon: Video, label: "Video", className: "text-red-500" },
  document: { icon: FileText, label: "Hujjat", className: "text-red-700" },
  link: { icon: LinkIcon, label: "Havola", className: "text-blue-600" },
  file: { icon: FileText, label: "Fayl", className: "text-slate-500" },
};

type ItemStatus = "DRAFT" | "PUBLISHED";
type ContentType = "VIDEO" | "DOCUMENT" | "LINK" | "FILE";

export function TeacherCourseDetail({ defaultTab = "overview" }: { defaultTab?: string }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const courseId = id ?? "";

  const [studentIds, setStudentIds] = useState("");
  const currentYear = new Date().getFullYear();
  const academicYearStart = new Date().getMonth() >= 8 ? currentYear : currentYear - 1;
  const [enrollmentAcademicYear, setEnrollmentAcademicYear] = useState(`${academicYearStart}-${academicYearStart + 1}`);
  const [enrollmentSemester, setEnrollmentSemester] = useState("1");
  const [enrollmentCredits, setEnrollmentCredits] = useState("0");
  const [enrollmentRequired, setEnrollmentRequired] = useState("true");
  const [editingCourse, setEditingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [contentTitle, setContentTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [contentType, setContentType] = useState<ContentType>("LINK");
  const [contentModuleId, setContentModuleId] = useState("");
  const [editingContentId, setEditingContentId] = useState<number | null>(null);

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
  const contentsQuery = useQuery({
    queryKey: ["teacher", "course", courseId, "contents"],
    queryFn: () => teacherPortalApi.getContents(courseId),
    enabled: Boolean(courseId),
  });

  const refreshCourse = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId] }),
    queryClient.invalidateQueries({ queryKey: ["teacher", "courses"] }),
  ]);
  const refreshEnrollments = () => Promise.all([
    refreshCourse(),
    queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId, "enrollments"] }),
  ]);
  const refreshLearningItems = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId, "modules"] }),
    queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId, "contents"] }),
  ]);

  const courseStatusMutation = useMutation({
    mutationFn: (status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => teacherPortalApi.updateCourseStatus(courseId, status),
    onSuccess: async () => { await refreshCourse(); toast({ title: "Kurs holati yangilandi" }); },
    onError: showError("Kurs holati yangilanmadi"),
  });
  const updateCourseMutation = useMutation({
    mutationFn: () => teacherPortalApi.updateCourse(courseId, {
      title: courseTitle.trim(),
      description: courseDescription.trim(),
    }),
    onSuccess: async () => {
      setEditingCourse(false); await refreshCourse(); toast({ title: "Kurs yangilandi" });
    },
    onError: showError("Kurs yangilanmadi"),
  });
  const enrollMutation = useMutation({
    mutationFn: (ids: number[]) => teacherPortalApi.enrollStudents(courseId, ids, {
      academicYear: enrollmentAcademicYear,
      semester: Number(enrollmentSemester),
      credits: Number(enrollmentCredits),
      required: enrollmentRequired === "true",
    }),
    onSuccess: async () => { setStudentIds(""); await refreshEnrollments(); toast({ title: "Talabalar biriktirildi" }); },
    onError: showError("Talabalar biriktirilmadi"),
  });
  const withdrawMutation = useMutation({
    mutationFn: (studentId: number) => teacherPortalApi.withdrawStudent(courseId, studentId),
    onSuccess: async () => { await refreshEnrollments(); toast({ title: "Talaba kursdan chiqarildi" }); },
    onError: showError("Talaba chiqarilmadi"),
  });
  const saveModuleMutation = useMutation({
    mutationFn: () => editingModuleId
      ? teacherPortalApi.updateModule(courseId, editingModuleId, { title: moduleTitle.trim() })
      : teacherPortalApi.createModule(courseId, { title: moduleTitle.trim() }),
    onSuccess: async () => {
      setModuleTitle(""); setEditingModuleId(null); await refreshLearningItems();
      toast({ title: editingModuleId ? "Modul yangilandi" : "Modul yaratildi" });
    },
    onError: showError("Modul saqlanmadi"),
  });
  const moduleStatusMutation = useMutation({
    mutationFn: ({ moduleId, status }: { moduleId: number; status: ItemStatus }) =>
      teacherPortalApi.updateModuleStatus(courseId, moduleId, status),
    onSuccess: async () => { await refreshLearningItems(); },
    onError: showError("Modul holati yangilanmadi"),
  });
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: number) => teacherPortalApi.deleteModule(courseId, moduleId),
    onSuccess: async () => { await refreshLearningItems(); toast({ title: "Modul o'chirildi" }); },
    onError: showError("Modul o'chirilmadi"),
  });
  const saveContentMutation = useMutation({
    mutationFn: () => {
      const payload = { title: contentTitle.trim(), contentType, contentUrl: contentUrl.trim() || undefined };
      if (editingContentId) return teacherPortalApi.updateContent(courseId, editingContentId, payload);
      return teacherPortalApi.createContent(courseId, Number(contentModuleId), payload);
    },
    onSuccess: async () => {
      resetContentForm(); await refreshLearningItems();
      toast({ title: editingContentId ? "Kontent yangilandi" : "Kontent yaratildi" });
    },
    onError: showError("Kontent saqlanmadi"),
  });
  const contentStatusMutation = useMutation({
    mutationFn: ({ contentId, status }: { contentId: number; status: ItemStatus }) =>
      teacherPortalApi.updateContentStatus(courseId, contentId, status),
    onSuccess: async () => { await refreshLearningItems(); },
    onError: showError("Kontent holati yangilanmadi"),
  });
  const deleteContentMutation = useMutation({
    mutationFn: (contentId: number) => teacherPortalApi.deleteContent(courseId, contentId),
    onSuccess: async () => { await refreshLearningItems(); toast({ title: "Kontent o'chirildi" }); },
    onError: showError("Kontent o'chirilmadi"),
  });

  function showError(title: string) {
    return (cause: Error) => toast({ variant: "destructive", title, description: cause instanceof Error ? cause.message : undefined });
  }

  function resetContentForm() {
    setContentTitle(""); setContentUrl(""); setContentType("LINK"); setContentModuleId(""); setEditingContentId(null);
  }

  function enrollStudents() {
    const ids = [...new Set(studentIds.split(/[\s,;]+/).filter(Boolean).map(Number))]
      .filter(value => Number.isInteger(value) && value > 0);
    if (!ids.length) return toast({ variant: "destructive", title: "Talaba IDlarini kiriting" });
    enrollMutation.mutate(ids);
  }

  function saveModule() {
    if (!moduleTitle.trim()) return toast({ variant: "destructive", title: "Modul nomini kiriting" });
    saveModuleMutation.mutate();
  }

  function saveContent() {
    if (!contentTitle.trim() || (!editingContentId && !contentModuleId)) {
      return toast({ variant: "destructive", title: "Modul va kontent nomini kiriting" });
    }
    saveContentMutation.mutate();
  }

  function editModule(module: CourseModule) {
    setEditingModuleId(module.id); setModuleTitle(module.title);
  }

  function editContent(content: CourseContent) {
    setEditingContentId(content.id); setContentTitle(content.title); setContentUrl(content.contentUrl ?? "");
    setContentType(content.contentType.toUpperCase() as ContentType); setContentModuleId(String(content.moduleId));
  }

  if (courseQuery.isLoading) {
    return <div className="p-8 flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Kurs yuklanmoqda...</div>;
  }
  const course = courseQuery.data;
  if (courseQuery.error || !course) {
    return <div className="p-8 text-center space-y-3"><p className="text-destructive">{courseQuery.error?.message ?? "Kurs topilmadi"}</p><Button variant="outline" onClick={() => navigate("/teacher/courses")}>Kurslarga qaytish</Button></div>;
  }

  const enrollments = enrollmentsQuery.data ?? [];
  const modules = modulesQuery.data ?? [];
  const contents = contentsQuery.data ?? [];
  const activeStudents = enrollments.filter(item => item.status === "active").length;
  const initialTab = defaultTab === "lessons" ? "contents" : defaultTab;
  const statusLabel = course.status === "published" ? "Faol" : course.status === "archived" ? "Arxivlangan" : "Qoralama";

  const startCourseEdit = () => {
    setCourseTitle(course.title);
    setCourseDescription(course.description ?? "");
    setEditingCourse(true);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher/courses")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap"><h1 className="text-2xl font-bold">{course.title}</h1><Badge variant={course.status === "published" ? "default" : "secondary"}>{statusLabel}</Badge></div>
          <p className="text-sm text-muted-foreground">{course.subjectName || "Fan ko'rsatilmagan"} · {course.groupName || "Guruh biriktirilmagan"} · {activeStudents} talaba</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startCourseEdit} className="gap-2"><Edit className="h-4 w-4" />Tahrirlash</Button>
          {course.status === "draft" && <Button onClick={() => courseStatusMutation.mutate("PUBLISHED")}>Nashr qilish</Button>}
          {course.status === "published" && <Button variant="outline" onClick={() => courseStatusMutation.mutate("ARCHIVED")}>Arxivlash</Button>}
          {course.status === "archived" && <Button variant="outline" onClick={() => courseStatusMutation.mutate("DRAFT")}>Qoralamaga qaytarish</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Modullar", value: modules.length, color: "text-blue-600" },
          { label: "Kontentlar", value: contents.length, color: "text-green-600" },
          { label: "Talabalar", value: activeStudents, color: "text-purple-600" },
          { label: "Nashr qilingan", value: contents.filter(item => item.status === "published").length, color: "text-amber-600" },
        ].map(item => <Card key={item.label}><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">{item.label}</CardTitle></CardHeader><CardContent><div className={`text-2xl font-bold ${item.color}`}>{item.value}</div></CardContent></Card>)}
      </div>

      <Tabs defaultValue={initialTab}>
        <div className="overflow-x-auto"><TabsList className="grid min-w-[420px] w-full grid-cols-4"><TabsTrigger value="overview">Umumiy</TabsTrigger><TabsTrigger value="modules">Modullar</TabsTrigger><TabsTrigger value="contents">Kontent</TabsTrigger><TabsTrigger value="students">Talabalar</TabsTrigger></TabsList></div>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Kurs holati</CardTitle></CardHeader><CardContent className="space-y-4">{editingCourse ? <div className="space-y-3"><Input value={courseTitle} onChange={event => setCourseTitle(event.target.value)} placeholder="Kurs nomi" /><Input value={courseDescription} onChange={event => setCourseDescription(event.target.value)} placeholder="Kurs tavsifi" /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditingCourse(false)}>Bekor qilish</Button><Button disabled={!courseTitle.trim() || updateCourseMutation.isPending} onClick={() => updateCourseMutation.mutate()}>{updateCourseMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}</Button></div></div> : <p className="text-sm text-muted-foreground">{course.description || "Kurs tavsifi kiritilmagan"}</p>}<div><div className="flex justify-between text-sm mb-2"><span>Kontent tayyorligi</span><span>{contents.length ? Math.round(contents.filter(item => item.status === "published").length / contents.length * 100) : 0}%</span></div><Progress value={contents.length ? contents.filter(item => item.status === "published").length / contents.length * 100 : 0} /></div></CardContent></Card>
        </TabsContent>

        <TabsContent value="modules" className="mt-4 space-y-3">
          <Card><CardContent className="pt-6 flex flex-col sm:flex-row gap-2"><Input value={moduleTitle} onChange={event => setModuleTitle(event.target.value)} placeholder="Modul nomi" /><Button onClick={saveModule} disabled={saveModuleMutation.isPending} className="gap-2">{saveModuleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingModuleId ? "Yangilash" : "Modul qo'shish"}</Button>{editingModuleId && <Button variant="ghost" onClick={() => { setEditingModuleId(null); setModuleTitle(""); }}>Bekor qilish</Button>}</CardContent></Card>
          {modulesQuery.isLoading && <Loading />}
          {!modulesQuery.isLoading && modules.length === 0 && <Empty text="Hozircha modul yaratilmagan" />}
          {modules.map((module, index) => <Card key={module.id}><CardContent className="p-4 flex items-center gap-3"><div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{index + 1}</div><div className="flex-1"><p className="font-medium">{module.title}</p><p className="text-xs text-muted-foreground">{module.contentCount} kontent · tartib {module.position}</p></div><Badge variant={module.status === "published" ? "default" : "secondary"}>{module.status === "published" ? "Nashrda" : "Qoralama"}</Badge><Button variant="ghost" size="icon" onClick={() => editModule(module)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => moduleStatusMutation.mutate({ moduleId: module.id, status: module.status === "published" ? "DRAFT" : "PUBLISHED" })}>{module.status === "published" ? "Yashirish" : "Nashr"}</Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteModuleMutation.mutate(module.id)}><Trash2 className="h-4 w-4" /></Button></CardContent></Card>)}
        </TabsContent>

        <TabsContent value="contents" className="mt-4 space-y-3">
          <Card><CardHeader><CardTitle className="text-base">Oddiy kontent</CardTitle><CardDescription>SCORM paketlari alohida SCORM boshqaruvchisi orqali yuklanadi.</CardDescription></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3"><Input value={contentTitle} onChange={event => setContentTitle(event.target.value)} placeholder="Kontent nomi" /><Select value={contentModuleId} onValueChange={setContentModuleId} disabled={Boolean(editingContentId)}><SelectTrigger><SelectValue placeholder="Modulni tanlang" /></SelectTrigger><SelectContent>{modules.map(module => <SelectItem key={module.id} value={String(module.id)}>{module.title}</SelectItem>)}</SelectContent></Select><Select value={contentType} onValueChange={value => setContentType(value as ContentType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VIDEO">Video</SelectItem><SelectItem value="DOCUMENT">Hujjat</SelectItem><SelectItem value="LINK">Havola</SelectItem><SelectItem value="FILE">Fayl</SelectItem></SelectContent></Select><Input value={contentUrl} onChange={event => setContentUrl(event.target.value)} placeholder="https://..." /><div className="md:col-span-2 flex justify-end gap-2">{editingContentId && <Button variant="ghost" onClick={resetContentForm}>Bekor qilish</Button>}<Button onClick={saveContent} disabled={saveContentMutation.isPending || modules.length === 0} className="gap-2">{saveContentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingContentId ? "Yangilash" : "Kontent qo'shish"}</Button></div></CardContent></Card>
          {contentsQuery.isLoading && <Loading />}
          {!contentsQuery.isLoading && contents.length === 0 && <Empty text="Hozircha oddiy kontent qo'shilmagan" />}
          {contents.map(content => { const meta = CONTENT_META[content.contentType] ?? CONTENT_META.file; const Icon = meta.icon; const modulePublished = modules.find(item => item.id === content.moduleId)?.status === "published"; return <Card key={content.id}><CardContent className="p-4 flex items-center gap-3"><Icon className={`h-5 w-5 ${meta.className}`} /><div className="flex-1 min-w-0"><p className="font-medium truncate">{content.title}</p><p className="text-xs text-muted-foreground truncate">{content.moduleTitle} · {content.contentUrl || "URL yo'q"}</p></div><Badge variant="outline">{meta.label}</Badge><Badge variant={content.status === "published" ? "default" : "secondary"}>{content.status === "published" ? "Nashrda" : "Qoralama"}</Badge><Button variant="ghost" size="icon" onClick={() => editContent(content)}><Edit className="h-4 w-4" /></Button><Button variant="outline" size="sm" disabled={!modulePublished && content.status === "draft"} title={!modulePublished ? "Avval modulni nashr qiling" : undefined} onClick={() => contentStatusMutation.mutate({ contentId: content.id, status: content.status === "published" ? "DRAFT" : "PUBLISHED" })}>{content.status === "published" ? "Yashirish" : "Nashr"}</Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteContentMutation.mutate(content.id)}><Trash2 className="h-4 w-4" /></Button></CardContent></Card>; })}
        </TabsContent>

        <TabsContent value="students" className="mt-4 space-y-3">
          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4" />Talabani biriktirish</CardTitle><CardDescription>Talaba profil IDlari bilan birga individual reja parametrlarini kiriting.</CardDescription></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"><Input value={studentIds} onChange={event => setStudentIds(event.target.value)} placeholder="Talaba IDlari: 12, 15" disabled={course.status === "archived"} /><Input value={enrollmentAcademicYear} onChange={event => setEnrollmentAcademicYear(event.target.value)} placeholder="2026-2027" disabled={course.status === "archived"} /><Input type="number" min={1} max={20} value={enrollmentSemester} onChange={event => setEnrollmentSemester(event.target.value)} placeholder="Semestr" disabled={course.status === "archived"} /><Input type="number" min={0} max={100} value={enrollmentCredits} onChange={event => setEnrollmentCredits(event.target.value)} placeholder="Kredit" disabled={course.status === "archived"} /><div className="flex gap-2"><Select value={enrollmentRequired} onValueChange={setEnrollmentRequired}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Majburiy</SelectItem><SelectItem value="false">Tanlov</SelectItem></SelectContent></Select><Button onClick={enrollStudents} disabled={course.status === "archived" || enrollMutation.isPending} className="gap-2"><UserPlus className="h-4 w-4" />Biriktirish</Button></div></CardContent></Card>
          {enrollmentsQuery.isLoading && <Loading />}
          {!enrollmentsQuery.isLoading && enrollments.length === 0 && <Empty text="Hozircha talaba biriktirilmagan" />}
          {enrollments.map(item => <Card key={item.id}><CardContent className="p-4 flex items-center gap-3"><Users className="h-4 w-4 text-muted-foreground" /><div className="flex-1"><p className="font-medium">{item.studentName}</p><p className="text-xs text-muted-foreground">{item.studentNumber} · ID {item.studentId} · {item.academicYear} · {item.semester}-semestr · {item.credits} kredit · {item.required ? "majburiy" : "tanlov"} · {item.progress}%</p></div><Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status === "active" ? "Faol" : item.status === "completed" ? "Yakunlagan" : "Chiqarilgan"}</Badge>{item.status === "active" && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => withdrawMutation.mutate(item.studentId)}><Trash2 className="h-4 w-4" /></Button>}</CardContent></Card>)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Loading() {
  return <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
}

function Empty({ text }: { text: string }) {
  return <Card><CardContent className="py-8 text-center text-muted-foreground"><BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />{text}</CardContent></Card>;
}
