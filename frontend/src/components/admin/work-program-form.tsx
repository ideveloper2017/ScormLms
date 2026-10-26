import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CoursePlanPreview, CreditWorkload, SyllabusTopicsEditor } from "@/components/admin/syllabus-topics";
import { extractApiError } from "@/lib/academic-api";
import { currentAcademicYear } from "@/lib/student-admission-cascade";
import { courseLanguageOf, formatTypeHours, syllabusLanguages, syllabusTypeHours, validateTopics } from "@/lib/syllabus";
import { academicPeriodApi } from "@/services/api/academic-period-api";
import type { ModelProgram } from "@/services/api/model-program-api";
import { syllabusApi, type SyllabusTopicInput } from "@/services/api/syllabus-api";

const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

interface CourseForm { enabled: boolean; title: string; shortDescription: string; level: string; language: string }

/**
 * Fan dasturi (ishchi dastur / sillabus): o'quv dasturidan (namunaviy) muayyan o'quv yili va semestr uchun.
 * Mavzular (nazariy, amaliy, laboratoriya, seminar), soatlar va shu dastur asosidagi kurs bitta formada.
 */
export function WorkProgramForm({ model, onClose, onCreated }: {
  model: ModelProgram;
  onClose: () => void;
  onCreated: () => void;
}) {
  const navigate = useNavigate();
  const years = useQuery({ queryKey: ["academic-periods", "years"], queryFn: () => academicPeriodApi.listYears(false) });
  const semesters = useQuery({ queryKey: ["academic-periods", "semesters"], queryFn: () => academicPeriodApi.listSemesters(false) });
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState(1);
  const [topics, setTopics] = useState<SyllabusTopicInput[]>([]);
  const [course, setCourse] = useState<CourseForm>({
    enabled: true, title: model.subjectName, shortDescription: model.shortDescription, level: "BEGINNER",
    language: courseLanguageOf(model.language),
  });
  const [error, setError] = useState<string | null>(null);
  // Tanlanmagan bo'lsa joriy o'quv yili
  const year = academicYear || years.data?.find((y) => y.current)?.code || years.data?.[0]?.code || currentAcademicYear();
  const yearOptions = Array.from(new Set([year, ...(years.data ?? []).map((y) => y.code)]));
  const semesterOptions = (semesters.data?.length ? semesters.data.map((s) => ({ value: s.semesterNumber, label: s.nameUz }))
    : Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `${i + 1}-semestr` })));
  const languageLabel = syllabusLanguages.find((l) => l.value === model.language)?.label ?? model.language;

  const create = useMutation({
    mutationFn: () => syllabusApi.createWorkProgram({
      modelProgramId: model.id, academicYear: year, semester,
      topics: topics.map((t) => ({ type: t.type, title: t.title.trim(), description: t.description?.trim() || null, hours: Number(t.hours) })),
      course: course.enabled ? {
        title: course.title.trim(), shortDescription: course.shortDescription.trim() || null,
        level: course.level, language: course.language,
      } : null,
    }),
    onSuccess: () => onCreated(),
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });

  const submit = () => {
    const problem = validateTopics(topics)
      ?? (course.enabled && !course.title.trim() ? "Kurs nomi majburiy" : null)
      ?? (course.enabled && course.title.trim().length > 255 ? "Kurs nomi 255 belgidan oshmasligi kerak" : null);
    setError(problem);
    if (!problem) create.mutate();
  };

  const result = create.data;
  const busy = create.isPending;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className={result ? "sm:max-w-2xl" : "sm:max-w-6xl max-h-[92vh] overflow-y-auto"}>
        <DialogHeader>
          <DialogTitle>Fan dasturi — {model.subjectName}</DialogTitle>
          <DialogDescription>
            O'quv dasturi: {model.subjectCode ? `${model.subjectCode} · ` : ""}{model.name} · {languageLabel}
            {model.subjectCredits ? ` · ${model.subjectCredits} kredit` : ""}. Fan dasturi tanlangan o'quv yili va semestr uchun tuziladi.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-2" role="status">
            <p className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />Saqlandi
            </p>
            <p className="text-sm">
              Fan dasturi «{result.syllabus.name}» qoralama sifatida yaratildi: {result.syllabus.topics?.length ?? 0} ta mavzu
              ({formatTypeHours(syllabusTypeHours(result.syllabus))} soat).
            </p>
            {result.course && (
              <p className="text-sm">
                Kurs «{result.course.title}» yaratildi — har bir mavzu kursda bo'lim bo'ldi. Darslar va materiallarni kursda qo'shing.
                Dastur qoralama ekan, mavzular o'zgarsa kurs bo'limlari ham avtomatik yangilanadi.
              </p>
            )}
            <p className="text-xs text-muted-foreground">Fan dasturini tekshiruvga yuborish va tasdiqlash "Mazmun va tarix" orqali bajariladi.</p>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Yopish</Button>
              {result.course && <Button onClick={() => navigate(`/teacher/courses/${result.course!.id}/contents`)}>Kursni ochish</Button>}
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="work-year">O'quv yili *</Label>
                <select id="work-year" className={selectClass} value={year} onChange={(e) => setAcademicYear(e.target.value)}>
                  {yearOptions.map((code) => <option key={code} value={code}>{code}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="work-semester">Semestr *</Label>
                <select id="work-semester" className={selectClass} value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                  {semesterOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nazariy, amaliy, laboratoriya va seminar mavzulari hamda soatlarini kiriting — har bir mavzu kursda bo'lim bo'ladi.
                </p>
                <SyllabusTopicsEditor value={topics} onChange={(value) => { setTopics(value); setError(null); }} />
                <CreditWorkload credits={model.subjectCredits} topics={topics} />
              </div>

              <aside className="space-y-3 rounded-lg border bg-muted/20 p-3" aria-label="Kurs">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Switch checked={course.enabled} onCheckedChange={(enabled) => setCourse({ ...course, enabled })} aria-label="Kurs ham yaratilsin" />
                  Shu fan dasturi asosida kurs
                </label>
                {course.enabled ? (
                  <>
                    <div className="space-y-1.5"><Label htmlFor="work-course-title">Kurs nomi *</Label>
                      <Input id="work-course-title" maxLength={255} value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5"><Label htmlFor="work-course-level">Daraja</Label>
                        <select id="work-course-level" className={selectClass} value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value })}>
                          <option value="BEGINNER">Boshlang'ich</option><option value="INTERMEDIATE">O'rta</option><option value="ADVANCED">Yuqori</option>
                        </select></div>
                      <div className="space-y-1.5"><Label htmlFor="work-course-language">Kurs tili</Label>
                        <select id="work-course-language" className={selectClass} value={course.language} onChange={(e) => setCourse({ ...course, language: e.target.value })}>
                          <option value="uz">O'zbekcha</option><option value="ru">Ruscha</option><option value="en">Inglizcha</option>
                        </select></div>
                    </div>
                    <div className="space-y-1.5"><Label htmlFor="work-course-short">Kursning qisqa tavsifi</Label>
                      <Textarea id="work-course-short" rows={3} value={course.shortDescription} onChange={(e) => setCourse({ ...course, shortDescription: e.target.value })} /></div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">Kurs tuzilmasi</p>
                      <CoursePlanPreview topics={topics} />
                    </div>
                    <p className="text-xs text-muted-foreground">Kurs o'qituvchisi — siz; kurs qoralama holatda yaratiladi.</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Faqat fan dasturi yaratiladi. Kursni keyin "Kurs yaratish" sahifasida shu dasturdan yaratish mumkin.</p>
                )}
              </aside>
            </div>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={busy}>Bekor qilish</Button>
              <Button onClick={submit} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {course.enabled ? "Fan dasturi va kursni yaratish" : "Fan dasturini yaratish"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
