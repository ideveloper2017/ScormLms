import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { teacherPortalApi } from "@/services/api/teacher-portal-api";
import { subjectGroupApi } from "@/services/api/subject-group-api";

interface CourseForm {
  title: string;
  shortDescription: string;
  description: string;
  subjectGroupId: string;
  subjectId: string;
  level: string;
  language: string;
  paid: boolean;
  price: string;
  discountEnabled: boolean;
  discountedPrice: string;
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
  paid: false,
  price: "",
  discountEnabled: false,
  discountedPrice: "",
  expiryPeriodType: "LIFETIME",
  dripContent: false,
  startDate: "",
  endDate: "",
};

export function TeacherCourseCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [form, setForm] = useState<CourseForm>(INITIAL_FORM);
  const teachingOptions = useQuery({
    queryKey: ["subject-groups", "teaching-options"],
    queryFn: subjectGroupApi.teachingOptions,
  });
  const assignedSubjects = useQuery({
    queryKey: ["teacher", "course-subject-options"],
    queryFn: teacherPortalApi.getSubjectMaterialSubjects,
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
  const catalogLoading = teachingOptions.isLoading || assignedSubjects.isLoading;
  const hasCatalogOptions = (teachingOptions.data?.length ?? 0) + fallbackSubjects.length > 0;

  const set = <K extends keyof CourseForm>(key: K, value: CourseForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const selectCatalog = (value: string) => {
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
    if (!form.title.trim()) {
      toast({ variant: "destructive", title: "Kurs nomi majburiy" });
      return;
    }
    if (!form.subjectGroupId && !form.subjectId) {
      toast({ variant: "destructive", title: "Kategoriya / fan majburiy" });
      return;
    }
    if (form.expiryPeriodType === "LIMITED_TIME" && !form.endDate) {
      toast({ variant: "destructive", title: "Cheklangan kurs uchun tugash sanasi majburiy" });
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast({ variant: "destructive", title: "Tugash sanasi boshlanish sanasidan oldin bo'lmaydi" });
      return;
    }
    const price = form.price ? Number(form.price) : undefined;
    const discountedPrice = form.discountedPrice
      ? Number(form.discountedPrice)
      : undefined;
    if (form.paid && (!price || price <= 0)) {
      toast({ variant: "destructive", title: "Pullik kurs narxini kiriting" });
      return;
    }
    if (
      form.paid &&
      form.discountEnabled &&
      (!discountedPrice || !price || discountedPrice >= price)
    ) {
      toast({
        variant: "destructive",
        title: "Chegirmali narx asosiy narxdan kichik bo'lishi kerak",
      });
      return;
    }

    setSaving(true);
    try {
      const created = await teacherPortalApi.createCourse({
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim() || undefined,
        description: form.description.trim() || undefined,
        subjectGroupId: form.subjectGroupId ? Number(form.subjectGroupId) : undefined,
        subjectId: form.subjectId ? Number(form.subjectId) : undefined,
        level: form.level,
        language: form.language,
        paid: form.paid,
        price: form.paid ? price : undefined,
        discountEnabled: form.paid && form.discountEnabled,
        discountedPrice:
          form.paid && form.discountEnabled ? discountedPrice : undefined,
        expiryPeriodType: form.expiryPeriodType,
        dripContent: form.dripContent,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      if (thumbnail) {
        await teacherPortalApi.uploadCourseThumbnail(created.id, thumbnail);
      }
      toast({
        title: "Kurs qoralama sifatida yaratildi",
        description: created.title,
      });
      navigate(`/teacher/courses/${created.id}/contents`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Kurs yaratilmadi",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/teacher/courses")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Yangi Kurs Yaratish</h1>
          <p className="text-sm text-muted-foreground">
            Fan va kurs nomini tanlang. Materiallar keyingi qadamda qo‘shiladi.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" /> Kurs ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-7 p-5 lg:grid-cols-2 lg:p-7">
          <div className="space-y-5">
            <Field label="Kurs nomi *">
              <Input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Kurs nomini kiriting" />
            </Field>
            <Field label="Qisqa tavsif">
              <Textarea rows={5} maxLength={2000} value={form.shortDescription} onChange={(event) => set("shortDescription", event.target.value)} placeholder="Kurs haqida qisqacha ma'lumot" />
            </Field>
            <Field label="Batafsil tavsif">
              <LazyRichTextEditor value={form.description} onChange={(value) => set("description", value)} placeholder="Kursning to'liq tavsifini kiriting..." />
            </Field>
          </div>

          <div className="space-y-5">
            <Field label="Kurs o'qituvchisi *">
              <Input disabled value={profileQuery.data?.fullName || "Yuklanmoqda..."} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kategoriya / fan *">
                <Select value={catalogSelection} onValueChange={selectCatalog} disabled={catalogLoading}>
                  <SelectTrigger><SelectValue placeholder="Kategoriyani tanlang" /></SelectTrigger>
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
              </Field>
              <Field label="Kurs darajasi *">
                <Select value={form.level} onValueChange={(value) => set("level", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Boshlang'ich</SelectItem>
                    <SelectItem value="INTERMEDIATE">O'rta</SelectItem>
                    <SelectItem value="ADVANCED">Yuqori</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Kurs tili *">
              <Select value={form.language} onValueChange={(value) => set("language", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uz">O'zbekcha</SelectItem>
                  <SelectItem value="ru">Ruscha</SelectItem>
                  <SelectItem value="en">Inglizcha</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <details className="space-y-4 rounded-lg border p-4"><summary className="cursor-pointer font-medium">Qo‘shimcha sozlamalar: narx, muddat va kurs rasmi</summary>
            <Field label="Narxlash turi *">
              <RadioGroup value={form.paid ? "paid" : "free"} onValueChange={(value) => set("paid", value === "paid")} className="flex gap-5">
                <RadioLabel value="free" label="Bepul" />
                <RadioLabel value="paid" label="Pullik" />
              </RadioGroup>
            </Field>
            {form.paid && (
              <div className="space-y-4 rounded-lg border bg-muted/10 p-4">
                <Field label="Narx *">
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => set("price", event.target.value)} placeholder="Kurs narxini kiriting" />
                </Field>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Checkbox checked={form.discountEnabled} onCheckedChange={(checked) => set("discountEnabled", checked === true)} /> Kurs chegirmasi
                </label>
                {form.discountEnabled && (
                  <Field label="Chegirmali narx *">
                    <Input type="number" min="0" step="0.01" value={form.discountedPrice} onChange={(event) => set("discountedPrice", event.target.value)} />
                  </Field>
                )}
              </div>
            )}
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
              <Field label={form.expiryPeriodType === "LIMITED_TIME" ? "Tugash sanasi *" : "Tugash sanasi"}>
                <Input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => set("endDate", event.target.value)} />
              </Field>
            </div>
            <Field label="Kurs rasmi">
              <FileDropzone accept=".jpg,.jpeg,.png,.webp" file={thumbnail} hint="Kurs rasmini tanlang yoki shu yerga tashlang" maxSizeMb={10} onFileChange={selectThumbnail} />
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

      {!catalogLoading && !hasCatalogOptions && (
        <p className="text-sm text-destructive">Sizga faol fan yoki curriculum fan guruhi biriktirilmagan. Administratorga murojaat qiling.</p>
      )}
      {!catalogLoading && (teachingOptions.data?.length ?? 0) === 0 && fallbackSubjects.length > 0 && (
        <p className="text-sm text-muted-foreground">Faol curriculum fan guruhi topilmadi. Kurs o'qituvchiga bevosita biriktirilgan fan bo'yicha yaratiladi.</p>
      )}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/teacher/courses")}>Bekor qilish</Button>
        <Button onClick={handleSave} disabled={saving || !catalogSelection} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saqlanmoqda..." : "Kurs yaratish"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function RadioLabel({ value, label }: { value: string; label: string }) {
  return <Label className="flex cursor-pointer items-center gap-2 font-normal"><RadioGroupItem value={value} /> {label}</Label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <p><span className="text-muted-foreground">{label}:</span> {value}</p>;
}
