import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, Trophy, Target, ArrowLeft, Award,
  TrendingUp, Calendar, ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useTestResults } from "@/hooks/tests/useTests";
import { useToast } from "@/hooks/use-toast";
import { qk } from "@/lib/query-keys";
import { proctoringAppealApi } from "@/services/api/proctoring-appeal-api";
import { TestResult as TestResultType } from "@/types/test.types";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

const PROCTOR_EVENT_LABELS: Record<string, string> = {
  camera_stopped: "Kamera to'xtadi",
  camera_permission_denied: "Kamera ruxsati rad etildi",
  tab_hidden: "Test tabi yashirildi",
  window_blurred: "Oyna fokusni yo'qotdi",
  network_offline: "Tarmoq uzildi",
  page_exit: "Test sahifasidan chiqildi",
};

function ProctoringAppealCard({ quizId, attemptId }: { quizId: string; attemptId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [eventIds, setEventIds] = useState<string[]>([]);
  const context = useQuery({
    queryKey: qk.tests.proctoringAppeal(attemptId),
    queryFn: () => proctoringAppealApi.getContext(quizId, attemptId),
  });
  const create = useMutation({
    mutationFn: () => proctoringAppealApi.create(quizId, attemptId, reason.trim(), eventIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: qk.tests.proctoringAppeal(attemptId) });
      setReason("");
      setEventIds([]);
      toast({ title: "Proktoring apellyatsiyasi yuborildi" });
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Apellyatsiya yuborilmadi", description: error.message }),
  });
  const data = context.data;

  return <Card className="mt-6 border-amber-300 dark:border-amber-900">
    <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-amber-600" />Proktoring apellyatsiyasi</CardTitle><CardDescription>Faqat qayd etilgan risk hodisasini izoh bilan qo'lda qayta ko'rib chiqishga yuboradi. Asl dalil o'zgarmaydi.</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      {context.isLoading && <p className="text-sm text-muted-foreground">Apellyatsiya ma'lumoti yuklanmoqda...</p>}
      {context.error && <p className="text-sm text-destructive">Ma'lumot yuklanmadi: {(context.error as Error).message}</p>}
      {data?.appeal && <div className="rounded-lg border p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">Yuborilgan murojaat</span><Badge variant={data.appeal.status === 'approved' ? 'default' : data.appeal.status === 'rejected' ? 'destructive' : 'outline'}>{data.appeal.status.toUpperCase()}</Badge></div>
        <p className="text-sm">{data.appeal.reason}</p>
        <p className="text-xs text-muted-foreground">{new Date(data.appeal.requestedAt).toLocaleString('uz-Latn')} · {data.appeal.disputedEvents.length} ta hodisa</p>
        {data.appeal.decision && <div className="rounded bg-muted p-3 text-sm"><span className="font-medium">Yakuniy qaror:</span> {data.appeal.decision}<span className="block text-xs text-muted-foreground mt-1">{data.appeal.reviewedBy} · {data.appeal.reviewedAt ? new Date(data.appeal.reviewedAt).toLocaleString('uz-Latn') : ''}</span></div>}
      </div>}
      {data && !data.appeal && !data.eligible && <p className="text-sm text-muted-foreground">Apellyatsiya muddati yoki urinish holati murojaat yuborishga ruxsat bermaydi. Muddat: {new Date(data.deadline).toLocaleString('uz-Latn')}</p>}
      {data?.eligible && <>
        <div className="space-y-2"><p className="text-sm font-medium">Qayta ko'riladigan risk hodisalari</p>{data.riskEvents.length === 0 && <p className="text-sm text-muted-foreground">Apellyatsiya uchun risk hodisasi qayd etilmagan.</p>}{data.riskEvents.map(event => <label key={event.id} className="flex items-start gap-3 rounded border p-3 cursor-pointer"><Checkbox checked={eventIds.includes(event.id)} onCheckedChange={() => setEventIds(current => current.includes(event.id) ? current.filter(id => id !== event.id) : [...current, event.id])} /><span className="text-sm"><span className="font-medium">{PROCTOR_EVENT_LABELS[event.type] ?? event.type}</span><span className="block text-xs text-muted-foreground">{event.severity.toUpperCase()} · {new Date(event.occurredAt).toLocaleString('uz-Latn')}</span></span></label>)}</div>
        <Textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={2000} placeholder="Texnik yoki boshqa uzrli holatni 10-2000 belgi bilan tushuntiring" />
        <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Muddat: {new Date(data.deadline).toLocaleString('uz-Latn')}</p><Button onClick={() => create.mutate()} disabled={reason.trim().length < 10 || eventIds.length === 0 || create.isPending}>{create.isPending ? "Yuborilmoqda..." : "Apellyatsiya yuborish"}</Button></div>
      </>}
    </CardContent>
  </Card>;
}

export function TestResults() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const resultFromState = location.state?.result as TestResultType | undefined;

  // Fetch test results if not passed via state
  const { data: resultFromApi, isLoading } = useTestResults(testId!);
  
  const result = resultFromState || resultFromApi;

  // Loading state
  if (isLoading && !resultFromState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Natijalar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // No result data
  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Natijalar topilmadi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Test natijalari topilmadi.
            </p>
            <Button onClick={() => navigate('/student/tests')} className="w-full">
              Testlar sahifasiga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPassed = result.passed;
  const scoreColor = isPassed ? 'text-green-600' : 'text-red-600';
  const bgColor = isPassed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/student/tests')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Testlar sahifasiga qaytish
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Result header card */}
        <Card className={`mb-6 ${bgColor}`}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {isPassed ? (
                  <div className="rounded-full bg-green-500/10 p-4">
                    <CheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                ) : (
                  <div className="rounded-full bg-red-500/10 p-4">
                    <XCircle className="h-16 w-16 text-red-600" />
                  </div>
                )}
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {isPassed ? 'Tabriklaymiz!' : 'Test yakunlandi'}
                </h1>
                <p className="text-muted-foreground">
                  {isPassed
                    ? 'Siz testdan muvaffaqiyatli o\'tdingiz'
                    : 'Afsuski, bu safar test topshira olmadingiz'
                  }
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Trophy className={`h-8 w-8 ${scoreColor}`} />
                <span className={`text-6xl font-bold ${scoreColor}`}>
                  {result.percentage.toFixed(1)}%
                </span>
              </div>

              <div className="text-muted-foreground">
                <span className="text-2xl font-semibold">
                  {result.score} / {result.totalPoints}
                </span>
                <span className="ml-2">ball</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                To'plangan ball
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{result.score}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Maksimal: {result.totalPoints}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Foiz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{result.percentage.toFixed(1)}%</div>
              <Progress value={result.percentage} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                className={`text-base px-3 py-1 ${
                  isPassed
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                {isPassed ? 'O\'tdi' : 'O\'tmadi'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {isPassed ? 'Minimal balldan yuqori' : 'Minimal balldan past'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional info */}
        <Card>
          <CardHeader>
            <CardTitle>Test ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Topshirilgan sana:</span>
              <span className="font-medium">
                {format(new Date(result.submittedAt), "d MMMM yyyy, HH:mm", { locale: uz })}
              </span>
            </div>

            {result.feedback && (
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  O'qituvchi izohi
                </h4>
                <p className="text-sm text-muted-foreground">{result.feedback}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={() => navigate('/student/tests')} className="flex-1">
                Testlar ro'yxatiga qaytish
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/student/grades')}
                className="flex-1"
              >
                Baholarni ko'rish
              </Button>
            </div>
          </CardContent>
        </Card>

        {result.proctoring && <ProctoringAppealCard quizId={result.testId} attemptId={result.id} />}

        {/* Motivational message */}
        {!isPassed && (
          <Card className="mt-6 border-yellow-200 dark:border-yellow-900">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-muted-foreground">
                💪 Xafa bo'lmang! Har bir muvaffaqiyatsizlik yangi bilim va tajriba. 
                Yana bir bor harakat qiling va albatta muvaffaqiyatga erishasiz!
              </p>
            </CardContent>
          </Card>
        )}

        {isPassed && result.percentage >= 90 && (
          <Card className="mt-6 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="pt-6">
              <p className="text-center text-sm flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                  A'lo natija! Siz ajoyib bilim namoyon etdingiz! 🌟
                </span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
