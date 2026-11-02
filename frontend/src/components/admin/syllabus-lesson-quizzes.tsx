import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Loader2, MessageCircleQuestion, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { extractApiError } from "@/lib/academic-api";
import {
  syllabusApi, type LessonQuestionType, type LessonQuiz, type LessonQuizInput, type LessonQuizKind, type LessonQuizQuestion,
  type LessonQuizzesResult, type SyllabusLinkedCourse,
} from "@/services/api/syllabus-api";

const select = "h-10 rounded-md border bg-background px-3 text-sm";
const KINDS: Record<LessonQuizKind, { label: string; icon: typeof ClipboardCheck }> = {
  TEST: { label: "Test", icon: ClipboardCheck },
  QUESTION: { label: "Savol / Javob", icon: MessageCircleQuestion },
};
const QUESTION_TYPES: { value: LessonQuestionType; label: string }[] = [
  { value: "SINGLE_CHOICE", label: "Variantli" },
  { value: "TRUE_FALSE", label: "To'g'ri / noto'g'ri" },
  { value: "SHORT_ANSWER", label: "Qisqa javob" },
];
const ATTEMPTS = [1, 2, 3, 5, 10, 20];
const emptyQuestion = (): LessonQuizQuestion => ({ text: "", type: "SINGLE_CHOICE", options: ["", ""], correctAnswer: "", explanation: "", points: 1 });

/** Savollar test tizimi qoidalari bilan tekshiriladi (backend ham shu qoidani qo'llaydi) */
export function questionProblem(question: LessonQuizQuestion, index: number): string | null {
  const n = `${index + 1}-savol`;
  if (!question.text.trim()) return `${n}: matn kiritilmagan`;
  if (question.type === "SINGLE_CHOICE") {
    const options = question.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return `${n}: kamida 2 variant kiriting`;
    if (!options.includes(question.correctAnswer.trim())) return `${n}: to'g'ri variantni belgilang`;
  }
  if (question.type === "SHORT_ANSWER" && !question.correctAnswer.trim()) return `${n}: to'g'ri javobni kiriting`;
  if (question.type === "TRUE_FALSE" && !["true", "false"].includes(question.correctAnswer)) return `${n}: to'g'ri javobni tanlang`;
  return null;
}

/**
 * Dars testlari (Everest: dars -> resurslar -> Test, Savol / Javob). Test — vaqtli, bir nechta savol, darsga bitta;
 * Savol/Javob — bitta savol, urinishlar soni bilan. Kursga test sifatida tushadi (qoralama, o'qituvchi nashr qiladi).
 */
export function LessonQuizzes({ syllabusId, lessonId, editable, onChanged }: {
  syllabusId: number;
  lessonId: number;
  editable: boolean;
  /** Ro'yxat o'zgarganda: yangi soni va bog'langan kurslar holati (xabar uchun) */
  onChanged: (count: number, title: string, courses: SyllabusLinkedCourse[]) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const key = ["syllabus", syllabusId, "lesson", lessonId, "quizzes"];
  const quizzes = useQuery({ queryKey: key, queryFn: () => syllabusApi.lessonQuizzes(syllabusId, lessonId) });
  const [editing, setEditing] = useState<LessonQuiz | LessonQuizKind | null>(null);
  const list = quizzes.data ?? [];
  const hasTest = list.some((q) => q.kind === "TEST");

  const applied = (result: LessonQuizzesResult, title: string) => {
    queryClient.setQueryData(key, result.quizzes);
    onChanged(result.quizzes.length, title, result.courses);
  };
  const remove = useMutation({
    mutationFn: (id: number) => syllabusApi.deleteLessonQuiz(syllabusId, lessonId, id),
    onSuccess: (result) => applied(result, "Test o'chirildi"),
    onError: (e) => toast({ variant: "destructive", title: "Test o'chirilmadi", description: extractApiError(e, "Test o'chirilmadi").message }),
  });

  return <div className="space-y-2">
    {quizzes.isLoading && <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>}
    <ol className="space-y-2">
      {list.map((quiz) => {
        const meta = KINDS[quiz.kind];
        const Icon = meta.icon;
        return typeof editing === "object" && editing?.id === quiz.id
          ? <li key={quiz.id}><QuizForm syllabusId={syllabusId} lessonId={lessonId} kind={quiz.kind} quiz={quiz}
              onCancel={() => setEditing(null)} onSaved={(result) => { setEditing(null); applied(result, "Test saqlandi"); }} /></li>
          : <li key={quiz.id} aria-label={quiz.title} className="flex items-start gap-3 rounded-lg border p-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{quiz.title}</p>
              <p className="text-xs text-muted-foreground">
                {quiz.kind === "TEST"
                  ? `${quiz.questions.length} ta savol · ${quiz.durationMinutes} daqiqa · o'tish ${quiz.passingPercentage}% · ${quiz.allowedAttempts} urinish`
                  : `${quiz.questions[0]?.text ?? ""} · ${quiz.allowedAttempts} urinish`}
              </p>
            </div>
            <Badge variant="outline">{meta.label}</Badge>
            {editable && <>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`${quiz.title} — tahrirlash`} onClick={() => setEditing(quiz)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`${quiz.title} — o'chirish`} disabled={remove.isPending} onClick={() => remove.mutate(quiz.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </>}
          </li>;
      })}
    </ol>
    {(editing === "TEST" || editing === "QUESTION") && <QuizForm syllabusId={syllabusId} lessonId={lessonId} kind={editing}
      onCancel={() => setEditing(null)} onSaved={(result) => { setEditing(null); applied(result, `${KINDS[editing].label} qo'shildi`); }} />}
    {editable && editing == null && <div className="flex flex-wrap gap-2">
      <Button variant="outline" disabled={hasTest} title={hasTest ? "Darsga test faqat bir marta qo'shiladi" : undefined} onClick={() => setEditing("TEST")}>
        <Plus className="mr-2 h-4 w-4" />Test qo'shish</Button>
      <Button variant="outline" onClick={() => setEditing("QUESTION")}><Plus className="mr-2 h-4 w-4" />Savol / Javob qo'shish</Button>
    </div>}
  </div>;
}

function QuizForm({ syllabusId, lessonId, kind, quiz, onCancel, onSaved }: {
  syllabusId: number;
  lessonId: number;
  kind: LessonQuizKind;
  quiz?: LessonQuiz;
  onCancel: () => void;
  onSaved: (result: LessonQuizzesResult) => void;
}) {
  const isTest = kind === "TEST";
  const [title, setTitle] = useState(quiz?.title ?? (isTest ? "Dars testi" : ""));
  const [instructions, setInstructions] = useState(quiz?.instructions ?? "");
  const [duration, setDuration] = useState(quiz?.durationMinutes ?? 20);
  const [passing, setPassing] = useState(quiz?.passingPercentage ?? 60);
  const [attempts, setAttempts] = useState(quiz?.allowedAttempts ?? (isTest ? 1 : 3));
  const [questions, setQuestions] = useState<LessonQuizQuestion[]>(quiz?.questions.map((q) => ({
    ...q, options: q.type === "SINGLE_CHOICE" ? q.options : ["", ""], explanation: q.explanation ?? "",
  })) ?? [emptyQuestion()]);
  const [error, setError] = useState<string | null>(null);
  const change = (index: number, value: Partial<LessonQuizQuestion>) =>
    setQuestions((list) => list.map((q, i) => (i === index ? { ...q, ...value } : q)));
  const invalid = title.trim().length < 2 ? "Nomi kamida 2 belgi"
    : isTest && !(duration >= 1 && duration <= 1440) ? "Davomiylik 1-1440 daqiqa"
      : isTest && !(passing >= 0 && passing <= 100) ? "O'tish foizi 0-100"
        : questions.map(questionProblem).find(Boolean) ?? null;
  const save = useMutation({
    mutationFn: () => {
      const input: LessonQuizInput = {
        kind, title: title.trim(), instructions: instructions.trim() || null, allowedAttempts: attempts,
        durationMinutes: isTest ? duration : null, passingPercentage: isTest ? passing : null,
        questions: questions.map((q) => ({
          text: q.text.trim(), type: q.type, points: q.points, explanation: q.explanation?.trim() || null,
          options: q.type === "SINGLE_CHOICE" ? q.options.map((o) => o.trim()).filter(Boolean) : [],
          correctAnswer: q.correctAnswer.trim(),
        })),
      };
      return quiz ? syllabusApi.updateLessonQuiz(syllabusId, lessonId, quiz.id, input) : syllabusApi.createLessonQuiz(syllabusId, lessonId, input);
    },
    onSuccess: onSaved,
    onError: (e) => setError(extractApiError(e, "Saqlanmadi").message),
  });

  return <div className="space-y-3 rounded-lg border bg-muted/30 p-3" aria-label={isTest ? "Test formasi" : "Savol / Javob formasi"}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold">{quiz ? `${KINDS[kind].label}ni tahrirlash` : `Yangi ${KINDS[kind].label.toLowerCase()}`}</p>
      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Bekor qilish" onClick={onCancel}><X className="h-4 w-4" /></Button>
    </div>
    <div className="space-y-1.5"><Label htmlFor="lq-title">Nomi *</Label>
      <Input id="lq-title" value={title} maxLength={255} placeholder={isTest ? "Masalan: 1-mavzu testi" : "Masalan: Tezlik nima?"} onChange={(e) => setTitle(e.target.value)} /></div>
    <div className="grid gap-3 sm:grid-cols-3">
      {isTest && <div className="space-y-1.5"><Label htmlFor="lq-duration">Davomiyligi (daqiqa) *</Label>
        <Input id="lq-duration" type="number" min={1} max={1440} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>}
      {isTest && <div className="space-y-1.5"><Label htmlFor="lq-passing">O'tish foizi *</Label>
        <Input id="lq-passing" type="number" min={0} max={100} value={passing} onChange={(e) => setPassing(Number(e.target.value))} /></div>}
      <div className="space-y-1.5"><Label htmlFor="lq-attempts">Urinishlar soni</Label>
        <select id="lq-attempts" className={`${select} w-full`} value={attempts} onChange={(e) => setAttempts(Number(e.target.value))}>
          {ATTEMPTS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select></div>
    </div>
    {isTest && <div className="space-y-1.5"><Label htmlFor="lq-instructions">Ko'rsatma</Label>
      <Textarea id="lq-instructions" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} /></div>}
    <ol className="space-y-3">
      {questions.map((question, index) => <li key={index} aria-label={`${index + 1}-savol`} className="space-y-2 rounded-md border bg-background p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{index + 1}.</span>
          <select aria-label={`${index + 1}-savol turi`} className={`${select} w-44`} value={question.type}
            onChange={(e) => change(index, { type: e.target.value as LessonQuestionType, correctAnswer: e.target.value === "TRUE_FALSE" ? "true" : "" })}>
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {isTest && <Input aria-label={`${index + 1}-savol balli`} type="number" min={1} max={1000} className="w-20" value={question.points}
            onChange={(e) => change(index, { points: Number(e.target.value) || 1 })} />}
          {isTest && questions.length > 1 && <Button variant="ghost" size="icon" className="ml-auto h-7 w-7 text-destructive" aria-label={`${index + 1}-savolni o'chirish`}
            onClick={() => setQuestions((list) => list.filter((_, i) => i !== index))}><Trash2 className="h-3.5 w-3.5" /></Button>}
        </div>
        <Textarea aria-label={`${index + 1}-savol matni`} rows={2} placeholder="Savol matni" value={question.text} onChange={(e) => change(index, { text: e.target.value })} />
        {question.type === "SINGLE_CHOICE" && <div className="space-y-1.5" role="radiogroup" aria-label={`${index + 1}-savol variantlari`}>
          {question.options.map((option, optionIndex) => <div key={optionIndex} className="flex items-center gap-2">
            <input type="radio" name={`lq-${index}-correct`} aria-label={`${optionIndex + 1}-variant to'g'ri`}
              checked={!!option.trim() && question.correctAnswer.trim() === option.trim()} onChange={() => change(index, { correctAnswer: option })} />
            <Input aria-label={`${index + 1}-savol ${optionIndex + 1}-variant`} placeholder={`${optionIndex + 1}-variant`} value={option}
              onChange={(e) => {
                const options = question.options.map((o, i) => (i === optionIndex ? e.target.value : o));
                change(index, { options, correctAnswer: question.correctAnswer === option && option ? e.target.value : question.correctAnswer });
              }} />
            {question.options.length > 2 && <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Variantni o'chirish"
              onClick={() => change(index, { options: question.options.filter((_, i) => i !== optionIndex) })}><X className="h-3.5 w-3.5" /></Button>}
          </div>)}
          {question.options.length < 8 && <Button variant="link" size="sm" className="h-auto p-0" onClick={() => change(index, { options: [...question.options, ""] })}>+ variant</Button>}
        </div>}
        {question.type === "TRUE_FALSE" && <select aria-label={`${index + 1}-savol to'g'ri javobi`} className={`${select} w-40`} value={question.correctAnswer}
          onChange={(e) => change(index, { correctAnswer: e.target.value })}>
          <option value="true">To'g'ri</option><option value="false">Noto'g'ri</option>
        </select>}
        {question.type === "SHORT_ANSWER" && <Input aria-label={`${index + 1}-savol to'g'ri javobi`} placeholder="To'g'ri javob (bir nechta bo'lsa | bilan: 6 N|6N)"
          value={question.correctAnswer} onChange={(e) => change(index, { correctAnswer: e.target.value })} />}
        <Input aria-label={`${index + 1}-savol izohi`} placeholder="Izoh (natijada ko'rsatiladi)" value={question.explanation ?? ""}
          onChange={(e) => change(index, { explanation: e.target.value })} />
      </li>)}
    </ol>
    {isTest && <Button variant="outline" size="sm" onClick={() => setQuestions((list) => [...list, emptyQuestion()])}><Plus className="mr-1.5 h-3.5 w-3.5" />Savol qo'shish</Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex items-center justify-end gap-2">
      {invalid && <span className="mr-auto text-xs text-muted-foreground">{invalid}</span>}
      <Button variant="outline" onClick={onCancel}>Bekor qilish</Button>
      <Button disabled={!!invalid || save.isPending} onClick={() => save.mutate()}>
        {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Saqlash
      </Button>
    </div>
  </div>;
}
