import { useState } from "react";
import {
  FileQuestion, Clock, CheckCircle2, PlayCircle,
  Lock, BarChart3, Search, Trophy, Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Test {
  id: number;
  title: string;
  course: string;
  questions: number;
  duration: number; // minutes
  attempts: number;
  maxAttempts: number;
  status: "available" | "completed" | "in-progress" | "locked";
  bestScore?: number;
  lastAttemptDate?: string;
  category: "quiz" | "midterm" | "practice" | "final";
  difficulty: "easy" | "medium" | "hard";
}

const TESTS: Test[] = [
  { id: 1, title: "JavaScript Asoslari — 1-modul testi", course: "Dasturlash asoslari", questions: 20, duration: 30, attempts: 1, maxAttempts: 3, status: "completed", bestScore: 90, lastAttemptDate: "2025-06-10", category: "quiz", difficulty: "easy" },
  { id: 2, title: "SQL JOIN operatorlari", course: "Ma'lumotlar bazasi", questions: 15, duration: 25, attempts: 0, maxAttempts: 2, status: "available", category: "practice", difficulty: "medium" },
  { id: 3, title: "Algoritmlar — Oraliq nazorat", course: "Algoritmlar nazariyasi", questions: 40, duration: 60, attempts: 0, maxAttempts: 1, status: "available", category: "midterm", difficulty: "hard" },
  { id: 4, title: "HTML/CSS Tezkor test", course: "Web dasturlash", questions: 10, duration: 15, attempts: 2, maxAttempts: 2, status: "completed", bestScore: 80, lastAttemptDate: "2025-06-08", category: "quiz", difficulty: "easy" },
  { id: 5, title: "Fizika — Mexanika bo'limi", course: "Fizika", questions: 30, duration: 45, attempts: 1, maxAttempts: 3, status: "in-progress", bestScore: 60, category: "quiz", difficulty: "medium" },
  { id: 6, title: "Matematika — Integrallash", course: "Matematik tahlil", questions: 25, duration: 40, attempts: 0, maxAttempts: 1, status: "locked", category: "midterm", difficulty: "hard" },
  { id: 7, title: "Ingliz tili — Grammar testi", course: "Ingliz tili", questions: 30, duration: 30, attempts: 0, maxAttempts: 3, status: "available", category: "practice", difficulty: "easy" },
  { id: 8, title: "Python dasturlash tili", course: "Dasturlash asoslari", questions: 35, duration: 50, attempts: 0, maxAttempts: 1, status: "available", category: "quiz", difficulty: "medium" },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  available:   { label: "Ochiq",        cls: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300"  },
  completed:   { label: "Yakunlandi",   cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  "in-progress":{ label: "Davom etmoqda", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  locked:      { label: "Yopiq",        cls: "bg-slate-100  text-slate-600  dark:bg-slate-800/40  dark:text-slate-400"  },
};

const CAT_META: Record<string, { label: string; cls: string }> = {
  quiz:     { label: "Test",          cls: "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300"   },
  midterm:  { label: "Oraliq nazorat", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  practice: { label: "Mashq",         cls: "bg-teal-100   text-teal-800   dark:bg-teal-900/30   dark:text-teal-300"   },
  final:    { label: "Yakuniy",       cls: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300"    },
};

const DIFF_META: Record<string, { label: string; cls: string }> = {
  easy:   { label: "Oson",    cls: "text-green-600" },
  medium: { label: "O'rta",   cls: "text-yellow-600" },
  hard:   { label: "Qiyin",   cls: "text-red-600" },
};

export function StudentTests() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = TESTS.filter((t) => {
    const s = search.toLowerCase();
    const matchSearch = !s || t.title.toLowerCase().includes(s) || t.course.toLowerCase().includes(s);
    const matchCat = catFilter === "all" || t.category === catFilter;
    return matchSearch && matchCat;
  });

  const stats = {
    total:     TESTS.length,
    available: TESTS.filter((t) => t.status === "available").length,
    completed: TESTS.filter((t) => t.status === "completed").length,
    avgScore:  Math.round(TESTS.filter((t) => t.bestScore != null).reduce((a, t) => a + (t.bestScore ?? 0), 0) / TESTS.filter((t) => t.bestScore != null).length || 0),
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testlar</h1>
          <p className="text-muted-foreground">Bilim tekshirish testlari va mashqlar</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Jami testlar",    value: stats.total,     icon: FileQuestion, cls: "" },
          { label: "Ochiq",           value: stats.available, icon: PlayCircle,   cls: "text-green-600" },
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Test yoki kurs nomi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {["all", "quiz", "practice", "midterm", "final"].map((cat) => (
            <Button
              key={cat}
              variant={catFilter === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCatFilter(cat)}
              className="text-xs"
            >
              {cat === "all" ? "Barchasi" : CAT_META[cat]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Test cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">Test topilmadi</div>
        )}
        {filtered.map((test) => {
          const statusMeta = STATUS_META[test.status];
          const catMeta = CAT_META[test.category];
          const diffMeta = DIFF_META[test.difficulty];
          const isLocked = test.status === "locked";
          const isCompleted = test.status === "completed";
          const attemptsLeft = test.maxAttempts - test.attempts;

          return (
            <Card key={test.id} className={isLocked ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    ) : (
                      <FileQuestion className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <CardTitle className="text-base leading-tight">{test.title}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{test.course}</CardDescription>
                    </div>
                  </div>
                  <Badge className={statusMeta.cls + " text-xs shrink-0"}>{statusMeta.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge className={catMeta.cls + " text-xs"}>{catMeta.label}</Badge>
                  <span className={`text-xs font-medium ${diffMeta.cls}`}>{diffMeta.label}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-semibold">{test.questions}</div>
                    <div className="text-muted-foreground">Savol</div>
                  </div>
                  <div>
                    <div className="font-semibold">{test.duration} daq</div>
                    <div className="text-muted-foreground">Vaqt</div>
                  </div>
                  <div>
                    <div className="font-semibold">{attemptsLeft}/{test.maxAttempts}</div>
                    <div className="text-muted-foreground">Urinish</div>
                  </div>
                </div>

                {test.bestScore != null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Trophy className="h-3 w-3" />Eng yuqori natija
                      </span>
                      <span className="font-semibold">{test.bestScore}%</span>
                    </div>
                    <Progress value={test.bestScore} className="h-1.5" />
                  </div>
                )}

                <Button
                  className="w-full gap-2"
                  size="sm"
                  variant={isCompleted ? "outline" : "default"}
                  disabled={isLocked || attemptsLeft === 0}
                >
                  {isLocked ? (
                    <><Lock className="h-3.5 w-3.5" />Yopiq</>
                  ) : test.status === "in-progress" ? (
                    <><PlayCircle className="h-3.5 w-3.5" />Davom ettirish</>
                  ) : isCompleted && attemptsLeft > 0 ? (
                    <><Target className="h-3.5 w-3.5" />Qayta urinish</>
                  ) : isCompleted ? (
                    <><BarChart3 className="h-3.5 w-3.5" />Natijalarni ko'rish</>
                  ) : (
                    <><PlayCircle className="h-3.5 w-3.5" />Boshlash</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}