import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle, XCircle, Trophy, Target, ArrowLeft, Award,
  TrendingUp, Calendar, Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTestResults } from "@/hooks/tests/useTests";
import { TestResult as TestResultType } from "@/types/test.types";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

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
