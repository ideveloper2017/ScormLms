import { useState } from "react";
import { Star, TrendingUp, TrendingDown, Award, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

interface SubjectGrade {
  subject: string;
  course: string;
  scores: { type: string; score: number; maxScore: number; date: string; weight: number }[];
  finalGrade?: string;
  gpa?: number;
}

const GRADES: SubjectGrade[] = [
  {
    subject: "Dasturlash asoslari",
    course: "CS101",
    scores: [
      { type: "1-test",       score: 18, maxScore: 20, date: "2025-03-15", weight: 10 },
      { type: "2-test",       score: 17, maxScore: 20, date: "2025-04-10", weight: 10 },
      { type: "Laboratoriya", score: 45, maxScore: 50, date: "2025-05-20", weight: 25 },
      { type: "Kurs ishi",    score: 43, maxScore: 50, date: "2025-06-01", weight: 25 },
      { type: "Yakuniy",      score: 88, maxScore: 100, date: "2025-06-10", weight: 30 },
    ],
    finalGrade: "A",
    gpa: 4.0,
  },
  {
    subject: "Ma'lumotlar bazasi",
    course: "CS201",
    scores: [
      { type: "1-test",       score: 15, maxScore: 20, date: "2025-03-20", weight: 10 },
      { type: "2-test",       score: 16, maxScore: 20, date: "2025-04-15", weight: 10 },
      { type: "Laboratoriya", score: 38, maxScore: 50, date: "2025-05-22", weight: 25 },
      { type: "Kurs ishi",    score: 40, maxScore: 50, date: "2025-06-03", weight: 25 },
    ],
    finalGrade: "B+",
    gpa: 3.5,
  },
  {
    subject: "Algoritmlar nazariyasi",
    course: "CS301",
    scores: [
      { type: "1-test",       score: 19, maxScore: 20, date: "2025-03-18", weight: 10 },
      { type: "2-test",       score: 18, maxScore: 20, date: "2025-04-12", weight: 10 },
      { type: "Kurs ishi",    score: 47, maxScore: 50, date: "2025-06-05", weight: 30 },
    ],
    finalGrade: "A+",
    gpa: 4.0,
  },
  {
    subject: "Web dasturlash",
    course: "CS202",
    scores: [
      { type: "1-test",       score: 14, maxScore: 20, date: "2025-03-25", weight: 10 },
      { type: "Laboratoriya", score: 35, maxScore: 50, date: "2025-05-25", weight: 30 },
    ],
    gpa: 3.2,
  },
  {
    subject: "Fizika",
    course: "PHY101",
    scores: [
      { type: "1-test",       score: 13, maxScore: 20, date: "2025-03-22", weight: 10 },
      { type: "Laboratoriya", score: 32, maxScore: 50, date: "2025-05-18", weight: 25 },
    ],
    finalGrade: "B",
    gpa: 3.0,
  },
  {
    subject: "Matematik tahlil",
    course: "MATH101",
    scores: [
      { type: "1-test",       score: 17, maxScore: 20, date: "2025-03-17", weight: 10 },
      { type: "2-test",       score: 15, maxScore: 20, date: "2025-04-11", weight: 10 },
      { type: "Yakuniy",      score: 76, maxScore: 100, date: "2025-06-12", weight: 50 },
    ],
    finalGrade: "B+",
    gpa: 3.5,
  },
];

const GRADE_COLOR: Record<string, string> = {
  "A+": "text-green-600",  "A": "text-green-600",
  "B+": "text-blue-600",   "B": "text-blue-600",
  "C+": "text-yellow-600", "C": "text-yellow-600",
  "D":  "text-orange-600", "F": "text-red-600",
};
const GRADE_BG: Record<string, string> = {
  "A+": "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300",
  "A":  "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300",
  "B+": "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300",
  "B":  "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-300",
  "C+": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "C":  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

function calcWeightedScore(scores: SubjectGrade["scores"]) {
  const total = scores.reduce((sum, s) => sum + s.weight, 0);
  if (total === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + (s.score / s.maxScore) * s.weight, 0) / total * 100);
}

export function StudentGrades() {
  const graded = GRADES.filter((g) => g.finalGrade);
  const gpa = graded.length > 0
    ? (graded.reduce((s, g) => s + (g.gpa ?? 0), 0) / graded.length).toFixed(2)
    : "—";

  const chartData = GRADES.map((g) => ({
    name: g.subject.split(" ")[0],
    ball: calcWeightedScore(g.scores),
  }));

  const radarData = GRADES.map((g) => ({
    subject: g.subject.split(" ")[0],
    ball: calcWeightedScore(g.scores),
    fullMark: 100,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Baholar</h1>
        <p className="text-muted-foreground">Fanlar bo'yicha joriy va yakuniy baholar</p>
      </div>

      {/* GPA + summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-yellow-500" />GPA (O'rtacha)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{gpa}</div>
            <div className="text-xs text-muted-foreground">5.0 dan</div>
          </CardContent>
        </Card>
        {[
          { label: "A/A+",  count: GRADES.filter((g) => g.finalGrade === "A" || g.finalGrade === "A+").length, cls: "text-green-600" },
          { label: "B/B+",  count: GRADES.filter((g) => g.finalGrade === "B" || g.finalGrade === "B+").length, cls: "text-blue-600"  },
          { label: "Baholanmagan", count: GRADES.filter((g) => !g.finalGrade).length, cls: "text-muted-foreground" },
        ].map(({ label, count, cls }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{count}</div></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Ro'yxat</TabsTrigger>
          <TabsTrigger value="bar">Grafik</TabsTrigger>
          <TabsTrigger value="radar">Radar</TabsTrigger>
        </TabsList>

        {/* List view */}
        <TabsContent value="list" className="space-y-4 mt-4">
          {GRADES.map((g) => {
            const weighted = calcWeightedScore(g.scores);
            return (
              <Card key={g.subject}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{g.subject}</CardTitle>
                      <CardDescription className="text-xs">{g.course}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{weighted}%</span>
                      {g.finalGrade && (
                        <Badge className={GRADE_BG[g.finalGrade] ?? ""}>{g.finalGrade}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={weighted} className="h-2" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {g.scores.map((s, i) => {
                      const pct = Math.round((s.score / s.maxScore) * 100);
                      return (
                        <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs">
                          <span className="text-muted-foreground">{s.type}</span>
                          <span className="font-semibold">
                            {s.score}/{s.maxScore}
                            <span className={`ml-1 ${pct >= 90 ? "text-green-600" : pct >= 70 ? "text-blue-600" : "text-red-600"}`}>
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Bar chart */}
        <TabsContent value="bar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />Fan bo'yicha o'rtacha ball
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => [`${v}%`, "Ball"]} />
                  <Bar dataKey="ball" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Radar chart */}
        <TabsContent value="radar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />Bilim profili
              </CardTitle>
              <CardDescription>Har bir fan bo'yicha natija</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Ball" dataKey="ball" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}