import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileQuestion, CheckCircle2, PlayCircle,
  Lock, BarChart3, Search, Trophy, Target, Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTests, useStartTest } from "@/hooks/tests/useTests";
import { TestCardSkeletonList } from "@/components/ui/skeletons";
import { useLoadingTransition } from "@/hooks/useLoadingTransition";
import { format } from "date-fns";
import { uz } from "date-fns/locale";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  upcoming:     { label: "Yaqinlashmoqda", cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
  completed:    { label: "Yakunlandi",     cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  "in-progress": { label: "Davom etmoqda", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  missed:       { label: "O'tkazib yuborildi", cls: "bg-slate-100  text-slate-600  dark:bg-slate-800/40  dark:text-slate-400"  },
};

export function StudentTests() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "completed" | "in-progress" | "missed">("all");

  // Fetch tests from API
  const { data: tests = [], isLoading, error, refetch } = useTests();

  // Apply loading transition with minimum 300ms display time (AC 9.7)
  const showLoading = useLoadingTransition(isLoading);

  // Filter and separate tests
  const { filteredTests, upcomingTests, completedTests, stats } = useMemo(() => {
    if (!tests) {
      return {
        filteredTests: [],
        upcomingTests: [],
        completedTests: [],
        stats: { total: 0, upcoming: 0, completed: 0, avgScore: 0 },
      };
    }

    // Apply search and status filters
    const filtered = tests.filter((t) => {
      const s = search.toLowerCase();
      const matchSearch = !s || t.title.toLowerCase().includes(s) || t.courseName.toLowerCase().includes(s);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });

    // Separate upcoming and completed
    const upcoming = filtered.filter((t) => t.status === "upcoming" || t.status === "in-progress");
    const completed = filtered.filter((t) => t.status === "completed");

    // Calculate stats
    const completedWithScores = tests.filter((t) => t.status === "completed" && t.score != null);
    const avgScore = completedWithScores.length > 0
      ? Math.round(completedWithScores.reduce((sum, t) => sum + (t.score ?? 0), 0) / completedWithScores.length)
      : 0;

    return {
      filteredTests: filtered,
      upcomingTests: upcoming,
      completedTests: completed,
      stats: {
        total: tests.length,
        upcoming: tests.filter((t) => t.status === "upcoming" || t.status === "in-progress").length,
        completed: tests.filter((t) => t.status === "completed").length,
        avgScore,
      },
    };
  }, [tests, search, statusFilter]);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Testlar</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Bilim tekshirish testlari va imtihonlar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Jami testlar",    value: stats.total,     icon: FileQuestion, cls: "" },
          { label: "Yaqinlashmoqda",  value: stats.upcoming,  icon: PlayCircle,   cls: "text-green-600" },
          { label: "Yakunlangan",     value: stats.completed, icon: CheckCircle2, cls: "text-blue-600"  },
          { label: "O'rtacha ball",   value: `${stats.avgScore}%`, icon: Trophy,  cls: "text-yellow-600" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${cls}`} />{label}
              </CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Test yoki kurs nomi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-wrap">
          {["all", "upcoming", "in-progress", "completed", "missed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status as any)}
              className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
            >
              {status === "all" ? "Barchasi" : STATUS_META[status]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {showLoading && <TestCardSkeletonList count={6} />}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center py-4 space-y-4">
              <p className="text-destructive">
                {error instanceof Error ? error.message : "Testlarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring."}
              </p>
              <Button 
                onClick={() => refetch()} 
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? "Yuklanmoqda..." : "Qayta urinish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test sections */}
      {!isLoading && !error && (
        <>
          {/* Upcoming Tests */}
          {upcomingTests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Yaqinlashmoqda</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingTests.map((test) => (
                  <TestCard key={test.id} test={test} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tests */}
          {completedTests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Yakunlangan testlar</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedTests.map((test) => (
                  <TestCard key={test.id} test={test} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredTests.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Test topilmadi
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Separate TestCard component for cleaner code
function TestCard({ test }: { test: any }) {
  const navigate = useNavigate();
  const startTestMutation = useStartTest();
  
  const statusMeta = STATUS_META[test.status];
  const isCompleted = test.status === "completed";
  const isUpcoming = test.status === "upcoming";
  const isInProgress = test.status === "in-progress";
  const isMissed = test.status === "missed";

  const handleStartTest = async () => {
    try {
      const session = await startTestMutation.mutateAsync(test.id);
      // Navigate to test session page with session ID
      navigate(`/student/tests/${test.id}/session`, { 
        state: { session } 
      });
    } catch (error) {
      // Error is handled by mutation hook with toast
      console.error('Failed to start test:', error);
    }
  };

  const handleContinueTest = () => {
    // For in-progress tests, navigate directly to session
    navigate(`/student/tests/${test.id}/session`);
  };

  const handleViewResults = () => {
    // Navigate to test results page
    navigate(`/student/tests/${test.id}/results`);
  };

  return (
    <Card className={isMissed ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            {isMissed ? (
              <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            ) : isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            ) : (
              <FileQuestion className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            )}
            <div>
              <CardTitle className="text-base leading-tight">{test.title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{test.courseName}</CardDescription>
            </div>
          </div>
          <Badge className={statusMeta.cls + " text-xs shrink-0"}>{statusMeta.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Test metadata */}
        <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
          <span>{format(new Date(test.date), "d MMMM, yyyy", { locale: uz })}</span>
          <span>•</span>
          <span>{test.startTime} - {test.endTime}</span>
          {test.proctoring && (
            <>
              <span>•</span>
              <Badge variant="outline" className="gap-1 text-xs">
                <Shield className="h-3 w-3" />
                Prokuror nazorati
              </Badge>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-semibold">{test.questionCount}</div>
            <div className="text-muted-foreground">Savol</div>
          </div>
          <div>
            <div className="font-semibold">{test.duration} daq</div>
            <div className="text-muted-foreground">Vaqt</div>
          </div>
          <div>
            <div className="font-semibold">{test.totalPoints}</div>
            <div className="text-muted-foreground">Ball</div>
          </div>
        </div>

        {/* Score display for completed tests */}
        {isCompleted && test.score != null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy className="h-3 w-3" />Natija
              </span>
              <span className="font-semibold">{test.score}%</span>
            </div>
            <Progress value={test.score} className="h-1.5" />
          </div>
        )}

        <Button
          className="w-full gap-2"
          size="sm"
          variant={isCompleted ? "outline" : "default"}
          disabled={isMissed || startTestMutation.isPending}
          onClick={
            isMissed ? undefined :
            isInProgress ? handleContinueTest :
            isCompleted ? handleViewResults :
            handleStartTest
          }
        >
          {isMissed ? (
            <><Lock className="h-3.5 w-3.5" />O'tkazib yuborildi</>
          ) : isInProgress ? (
            <><PlayCircle className="h-3.5 w-3.5" />Davom ettirish</>
          ) : isCompleted ? (
            <><BarChart3 className="h-3.5 w-3.5" />Natijalarni ko'rish</>
          ) : startTestMutation.isPending ? (
            <>Boshlanmoqda...</>
          ) : (
            <><PlayCircle className="h-3.5 w-3.5" />Boshlash</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}