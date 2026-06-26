import { useState } from "react";
import { BookMarked, Plus, Search, Calendar, GraduationCap, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface StudyPlan {
  id: number;
  name: string;
  program: string;
  year: number;
  totalCredits: number;
  completedCredits: number;
  subjects: number;
  semesters: number;
  status: "active" | "draft" | "archived";
}

const MOCK_PLANS: StudyPlan[] = [
  { id: 1, name: "Kompyuter muhandisligi — 2024/2025", program: "Kompyuter muhandisligi", year: 2024, totalCredits: 240, completedCredits: 180, subjects: 42, semesters: 8, status: "active" },
  { id: 2, name: "Axborot tizimlari — 2024/2025", program: "Axborot tizimlari", year: 2024, totalCredits: 240, completedCredits: 120, subjects: 38, semesters: 8, status: "active" },
  { id: 3, name: "Dasturiy muhandislik — 2023/2024", program: "Dasturiy muhandislik", year: 2023, totalCredits: 240, completedCredits: 240, subjects: 40, semesters: 8, status: "archived" },
  { id: 4, name: "Sun'iy intellekt — 2025/2026", program: "Sun'iy intellekt", year: 2025, totalCredits: 240, completedCredits: 0, subjects: 45, semesters: 8, status: "draft" },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  active:   { label: "Faol",       cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"  },
  draft:    { label: "Qoralama",   cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  archived: { label: "Arxivlangan", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400"  },
};

export function AdminStudyPlans() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_PLANS.filter((p) =>
    !search.trim() ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.program.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    active:   MOCK_PLANS.filter((p) => p.status === "active").length,
    draft:    MOCK_PLANS.filter((p) => p.status === "draft").length,
    archived: MOCK_PLANS.filter((p) => p.status === "archived").length,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">O'quv Reja</h1>
          <p className="text-muted-foreground">Ta'lim dasturlari uchun o'quv rejalari</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />Yangi O'quv Reja
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Faol", value: stats.active,   cls: "text-green-600"  },
          { label: "Qoralama", value: stats.draft, cls: "text-yellow-600" },
          { label: "Arxiv",   value: stats.archived, cls: "text-slate-500" },
        ].map(({ label, value, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cls}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="O'quv reja qidiring..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((plan) => {
          const pct = plan.totalCredits > 0 ? Math.round((plan.completedCredits / plan.totalCredits) * 100) : 0;
          const meta = STATUS_META[plan.status];
          return (
            <Card key={plan.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <BookMarked className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base leading-tight">{plan.name}</CardTitle>
                      <CardDescription className="text-xs">{plan.program}</CardDescription>
                    </div>
                  </div>
                  <Badge className={meta.cls}>{meta.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="flex flex-col items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold">{plan.year}</span>
                    <span className="text-muted-foreground">Yil</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold">{plan.subjects}</span>
                    <span className="text-muted-foreground">Fan</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-semibold">{plan.semesters}</span>
                    <span className="text-muted-foreground">Semestr</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Kreditlar</span>
                    <span className="font-medium">{plan.completedCredits}/{plan.totalCredits}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="text-xs text-right text-muted-foreground">{pct}%</div>
                </div>
                <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
                  Batafsil ko'rish
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          O'quv reja topilmadi
        </div>
      )}
    </div>
  );
}
