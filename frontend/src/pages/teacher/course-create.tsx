import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LazyRichTextEditor } from "@/components/editor/lazy-rich-text-editor";
import { FileDropzone } from "@/components/file-dropzone";
import { useToast } from "@/hooks/use-toast";
import { teacherPortalApi, type TeacherCourse, type CourseCreatePayload } from "@/services/api/teacher-portal-api";
import { subjectGroupApi } from "@/services/api/subject-group-api";

import { CourseFormField as Field } from "@/components/course-form-field";
import { useAuth } from "@/contexts/auth-context";
import { useSessionDraft, useUnloadWarning } from "@/hooks/use-session-draft";

interface CourseForm {
  title: string;
  shortDescription: string;
  description: string;
  subjectGroupId: string;
  subjectId: string;
  level: string;
  language: string;
  expiryPeriodType: "LIFETIME" | "LIMITED_TIME";
  dripContent: boolean;
  startDate: string;
  endDate: string;
}

const INITIAL_FORM: CourseForm = {
  title: "",
  shortDescription: "",
  description: "",
  subjectGroupId: "",
  subjectId: "",
  level: "BEGINNER",
  language: "uz",
  expiryPeriodType: "LIFETIME",
  dripContent: false,
  startDate: "",
  endDate: "",
};

export function TeacherCourseCreate({ course, onSaved, onCancel }: {
  course?: TeacherCourse;
  onSaved?: () => void;
  onCancel?: () => void;
} = {}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const savingRef = useRef(false);
  const initial: CourseForm = course ? {
    ...INITIAL_FORM, title: course.title, shortDescription: course.shortDescription || "",
    description: course.description || "", subjectGroupId: String(course.subjectGroupId || ""),
    subjectId: course.subjectGroupId ? "" : String(course.subjectId || ""),
    level: course.level || "BEGINNER", language: course.language || "uz",
    expiryPeriodType: course.expiryPeriodType === "limited_time" ? "LIMITED_TIME" : "LIFETIME",
    dripContent: course.dripContent, startDate: course.startDate || "", endDate: course.endDate || "",
  } : INITIAL_FORM;
  const draft = useSessionDraft(`course-form:v1:${user?.id ?? "anonymous"}:${course?.id ?? "new"}`, initial);
  const { value: form, setValue: setForm } = draft;
  const [errors, setErrors] = useState<Partial<Record<keyof CourseForm, string>>>({});
  const [additionalOpen, setAdditionalOpen] = useState(Boolean(course));
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || Boolean(thumbnail);
  useUnloadWarning(dirty || saving);
  const cancel = () => {
    if (savingRef.current) return;
    if (dirty && !window.confirm("Saqlanmagan o'zgarishlar bekor qilinsinmi?")) return;
    draft.clear();
    if (onCancel) onCancel(); else navigate("/teacher/courses");
  };
  const teachingOptions = useQuery({
    queryKey: ["subject-groups", "teaching-options"],
    queryFn: subjectGroupApi.teachingOptions,
    enabled: !course,
  });
  const assignedSubjects = useQuery({
    queryKey: ["teacher", "course-subject-options"],
    queryFn: teacherPortalApi.getSubjectMaterialSubjects,
    enabled: !course,
  });
  const profileQuery = useQuery({
    queryKey: ["teacher", "profile"],
    queryFn: teacherPortalApi.getProfile,
  });
  const selectedGroup = (teachingOptions.data ?? []).find(
    (item) => String(item.id) === form.subjectGroupId,
  );
  const groupedSubjectIds = new Set(
    (teachingOptions.data ?? []).map((item) => item.subjectId).filter(Boolean),
  );
  const fallbackSubjects = (assignedSubjects.data ?? []).filter(
    (subject) => !groupedSubjectIds.has(subject.id),
  );
  const selectedSubject = fallbackSubjects.find(
    (item) => String(item.id) === form.subjectId,
  );
  const catalogSelection = form.subjectGroupId
    ? `group:${form.subjectGroupId}`
    : form.subjectId
      ? `subject:${form.subjectId}`
      : "";
  const catalogLoading = !course && (teachingOptions.isLoading || assignedSubjects.isLoading);
  const catalogError = !course && (teachingOptions.isError || assignedSubjects.isError);
  const hasCatalogOptions = (teachingOptions.data?.length ?? 0) + fallbackSubjects.length > 0;

  const set = <K extends keyof CourseForm>(key: K, value: CourseForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const selectCatalog = (value: string) => {
    setErrors((current) => ({ ...current, subjectId: undefined }));
    const [kind, id] = value.split(":");
    const group = kind === "group"
      ? (teachingOptions.data ?? []).find((item) => String(item.id) === id)
      : undefined;
    const subject = kind === "subject"
      ? fallbackSubjects.find((item) => String(item.id) === id)
      : undefined;
    setForm((current) => ({
      ...current,
      subjectGroupId: group ? id : "",
      subjectId: subject ? id : "",
      language: group?.programLanguage || subject?.programLanguage || current.language,
    }));
  };

  const selectThumbnail = (file: File | null) => {
    if (file && file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Kurs rasmi 10 MB dan oshmasligi kerak" });
      return;
    }
    setThumbnail(file);
  };

  const handleSave = async () => {
    if (savingRef.current) return;
    const nextErrors: Partial<Record<keyof CourseForm, string>> = {};
    if (!form.title.trim()) nextErrors.title = "Kurs nomi majburiy";
    else if (form.title.trim().length > 255) nextErrors.title = "Kurs nomi 255 belgidan oshmasligi kerak";
    if (!course && !selectedGroup && !selectedSubject) nextErrors.subjectId = "Kategoriya / fan tanlang";
    if (form.expiryPeriodType === "LIMITED_TIME" && !form.endDate)
      nextErrors.endDate = "Cheklangan kurs uchun tugash sanasi majburiy";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      nextErrors.endDate = "Tugash sanasi boshlanish sanasidan oldin bo'lmaydi";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.endDate) setAdditionalOpen(true);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const payload: CourseCreatePayload = {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        subjectGroupId: !course && form.subjectGroupId ? Number(form.subjectGroupId) : undefined,
        subjectId: !course && form.subjectId ? Number(form.subjectId) : undefined,
        level: form.level,
        language: form.language,
        expiryPeriodType: form.expiryPeriodType,
        dripContent: form.dripContent,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      const saved = course
        ? await teacherPortalApi.updateCourse(course.id, {
            ...payload, clearStartDate: !form.startDate, clearEndDate: !form.endDate,
          })
        : await teacherPortalApi.createCourse({ ...payload, paid: false, discountEnabled: false });
      draft.clear();
      let thumbnailFailed = false;
      if (thumbnail) {
        try {
          await teacherPortalApi.uploadCourseThumbnail(saved.id, thumbnail);
        } catch {
          thumbnailFailed = true;
          toast({ variant: "destructive", title: "Kurs saqlandi, ammo rasm yuklanmadi",
            description: "Tahrirlash orqali rasmni qayta yuklang. Kursni qayta yaratish shart emas." });
        }
      }
      void queryClient.invalidateQueries({ queryKey: ["teacher", "courses"] });
      void queryClient.invalidateQueries({ queryKey: ["teacher", "course", saved.id] });
      if (!thumbnailFailed) toast({ title: course ? "Kurs yangilandi" : "Kurs qoralama sifatida yaratildi", description: saved.title });
      if (onSaved) onSaved(); else navigate(`/teacher/courses/${saved.id}/contents`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: course ? "Kurs yangilanmadi" : "Kurs yaratilmadi",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={cancel} disabled={saving}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course ? "Kursni tahrirlash" : "Yangi kurs yaratish"}</h1>
          <p className="text-sm text-muted-foreground">
            {course ? "Kurs ma’lumotlarini yangilang va saqlang." : "Fan va kurs nomini tanlang. Materiallar keyingi qadamda qo‘shiladi."}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" role="status">{draft.storageFailed
        ? "Qoralamani brauzerda saqlab bo'lmadi. Sahifadan chiqishdan oldin kursni saqlang."
        : "Matn va sozlamalar shu brauzer oynasida qoralama sifatida saqlanadi. Sahifa yangilansa, faylni qayta tanlang."}</p>
      <fieldset disabled={saving} className="min-w-0">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" /> Kurs ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-7 p-5 lg:grid-cols-2 lg:p-7">
          <div className="space-y-5">
            <Field label="Kurs nomi *" error={errors.title}>
              <Input maxLength={255} value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Kurs nomini kiriting" />
            </Field>
            <Field label="Qisqa tavsif">
              <Textarea rows={5} maxLength={2000} value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)} placeholder="Kurs haqida qisqacha ma'lumot" />
            </Field>
            <Field label="Batafsil tavsif">
              <LazyRichTextEditor disabled={saving} value={form.description} onChange={(value) => set("description", value)} placeholder="Kursning to'liq tavsifini kiriting..." />
            </Field>
          </div>

          <div className="space-y-5">
            <Field label="Kurs o'qituvchisi *">
              <Input disabled value={profileQuery.data?.fullName || (profileQuery.isError ? "O’qituvchi ma’lumoti yuklanmadi" : "Yuklanmoqda...")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kategoriya / fan *" error={errors.subjectId}>
                {course ? <Input disabled value={course.subjectName || "Fan ko’rsatilmagan"} /> :
                <Select value={catalogSelection} onValueChange={selectCatalog} disabled={catalogLoading || catalogError}>
                  <SelectTrigger className="w-full" aria-label="Kategoriya / fan"><SelectValue placeholder="Kategoriyani tanlang" /></SelectTrigger>
                  <SelectContent>
                    {(teachingOptions.data ?? []).map((group) => (
                      <SelectItem key={`group-${group.id}`} value={`group:${group.id}`}>
                        {group.subjectCategoryName ? `${group.subjectCategoryName} · ` : ""}{group.subjectName} · {group.code}
                      </SelectItem>
                    ))}
                    {fallbackSubjects.map((subject) => (
                      <SelectItem key={`subject-${subject.id}`} value={`subject:${subject.id}`}>
                        {subject.categoryName ? `${subject.categoryName} · ` : ""}{subject.name}{subject.code ? ` · ${subject.code}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                }
              </Field>
              <Field label="Kurs darajasi *">
                <Select value={form.level} onValueChange={(value) => set("level", value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Boshlang'ich</SelectItem>
                    <SelectItem value="INTERMEDIATE">O'rta</SelectItem>
                    <SelectItem value="ADVANCED">Yuqori</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Kurs tili *">
              <Select disabled={Boolean(course?.subjectGroupId || selectedGroup)} value={form.language} onValueChange={(value) => set("language", value)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbekcha</SelectItem>
                  <SelectItem value="ru">Ruscha</SelectItem>
                  <SelectItem value="en">Inglizcha</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <details open={additionalOpen} onToggle={(event) => setAdditionalOpen(event.currentTarget.open)} className="space-y-4 rounded-lg border p-4"><summary className="cursor-pointer font-medium">Qo‘shimcha sozlamalar: muddat va kurs rasmi</summary>
            <Field label="Amal qilish muddati">
              <RadioGroup value={form.expiryPeriodType} onValueChange={(value) => set("expiryPeriodType", value as CourseForm["expiryPeriodType"])} className="flex gap-5">
                <RadioLabel value="LIFETIME" label="Doimiy" />
                <RadioLabel value="LIMITED_TIME" label="Cheklangan" />
              </RadioGroup>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Boshlanish sanasi">
                <Input type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} />
              </Field>
              <Field error={errors.endDate} label={form.expiryPeriodType === "LIMITED_TIME" ? "Tugash sanasi *" : "Tugash sanasi"}>
                <Input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => set("endDate", event.target.value)} />
              </Field>
            </div>
            <Field label="Kurs rasmi">
              <FileDropzone disabled={saving} accept=".jpg,.jpeg,.png,.webp" file={thumbnail} hint="Kurs rasmini tanlang yoki shu yerga tashlang" maxSizeMb={10} onFileChange={selectThumbnail} />
            </Field>
            <Field label="Darslarni bosqichma-bosqich ochish *">
              <RadioGroup value={form.dripContent ? "on" : "off"} onValueChange={(value) => set("dripContent", value === "on")} className="flex gap-5">
                <RadioLabel value="off" label="O'chirilgan" />
                <RadioLabel value="on" label="Yoqilgan" />
              </RadioGroup>
            </Field>
            </details>
            {selectedGroup && (
              <div className="grid gap-2 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
                <Info label="Kategoriya" value={selectedGroup.subjectCategoryName || "—"} />
                <Info label="Dastur" value={selectedGroup.programName} />
                <Info label="O'quv yili" value={selectedGroup.academicYear} />
                <Info label="Semestr / kredit" value={`${selectedGroup.semester} / ${selectedGroup.credits}`} />
              </div>
            )}
            {selectedSubject && (
              <div className="grid gap-2 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
                <Info label="Kategoriya" value={selectedSubject.categoryName || "—"} />
                <Info label="Fan" value={selectedSubject.name} />
                <Info label="Dastur" value={selectedSubject.programName || "—"} />
                <Info label="Bog'lanish" value="O'qituvchiga biriktirilgan fan" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </fieldset>

      {!course && !catalogError && !catalogLoading && !hasCatalogOptions && (
        <p className="text-sm text-destructive">Sizga faol fan yoki curriculum fan guruhi biriktirilmagan. Administratorga murojaat qiling.</p>
      )}
      {!course && !catalogError && !catalogLoading && (teachingOptions.data?.length ?? 0) === 0 && fallbackSubjects.length > 0 && (
        <p className="text-sm text-muted-foreground">Faol curriculum fan guruhi topilmadi. Kurs o'qituvchiga bevosita biriktirilgan fan bo'yicha yaratiladi.</p>
      )}
      {catalogError && <div role="alert" className="rounded-lg border border-destructive p-3 text-sm">
        Fanlar ro'yxatini yuklab bo'lmadi.
        <Button variant="outline" onClick={() => { void teachingOptions.refetch(); void assignedSubjects.refetch(); }}>Qayta urinish</Button>
      </div>}
      <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-background py-3">
        <Button variant="outline" onClick={cancel} disabled={saving}>Bekor qilish</Button>
        <Button onClick={handleSave} disabled={saving || (!course && (catalogLoading || catalogError || !hasCatalogOptions))} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saqlanmoqda..." : course ? "O‘zgarishlarni saqlash" : "Kurs yaratish"}
        </Button>
      </div>
    </div>
  );
}

function RadioLabel({ value, label }: { value: string; label: string }) {
  return <Label className="flex cursor-pointer items-center gap-2 font-normal"><RadioGroupItem value={value} /> {label}</Label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <p><span className="text-muted-foreground">{label}:</span> {value}</p>;
}
