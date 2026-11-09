import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isRichTextEmpty } from "@/components/editor/rich-text-utils";
import { useAuth } from "@/contexts/auth-context";
import { useSessionDraft, useUnloadWarning } from "@/hooks/use-session-draft";
import { useToast } from "@/hooks/use-toast";
import {
  teacherPortalApi,
  type CourseContent,
  type CourseModule,
  type TeacherCourse,
} from "@/services/api/teacher-portal-api";
import {
  NO_UNIT,
  today,
  createShowError,
  type ConfirmFn,
  type ContentType,
  type ItemStatus,
} from "./shared";

/**
 * "Darslar" tabining holati, so'rovlari va mutatsiyalari (modul/dars formalari, material dialogi,
 * versiyalar tarixi). Konteynerda chaqiriladi: so'rovlar faol tabdan qat'i nazar ishlaydi va
 * forma holati tab almashganda ham, kursni tahrirlash oynasiga o'tganda ham saqlanib qoladi.
 */
export function useContentsTab({
  courseId,
  course,
  modules,
  contents,
  confirm,
}: {
  courseId: string;
  course: TeacherCourse | undefined;
  modules: CourseModule[];
  contents: CourseContent[];
  confirm: ConfirmFn;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const showError = createShowError(toast);
  const [moduleTitle, setModuleTitle] = useState("");
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [moduleUnitId, setModuleUnitId] = useState(NO_UNIT);
  const [unitTitle, setUnitTitle] = useState("");
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const lessonDraft = useSessionDraft(`course-lesson:v1:${user?.id ?? "anonymous"}:${courseId}`, {
    lessonDialogOpen: false,
    contentTitle: "",
    contentDescription: "",
    contentUrl: "",
    contentBody: "",
    contentAssetId: null as number | null,
    contentAssetName: "",
    contentType: "LINK" as ContentType,
    contentModuleId: "",
    contentLanguage: "uz",
    contentAuthor: "",
    contentVersion: "1.0",
    contentSourceName: "",
    contentSourceUrl: "",
    contentValidFrom: today(),
    contentValidUntil: "",
    contentDuration: "",
    editingContentId: null as number | null,
  });
  const { lessonDialogOpen, contentTitle, contentDescription, contentUrl, contentBody, contentAssetId, contentType, contentModuleId, contentLanguage, contentAuthor, contentVersion, contentSourceName, contentSourceUrl, contentValidFrom, contentValidUntil, contentDuration, editingContentId } = lessonDraft.value;
  const setLessonField = <K extends keyof typeof lessonDraft.value>(key: K, value: (typeof lessonDraft.value)[K]) =>
    lessonDraft.setValue((current) => ({ ...current, [key]: value }));
  const setLessonDialogOpen = (value: (typeof lessonDraft.value)["lessonDialogOpen"]) => setLessonField("lessonDialogOpen", value);
  const setContentTitle = (value: (typeof lessonDraft.value)["contentTitle"]) => setLessonField("contentTitle", value);
  const setContentDescription = (value: (typeof lessonDraft.value)["contentDescription"]) => setLessonField("contentDescription", value);
  const setContentUrl = (value: (typeof lessonDraft.value)["contentUrl"]) => setLessonField("contentUrl", value);
  const setContentBody = (value: (typeof lessonDraft.value)["contentBody"]) => setLessonField("contentBody", value);
  const setContentAssetId = (value: (typeof lessonDraft.value)["contentAssetId"]) => setLessonField("contentAssetId", value);
  const setContentAssetName = (value: (typeof lessonDraft.value)["contentAssetName"]) => setLessonField("contentAssetName", value);
  const setContentType = (value: (typeof lessonDraft.value)["contentType"]) => setLessonField("contentType", value);
  const setContentModuleId = (value: (typeof lessonDraft.value)["contentModuleId"]) => setLessonField("contentModuleId", value);
  const setContentLanguage = (value: (typeof lessonDraft.value)["contentLanguage"]) => setLessonField("contentLanguage", value);
  const setContentAuthor = (value: (typeof lessonDraft.value)["contentAuthor"]) => setLessonField("contentAuthor", value);
  const setContentVersion = (value: (typeof lessonDraft.value)["contentVersion"]) => setLessonField("contentVersion", value);
  const setContentSourceName = (value: (typeof lessonDraft.value)["contentSourceName"]) => setLessonField("contentSourceName", value);
  const setContentSourceUrl = (value: (typeof lessonDraft.value)["contentSourceUrl"]) => setLessonField("contentSourceUrl", value);
  const setContentValidFrom = (value: (typeof lessonDraft.value)["contentValidFrom"]) => setLessonField("contentValidFrom", value);
  const setContentValidUntil = (value: (typeof lessonDraft.value)["contentValidUntil"]) => setLessonField("contentValidUntil", value);
  const setContentDuration = (value: (typeof lessonDraft.value)["contentDuration"]) => setLessonField("contentDuration", value);
  const setEditingContentId = (value: (typeof lessonDraft.value)["editingContentId"]) => setLessonField("editingContentId", value);
  const lessonSavingRef = useRef(false);
  useUnloadWarning(lessonDialogOpen);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [downloadingContentId, setDownloadingContentId] = useState<
    number | null
  >(null);
  const [historyContent, setHistoryContent] = useState<CourseContent | null>(
    null,
  );
  const [bankModuleId, setBankModuleId] = useState("");
  const [bankMaterialId, setBankMaterialId] = useState("");


  const profileQuery = useQuery({
    queryKey: ["teacher", "profile"],
    queryFn: teacherPortalApi.getProfile,
    enabled: user?.role?.name.replace(/^ROLE_/i, '').toLowerCase() === 'teacher',
  });
  // Dars testlari (o'quv dasturi darsidagi Test va Savol/Javob shu yerga tushadi)
  const testsQuery = useQuery({
    queryKey: ["teacher", "tests"],
    queryFn: teacherPortalApi.getTests,
    enabled: Boolean(courseId),
  });
  const lessonTests = (lessonId: number) =>
    (testsQuery.data ?? []).filter((test) => test.courseId === String(courseId) && test.lessonId === String(lessonId));
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

  const refreshLearningItems = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId, "modules"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId, "units"],
      }),
      queryClient.invalidateQueries({ queryKey: ["teacher", "tests"] }),
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId, "contents"],
      }),
    ]);
  const editingModuleLinked = modules.some((module) => module.id === editingModuleId && module.syllabusTopicId != null);

  const saveModuleMutation = useMutation({
    mutationFn: () => {
      const unitId = moduleUnitId === NO_UNIT ? undefined : Number(moduleUnitId);
      return editingModuleId
        ? teacherPortalApi.updateModule(courseId, editingModuleId, {
            title: moduleTitle.trim(),
            // Dastur darsining moduli dasturda belgilanadi — faqat qo'shimcha darsda yuboriladi
            ...(editingModuleLinked ? {} : unitId ? { unitId } : { detachUnit: true }),
          })
        : teacherPortalApi.createModule(courseId, {
            title: moduleTitle.trim(),
            ...(unitId ? { unitId } : {}),
          });
    },
    onSuccess: async () => {
      setModuleTitle("");
      setEditingModuleId(null);
      setModuleUnitId(NO_UNIT);
      await refreshLearningItems();
      toast({
        title: editingModuleId ? "Dars yangilandi" : "Dars yaratildi",
      });
    },
    onError: showError("Dars saqlanmadi"),
  });
  const saveUnitMutation = useMutation({
    mutationFn: () =>
      editingUnitId
        ? teacherPortalApi.updateUnit(courseId, editingUnitId, { title: unitTitle.trim() })
        : teacherPortalApi.createUnit(courseId, { title: unitTitle.trim() }),
    onSuccess: async () => {
      setUnitTitle("");
      setEditingUnitId(null);
      await refreshLearningItems();
      toast({ title: editingUnitId ? "Modul yangilandi" : "Modul yaratildi" });
    },
    onError: showError("Modul saqlanmadi"),
  });
  const unitStatusMutation = useMutation({
    mutationFn: ({ unitId, status }: { unitId: number; status: ItemStatus }) =>
      teacherPortalApi.updateUnitStatus(courseId, unitId, status),
    onSuccess: async (_, { status }) => {
      await refreshLearningItems();
      toast({ title: status === "PUBLISHED" ? "Modul darslari nashr qilindi" : "Modul darslari yashirildi" });
    },
    onError: showError("Modul holati yangilanmadi"),
  });
  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: number) => teacherPortalApi.deleteUnit(courseId, unitId),
    onSuccess: async () => {
      await refreshLearningItems();
      toast({ title: "Modul o'chirildi", description: "Darslari modulga biriktirilmagan bo'lib qoldi" });
    },
    onError: showError("Modul o'chirilmadi"),
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
      if (uploadedAsset) {
        setContentAssetId(uploadedAsset.id);
        setContentAssetName(contentFile?.name || "Yuklangan fayl");
        setContentFile(null);
      }
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
    onSettled: () => { lessonSavingRef.current = false; },
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
    setContentLanguage(course?.language || "uz");
    setContentAuthor(profileQuery.data?.fullName || "");
    setContentVersion("1.0");
    setContentSourceName("");
    setContentSourceUrl("");
    setContentValidFrom(today());
    setContentValidUntil("");
    setContentDuration("");
    setEditingContentId(null);
    lessonDraft.clear();
  }

  async function closeLesson() {
    if (lessonSavingRef.current) return;
    if (!(await confirm({ title: "Saqlanmagan dars o'zgarishlari bekor qilinsinmi?", description: "Kiritgan ma'lumotlaringiz saqlanmaydi.", confirmLabel: "Ha, bekor qilish", cancelLabel: "Yo'q, davom etaman" }))) return;
    setLessonDialogOpen(false);
    resetContentForm();
  }

  function saveModule() {
    if (!moduleTitle.trim())
      return toast({ variant: "destructive", title: "Dars nomini kiriting" });
    saveModuleMutation.mutate();
  }

  function saveUnit() {
    if (unitTitle.trim().length < 3)
      return toast({ variant: "destructive", title: "Modul nomini kiriting (kamida 3 belgi)" });
    saveUnitMutation.mutate();
  }

  function saveContent() {
    if (lessonSavingRef.current) return;
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
          title: "Fayl tanlang yoki havola kiriting",
        });
      }
      if ((contentFile || contentAssetId) && contentUrl.trim()) {
        return toast({
          variant: "destructive",
          title: "Fayl yoki URLdan faqat bittasini tanlang",
        });
      }
    }
    lessonSavingRef.current = true;
    saveContentMutation.mutate();
  }

  function editModule(module: CourseModule) {
    setEditingModuleId(module.id);
    setModuleTitle(module.title);
    setModuleUnitId(module.unitId ? String(module.unitId) : NO_UNIT);
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
    setContentSourceName(course?.subjectName || "Mualliflik materiali");
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

  return {
    // Modul (unit) va dars (module) formalari
    unitTitle,
    setUnitTitle,
    editingUnitId,
    setEditingUnitId,
    saveUnit,
    saveUnitMutation,
    unitStatusMutation,
    deleteUnitMutation,
    moduleTitle,
    setModuleTitle,
    editingModuleId,
    setEditingModuleId,
    moduleUnitId,
    setModuleUnitId,
    editingModuleLinked,
    saveModule,
    editModule,
    saveModuleMutation,
    moduleStatusMutation,
    deleteModuleMutation,
    // Fan kutubxonasidan tayyor material biriktirish
    bankModuleId,
    setBankModuleId,
    bankMaterialId,
    setBankMaterialId,
    subjectMaterialsQuery,
    attachMaterialMutation,
    // Materiallar ro'yxati
    lessonTests,
    refreshLearningItems,
    moveContent,
    reorderContentsMutation,
    contentStatusMutation,
    submitReviewMutation,
    deleteContentMutation,
    downloadContent,
    downloadingContentId,
    // Material (dars) dialogi
    lessonDraft,
    setLessonDialogOpen,
    setContentTitle,
    setContentDescription,
    setContentUrl,
    setContentBody,
    setContentAssetId,
    setContentAssetName,
    setContentType,
    setContentModuleId,
    setContentLanguage,
    setContentAuthor,
    setContentVersion,
    setContentSourceName,
    setContentSourceUrl,
    setContentValidFrom,
    setContentValidUntil,
    setContentDuration,
    contentFile,
    setContentFile,
    selectContentFile,
    startNewLesson,
    editContent,
    saveContent,
    closeLesson,
    saveContentMutation,
    // Versiyalar va ekspertiza tarixi dialogi
    historyContent,
    setHistoryContent,
    revisionsQuery,
    reviewsQuery,
  };
}

export type ContentsTabController = ReturnType<typeof useContentsTab>;
