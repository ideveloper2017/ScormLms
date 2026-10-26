import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CoursePlanPreview, CreditWorkload, SyllabusTopicsEditor } from "@/components/admin/syllabus-topics";
import { extractApiError, type SubjectRecord } from "@/lib/academic-api";
import { courseLanguageOf, syllabusLanguages, validateTopics } from "@/lib/syllabus";
import { cn } from "@/lib/utils";
import { syllabusApi, type SyllabusLanguage, type SyllabusTopicInput } from "@/services/api/syllabus-api";

type Step = 1 | 2;
const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: "Fan va ta'riflar" },
  { step: 2, label: "Mavzular va kurs" },
];
const selectClass = "h-10 w-full rounded-md border bg-background px-3 text-sm";

interface CourseForm { enabled: boolean; title: string; shortDescription: string; level: string; language: string }

/**
 * "Fan dasturi va kurs": oliy ta'limda fan dasturi (reja) va undan qurilgan elektron kurs bitta birlik.
 * 1-qadam — fan va ta'riflar; 2-qadam — mavzular va kurs bir ekranda: har bir mavzu kursda bo'lim bo'ladi.
 */
export function SyllabusCourseWizard({ subjects, defaultSubjectId, onClose, onCreated }: {
  subjects: SubjectRecord[];
  defaultSubjectId?: number | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [syllabus, setSyllabus] = useState({
    subjectId: defaultSubjectId ?? 0, language: "UZ" as SyllabusLanguage,
    shortDescription: "", requirements: "", fullDescription: "",
  });
  const [topics, setTopics] = useState<SyllabusTopicInput[]>([]);
  const [course, setCourse] = useState<CourseForm>({ enabled: true, title: "", shortDescription: "", level: "BEGINNER", language: "" });
  const subject = subjects.find((s) => s.id === syllabus.subjectId);

  const create = useMutation({
    mutationFn: () => syllabusApi.createWithCourse({
      syllabus: {
        subjectId: syllabus.subjectId, language: syllabus.language, active: true,
        shortDescription: syllabus.shortDescription.trim(), requirements: syllabus.requirements.trim() || null,
        fullDescription: syllabus.fullDescription.trim(),
        topics: topics.map((t) => ({ type: t.type, title: t.title.trim(), description: t.description?.trim() || null, hours: Number(t.hours) })),
      },
      course: course.enabled ? {
        title: course.title.trim(), shortDescription: course.shortDescription.trim() || null,
        level: course.level, language: course.language || courseLanguageOf(syllabus.language),
      } : null,
    }),
    onSuccess: () => onCreated(),
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });

  const validate = (current: Step): string | null => {
    if (current === 1) {
      if (!syllabus.subjectId) return "Fan tanlang";
      if (syllabus.shortDescription.trim().length < 3) return "Qisqa ta'rif majburiy";
      if (syllabus.fullDescription.trim().length < 3) return "To'liq ta'rif majburiy";
      return null;
    }
    const topicError = validateTopics(topics);
    if (topicError) return topicError;
    if (course.enabled && !course.title.trim()) return "Kurs nomi majburiy";
    if (course.enabled && course.title.trim().length > 255) return "Kurs nomi 255 belgidan oshmasligi kerak";
    return null;
  };
  const next = () => {
    const problem = validate(step);
    setError(problem);
    if (problem) return;
    if (step === 1) {
      // Kurs ma'lumotlari dastur ma'lumotlari bilan to'ldiriladi (bo'sh bo'lsa)
      setCourse((c) => ({
        ...c,
        title: c.title || subject?.name || "",
        shortDescription: c.shortDescription || syllabus.shortDescription,
        language: c.language || courseLanguageOf(syllabus.language),
      }));
      setStep(2);
    } else create.mutate();
  };
  const back = () => { setError(null); setStep(1); };

  const result = create.data;
  const busy = create.isPending;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className={cn("max-h-[92vh] overflow-y-auto", step === 2 && !result ? "sm:max-w-6xl" : "sm:max-w-3xl")}>
        <DialogHeader>
          <DialogTitle>Fan dasturi va kurs</DialogTitle>
          <DialogDescription>Fan dasturi, uning mavzulari va shu dastur asosidagi kurs bitta oynada yaratiladi.</DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 py-2" role="status">
            <p className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />Saqlandi
            </p>
            <p className="text-sm">
              Fan dasturi «{result.syllabus.name}» qoralama sifatida yaratildi: {result.syllabus.topics?.length ?? 0} ta mavzu
              (nazariy {result.syllabus.theoreticalHours ?? 0}, amaliy {result.syllabus.practicalHours ?? 0} soat).
            </p>
            {result.course && (
              <p className="text-sm">
                Kurs «{result.course.title}» yaratildi — har bir mavzu kursda bo'lim bo'ldi. Darslar va materiallarni kursda qo'shing.
                Dastur qoralama ekan, mavzular o'zgarsa kurs bo'limlari ham avtomatik yangilanadi.
              </p>
            )}
            <p className="text-xs text-muted-foreground">Dasturni tekshiruvga yuborish va tasdiqlash "Mazmun va tarix" orqali bajariladi.</p>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Yopish</Button>
              {result.course && <Button onClick={() => navigate(`/teacher/courses/${result.course!.id}/contents`)}>Kursni ochish</Button>}
            </DialogFooter>
          </div>
        ) : (
          <>
            <ol className="grid grid-cols-2 gap-2" aria-label="Qadamlar">
              {STEPS.map(({ step: value, label }) => (
                <li key={value} aria-current={step === value ? "step" : undefined}
                  className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                    step === value ? "border-primary bg-primary/5 font-medium" : "text-muted-foreground")}>
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                    step >= value ? "bg-primary text-primary-foreground" : "bg-muted")}>{value}</span>
                  {label}
                </li>
              ))}
            </ol>

            {step === 1 && (
              <div className="grid gap-4">
                <div className="grid grid-cols-[1fr_180px] gap-3">
                  <div className="space-y-1.5"><Label htmlFor="wizard-subject">Fan *</Label>
                    <select id="wizard-subject" className={selectClass} value={syllabus.subjectId}
                      onChange={(e) => setSyllabus({ ...syllabus, subjectId: Number(e.target.value) })}>
                      <option value={0}>Fan tanlang</option>
                      {subjects.filter((s) => s.active).map((s) => (
                        <option key={s.id} value={s.id}>{s.code} · {s.name}{s.credits ? ` · ${s.credits} kredit` : ""}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="wizard-language">Dastur tili *</Label>
                    <select id="wizard-language" className={selectClass} value={syllabus.language}
                      onChange={(e) => setSyllabus({ ...syllabus, language: e.target.value as SyllabusLanguage })}>
                      {syllabusLanguages.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="wizard-short">Qisqa ta'rif *</Label>
                  <Textarea id="wizard-short" value={syllabus.shortDescription} onChange={(e) => setSyllabus({ ...syllabus, shortDescription: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="wizard-req">Talablar</Label>
                  <Textarea id="wizard-req" value={syllabus.requirements} onChange={(e) => setSyllabus({ ...syllabus, requirements: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="wizard-full">To'liq ta'rif *</Label>
                  <Textarea id="wizard-full" className="min-h-24" value={syllabus.fullDescription} onChange={(e) => setSyllabus({ ...syllabus, fullDescription: e.target.value })} /></div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {subject ? `${subject.code ?? ""} · ${subject.name}. ` : ""}Nazariy va amaliy mavzular hamda soatlarini kiriting —
                    har bir mavzu kursda bo'lim bo'ladi, darslar shu bo'limlarga qo'shiladi.
                  </p>
                  <SyllabusTopicsEditor value={topics} onChange={(value) => { setTopics(value); setError(null); }} />
                  <CreditWorkload credits={subject?.credits} topics={topics} />
                </div>

                <aside className="space-y-3 rounded-lg border bg-muted/20 p-3" aria-label="Kurs">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Switch checked={course.enabled} onCheckedChange={(enabled) => setCourse({ ...course, enabled })} aria-label="Kurs ham yaratilsin" />
                    Shu dastur asosida kurs
                  </label>
                  {course.enabled ? (
                    <>
                      <div className="space-y-1.5"><Label htmlFor="wizard-course-title">Kurs nomi *</Label>
                        <Input id="wizard-course-title" maxLength={255} value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5"><Label htmlFor="wizard-course-level">Daraja</Label>
                          <select id="wizard-course-level" className={selectClass} value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value })}>
                            <option value="BEGINNER">Boshlang'ich</option><option value="INTERMEDIATE">O'rta</option><option value="ADVANCED">Yuqori</option>
                          </select></div>
                        <div className="space-y-1.5"><Label htmlFor="wizard-course-language">Kurs tili</Label>
                          <select id="wizard-course-language" className={selectClass} value={course.language} onChange={(e) => setCourse({ ...course, language: e.target.value })}>
                            <option value="uz">O'zbekcha</option><option value="ru">Ruscha</option><option value="en">Inglizcha</option>
                          </select></div>
                      </div>
                      <div className="space-y-1.5"><Label htmlFor="wizard-course-short">Kursning qisqa tavsifi</Label>
                        <Textarea id="wizard-course-short" rows={3} value={course.shortDescription} onChange={(e) => setCourse({ ...course, shortDescription: e.target.value })} /></div>
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
            )}

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              {step === 2 ? <Button variant="outline" onClick={back} disabled={busy}>Orqaga</Button>
                : <Button variant="outline" onClick={onClose}>Bekor qilish</Button>}
              <Button onClick={next} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {step === 1 ? "Keyingi" : course.enabled ? "Dastur va kursni yaratish" : "Dasturni yaratish"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
