import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Clock, AlertCircle, CheckCircle, Circle, ChevronLeft, ChevronRight,
  Send, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTest, useSubmitTest } from "@/hooks/tests/useTests";
import { TestSession as TestSessionType, TestQuestion } from "@/types/test.types";
import { format, differenceInSeconds } from "date-fns";
import { uz } from "date-fns/locale";

export function TestSession() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionFromState = location.state?.session as TestSessionType | undefined;

  // Fetch test details - always fetch from API
  const { data: test, isLoading, error } = useTest(testId!);
  const submitTestMutation = useSubmitTest();

  // Test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Use test data from API (fallback to state if available for initial load)
  const questions = useMemo(() => {
    if (test?.questions) return test.questions;
    if (sessionFromState?.questions) return sessionFromState.questions;
    return [];
  }, [test, sessionFromState]);

  const currentQuestion = questions[currentQuestionIndex];

  // Redirect if no testId or test not found
  useEffect(() => {
    if (!testId) {
      navigate('/student/tests', { replace: true });
    }
  }, [testId, navigate]);

  useEffect(() => {
    if (!isLoading && error) {
      navigate('/student/tests', { replace: true });
    }
  }, [isLoading, error, navigate]);

  // Initialize timer
  useEffect(() => {
    if (!test) return;

    const expiresAt = sessionFromState?.expiresAt || new Date(Date.now() + (test.duration || 0) * 60 * 1000);
    const updateTimer = () => {
      const remaining = differenceInSeconds(expiresAt, new Date());
      setTimeRemaining(Math.max(0, remaining));

      if (remaining <= 0) {
        handleAutoSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [test, sessionFromState]);

  // Handle auto-submit when time runs out
  const handleAutoSubmit = async () => {
    await handleSubmitTest();
  };

  // Handle answer selection
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Navigate between questions
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Jump to specific question
  const handleQuestionJump = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Calculate progress
  const answeredCount = Object.keys(answers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  // Submit test
  const handleSubmitTest = async () => {
    if (!testId) return;

    try {
      const payload = {
        answers: questions.map(q => ({
          questionId: q.id,
          answer: answers[q.id] || "",
        })),
        submittedAt: new Date(),
      };

      const result = await submitTestMutation.mutateAsync({ testId, payload });
      
      // Navigate to results page
      navigate(`/student/tests/${testId}/results`, {
        state: { result },
      });
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">Test yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // No test data
  if (!test || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Xatolik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Test ma'lumotlari topilmadi yoki test savollari mavjud emas.
            </p>
            <Button onClick={() => navigate('/student/tests')} className="w-full">
              Testlar sahifasiga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTimeWarning = timeRemaining > 0 && timeRemaining <= 300; // 5 minutes

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header with timer */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{test.title}</h1>
              <p className="text-sm text-muted-foreground">{test.courseName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
                isTimeWarning ? 'bg-destructive/10 text-destructive' : 'bg-muted'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg font-bold">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={submitTestMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" />
                Topshirish
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Javob berilgan: {answeredCount} / {questions.length}
              </span>
              <span className="font-medium">{progressPercent.toFixed(0)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question navigation sidebar */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Savollar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionJump(idx)}
                      className={`
                        aspect-square rounded-md flex items-center justify-center text-sm font-medium
                        transition-colors
                        ${isCurrent
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                          : isAnswered
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-muted hover:bg-muted/80'
                        }
                      `}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-primary" />
                  <span>Joriy savol</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-900/30" />
                  <span>Javob berilgan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded bg-muted" />
                  <span>Javob berilmagan</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question display */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Savol {currentQuestionIndex + 1} / {questions.length}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant="outline">{currentQuestion.type}</Badge>
                      <span className="ml-2">{currentQuestion.points} ball</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-base leading-relaxed">{currentQuestion.text}</p>
                </div>

                {/* Answer input based on question type */}
                {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
                        >
                          <RadioGroupItem value={option} id={`option-${idx}`} />
                          <Label
                            htmlFor={`option-${idx}`}
                            className="flex-1 cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.type === 'true-false' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="true" id="true" />
                        <Label htmlFor="true" className="flex-1 cursor-pointer">
                          To'g'ri
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="false" id="false" />
                        <Label htmlFor="false" className="flex-1 cursor-pointer">
                          Noto'g'ri
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                )}

                {(currentQuestion.type === 'short-answer' || currentQuestion.type === 'essay') && (
                  <Textarea
                    placeholder="Javobingizni kiriting..."
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    rows={currentQuestion.type === 'essay' ? 10 : 3}
                    className="resize-none"
                  />
                )}
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Oldingi savol
              </Button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={handleNext}>
                  Keyingi savol
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => setShowSubmitDialog(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  Testni topshirish
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Testni topshirish
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Testni topshirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
              </p>
              <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                <p>Jami savollar: {questions.length}</p>
                <p>Javob berilgan: {answeredCount}</p>
                <p className="text-destructive">
                  Javob berilmagan: {questions.length - answeredCount}
                </p>
              </div>
              {answeredCount < questions.length && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Eslatma: Ba'zi savollarga javob berilmagan. Ular 0 ball deb hisoblanadi.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitTest}
              disabled={submitTestMutation.isPending}
            >
              {submitTestMutation.isPending ? 'Yuborilmoqda...' : 'Topshirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
