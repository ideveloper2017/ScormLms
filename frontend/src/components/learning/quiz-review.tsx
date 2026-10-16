import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, PenLine, KeyRound, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { teacherPortalApi, type QuizReviewItem } from "@/services/api/teacher-portal-api";
import { fetchTestReview } from "@/services/test-api";

const display = (item: QuizReviewItem, value?: string | null) => {
  if (value == null || value === "") return "—";
  if (item.type === "TRUE_FALSE") return value.toLowerCase() === "true" ? "To'g'ri" : value.toLowerCase() === "false" ? "Noto'g'ri" : value;
  // Qisqa javobda bir nechta qabul qilinadigan variant `|` bilan saqlanadi.
  return item.type === "SHORT_ANSWER" ? value.split("|").map((part) => part.trim()).filter(Boolean).join(" yoki ") : value;
};

interface ItemsProps {
  items: QuizReviewItem[];
  /** O'qituvchi rejimi: qo'lda ball/izoh va kalitni tuzatish. */
  onGrade?: (item: QuizReviewItem, points: number, comment: string) => Promise<void>;
  onCorrectKey?: (item: QuizReviewItem, correctAnswer: string, points: number) => Promise<void>;
}

/** Savolma-savol tahlil: javob, to'g'ri javob, ball, izoh. Talaba sahifasida faqat o'qish uchun. */
export function QuizReviewItems({ items, onGrade, onCorrectKey }: ItemsProps) {
  return <div className="space-y-3">{items.map((item) => <ReviewItemCard key={item.questionId} item={item} onGrade={onGrade} onCorrectKey={onCorrectKey} />)}</div>;
}

function ReviewItemCard({ item, onGrade, onCorrectKey }: { item: QuizReviewItem } & Omit<ItemsProps, "items">) {
  const [grading, setGrading] = useState(false);
  const [points, setPoints] = useState(String(item.awardedPoints));
  const [comment, setComment] = useState(item.graderComment ?? "");
  const [keyEditing, setKeyEditing] = useState(false);
  const [key, setKey] = useState(item.correctAnswer);
  const [keyPoints, setKeyPoints] = useState(String(item.points));
  const [busy, setBusy] = useState(false);
  const full = item.awardedPoints === item.points;
  const partial = item.awardedPoints > 0 && !full;

  const run = async (action: () => Promise<void>, close: () => void) => {
    setBusy(true);
    // Xato toast orqali ko'rsatilgan — forma ochiq qoladi, qayta urinish mumkin.
    try { await action(); close(); } catch { /* toast ko'rsatildi */ } finally { setBusy(false); }
  };

  return <Card className={full ? "border-green-200" : partial ? "border-amber-200" : "border-red-200"}>
    <CardContent className="p-4 space-y-2">
      <div className="flex justify-between gap-3">
        <p className="font-medium"><span className="text-muted-foreground mr-1">{item.position}.</span>{item.text}</p>
        <Badge className={full ? "bg-green-100 text-green-800" : partial ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}>
          {full ? <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}{item.awardedPoints}/{item.points}
        </Badge>
      </div>
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        <p><span className="text-muted-foreground">Javob: </span>{display(item, item.answer)}</p>
        <p><span className="text-muted-foreground">To'g'ri javob: </span><span className="font-medium">{display(item, item.correctAnswer)}</span></p>
      </div>
      {item.explanation && <p className="text-sm rounded bg-muted p-2"><span className="font-medium">Izoh: </span>{item.explanation}</p>}
      {item.graderComment && <p className="text-sm flex gap-2"><MessageSquare className="h-4 w-4 mt-0.5 text-blue-600" /><span><span className="font-medium">O'qituvchi: </span>{item.graderComment}</span></p>}
      {item.manuallyGraded && <p className="text-xs text-muted-foreground">Ball o'qituvchi tomonidan qo'yilgan</p>}

      {(onGrade || onCorrectKey) && !grading && !keyEditing && <div className="flex flex-wrap gap-2 pt-1">
        {onGrade && <Button size="sm" variant="outline" onClick={() => setGrading(true)}><PenLine className="h-4 w-4 mr-1" />Ball qo'yish</Button>}
        {onCorrectKey && <Button size="sm" variant="ghost" onClick={() => setKeyEditing(true)}><KeyRound className="h-4 w-4 mr-1" />Kalitni tuzatish</Button>}
      </div>}

      {grading && onGrade && <div className="rounded border p-3 space-y-2">
        <div className="flex items-end gap-2">
          <div><Label>Ball (0–{item.points})</Label><Input className="w-24" type="number" min={0} max={item.points} value={points} onChange={(e) => setPoints(e.target.value)} /></div>
          <Button size="sm" disabled={busy || Number(points) < 0 || Number(points) > item.points} onClick={() => run(() => onGrade(item, Number(points), comment), () => setGrading(false))}>Saqlash</Button>
          <Button size="sm" variant="ghost" onClick={() => setGrading(false)}>Bekor qilish</Button>
        </div>
        <Textarea placeholder="Talabaga izoh (ixtiyoriy)" value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>}

      {keyEditing && onCorrectKey && <div className="rounded border border-amber-300 p-3 space-y-2">
        <p className="text-xs text-muted-foreground">Kalit tuzatilsa shu savolga javob bergan barcha talabalar qayta baholanadi; qo'lda qo'yilgan ballar saqlanadi.{item.type === "SHORT_ANSWER" && " Bir nechta to'g'ri variantni | bilan ajrating: 6 N|6N"}</p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[12rem]"><Label>To'g'ri javob</Label>{item.options?.length
            ? <select className="w-full border rounded h-9 px-2 bg-background" value={key} onChange={(e) => setKey(e.target.value)}>{item.options.map((option) => <option key={option} value={option}>{display(item, option)}</option>)}</select>
            : <Input value={key} onChange={(e) => setKey(e.target.value)} />}</div>
          <div><Label>Ball</Label><Input className="w-20" type="number" min={1} value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} /></div>
          <Button size="sm" disabled={busy || !key.trim() || Number(keyPoints) < 1} onClick={() => run(() => onCorrectKey(item, key, Number(keyPoints)), () => setKeyEditing(false))}>Tuzatish va qayta baholash</Button>
          <Button size="sm" variant="ghost" onClick={() => setKeyEditing(false)}>Bekor qilish</Button>
        </div>
      </div>}
    </CardContent>
  </Card>;
}

/** Talaba: test yopilgach o'z javoblari tahlili (ochiq paytda server ko'rsatmaydi). */
export function StudentQuizReviewCard({ testId, attemptId }: { testId: string; attemptId?: string }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ["tests", testId, "review", attemptId ?? "latest"],
    queryFn: () => fetchTestReview(testId, attemptId),
    enabled: open,
    retry: false,
  });
  const message = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message
    ?? (error as Error | null)?.message;

  return <Card className="mt-6">
    <CardContent className="pt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold">Javoblar tahlili</p><p className="text-sm text-muted-foreground">Qaysi savolda xato qilganingiz, to'g'ri javob va izoh. Test yopilgandan keyin ochiladi.</p></div>
        <Button variant="outline" onClick={() => setOpen((value) => !value)}>{open ? "Yopish" : "Ko'rish"}</Button>
      </div>
      {open && isLoading && <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>}
      {open && error && <p className="text-sm text-muted-foreground">{message}</p>}
      {open && data && <QuizReviewItems items={data.items} />}
    </CardContent>
  </Card>;
}

interface DialogProps {
  testId: string;
  attemptId: string | null;
  onClose: () => void;
  /** Ball o'zgargach ro'yxatni yangilash uchun. */
  onChanged?: () => void;
}

/** O'qituvchi: urinishni ko'rish, javobga qo'lda ball qo'yish, noto'g'ri kalitni tuzatish. */
export function QuizAttemptReviewDialog({ testId, attemptId, onClose, onChanged }: DialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["teacher", "tests", testId, "attempt-review", attemptId];
  const { data: review, isLoading } = useQuery({
    queryKey,
    queryFn: () => teacherPortalApi.getAttemptReview(testId, attemptId!),
    enabled: !!attemptId,
  });

  const grade = async (item: QuizReviewItem, points: number, comment: string) => {
    try {
      const updated = await teacherPortalApi.gradeAnswer(testId, attemptId!, item.questionId, points, comment);
      queryClient.setQueryData(queryKey, updated);
      onChanged?.();
      toast({ title: "Ball saqlandi", description: `${updated.score}/${updated.totalPoints} (${updated.percentage.toFixed(1)}%)` });
    } catch (e) {
      toast({ variant: "destructive", title: "Ball saqlanmadi", description: (e as Error).message });
      throw e;
    }
  };

  const correctKey = async (item: QuizReviewItem, correctAnswer: string, points: number) => {
    try {
      const result = await teacherPortalApi.correctAnswerKey(item.questionId, { correctAnswer, points });
      await queryClient.invalidateQueries({ queryKey });
      onChanged?.();
      toast({
        title: "Kalit tuzatildi, qayta baholandi",
        description: `${result.answersRegraded} javob qayta baholandi, ${result.manualAnswersKept} ta qo'lda baho saqlandi, ${result.scoresChanged} ta natija o'zgardi`,
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Kalit tuzatilmadi", description: (e as Error).message });
      throw e;
    }
  };

  return <Dialog open={!!attemptId} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{review ? `${review.studentName} · #${review.attemptNumber}` : "Urinish"}</DialogTitle>
        <DialogDescription>{review ? `${review.quizTitle} — ${review.score}/${review.totalPoints} (${review.percentage.toFixed(1)}%), ${review.passed ? "o'tdi" : "o'tmadi"}` : "Yuklanmoqda..."}</DialogDescription>
      </DialogHeader>
      {isLoading && <p className="text-muted-foreground">Yuklanmoqda...</p>}
      {review && <QuizReviewItems items={review.items} onGrade={grade} onCorrectKey={correctKey} />}
    </DialogContent>
  </Dialog>;
}
