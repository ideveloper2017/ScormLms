import { useMemo } from "react";
import { Star, Award, BarChart3, Trophy, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { useGrades, useGPA, useGradeDistribution } from "@/hooks/grades/useGrades";
import { GradeTableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
import { useLoadingTransition } from "@/hooks/useLoadingTransition";
import { Grade } from "@/types/grade.types";

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
  "D":  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "F":  "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300",
};

interface CourseGrades {
  courseId: string;
  courseName: string;
  grades: Grade[];
  averageScore: number;
}

export function StudentGrades() {
  const { data: grades, isLoading: gradesLoading, error: gradesError, refetch: refetchGrades } = useGrades();
  const { data: gpaData, isLoading: gpaLoading } = useGPA();
  const { data: distribution, isLoading: distributionLoading } = useGradeDistribution();

  // Apply loading transition with minimum 300ms display time (AC 9.7)
  const showLoading = useLoadingTransition(gradesLoading || gpaLoading || distributionLoading);

  // Sort grades by date descending
  const sortedGrades = useMemo(() => {
    if (!grades) return [];
    return [...grades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [grades]);

  // Group grades by course
  const groupedByCourse = useMemo(() => {
    if (!sortedGrades.length) return [];
    
    const courseMap = new Map<string, CourseGrades>();
    
    sortedGrades.forEach((grade) => {
      if (!courseMap.has(grade.courseId)) {
        courseMap.set(grade.courseId, {
          courseId: grade.courseId,
          courseName: grade.courseName,
          grades: [],
          averageScore: 0,
        });
      }
      courseMap.get(grade.courseId)!.grades.push(grade);
    });

    // Calculate average score for each course
    const grouped = Array.from(courseMap.values());
    grouped.forEach((course) => {
      const total = course.grades.reduce((sum, g) => sum + g.scorePercentage, 0);
      course.averageScore = Math.round(total / course.grades.length);
    });

    return grouped;
  }, [sortedGrades]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return groupedByCourse.map((course) => ({
      name: course.courseName.split(" ").slice(0, 2).join(" "),
      ball: course.averageScore,
    }));
  }, [groupedByCourse]);

  const radarData = useMemo(() => {
    return groupedByCourse.map((course) => ({
      subject: course.courseName.split(" ")[0],
      ball: course.averageScore,
      fullMark: 100,
    }));
  }, [groupedByCourse]);

  // Show loading skeleton
  if (showLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Baholar</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Fanlar bo'yicha joriy va yakuniy baholar</p>
        </div>
        <GradeTableSkeleton rows={10} />
      </div>
    );
  }

  // Show error state
  if (gradesError) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Baholar</h1>
          <p className="text-muted-foreground">Fanlar bo'yicha joriy va yakuniy baholar</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
              <p className="text-muted-foreground">
                {gradesError instanceof Error ? gradesError.message : "Baholarni yuklab bo'lmadi. Iltimos, qayta urinib ko'ring."}
              </p>
              <Button 
                onClick={() => refetchGrades()} 
                variant="outline"
                disabled={gradesLoading}
              >
                {gradesLoading ? "Yuklanmoqda..." : "Qayta urinish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gpa = gpaData?.currentGPA.toFixed(2) ?? "—";
  const cumulativeGPA = gpaData?.cumulativeGPA.toFixed(2) ?? "—";

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Baholar</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Fanlar bo'yicha joriy va yakuniy baholar</p>
      </div>

      {/* GPA + summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-yellow-500" />GPA (Joriy)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{gpa}</div>
            <div className="text-xs text-muted-foreground">4.0 dan</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-purple-500" />Umumiy GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{cumulativeGPA}</div>
            <div className="text-xs text-muted-foreground">4.0 dan</div>
          </CardContent>
        </Card>
        {distribution && [
          { label: "A/A+", count: distribution.A, cls: "text-green-600" },
          { label: "B/B+", count: distribution.B, cls: "text-blue-600" },
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
          <TabsTrigger value="table">Jadval</TabsTrigger>
          <TabsTrigger value="chart">Grafik</TabsTrigger>
        </TabsList>

        {/* List view - Grouped by course */}
        <TabsContent value="list" className="space-y-4 mt-4">
          {groupedByCourse.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Hali baholar mavjud emas</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            groupedByCourse.map((course) => (
              <Card key={course.courseId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{course.courseName}</CardTitle>
                      <CardDescription className="text-xs">
                        {course.grades.length} ta baholash
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{course.averageScore}%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {course.grades.map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {grade.assignmentName || grade.testName || "Boshqa baholash"}
                          </span>
                          {grade.scorePercentage >= 90 && (
                            <Trophy className="h-4 w-4 text-yellow-500" title="A'lo natija!" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(grade.date).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold text-sm">
                            {grade.earnedScore}/{grade.maxScore}
                          </div>
                          <div className={`text-xs ${
                            grade.scorePercentage >= 90 ? "text-green-600" :
                            grade.scorePercentage >= 70 ? "text-blue-600" :
                            grade.scorePercentage >= 60 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {grade.scorePercentage}%
                          </div>
                        </div>
                        <Badge className={GRADE_BG[grade.gradeLetter] ?? ""}>
                          {grade.gradeLetter}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Table view - All grades */}
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Barcha baholar</CardTitle>
              <CardDescription>Sanasi bo'yicha tartibda</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedGrades.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Hali baholar mavjud emas</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table className="min-w-[500px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fan</TableHead>
                        <TableHead>Topshiriq/Test</TableHead>
                        <TableHead>Sana</TableHead>
                        <TableHead className="text-right">Ball</TableHead>
                        <TableHead className="text-right">Foiz</TableHead>
                        <TableHead className="text-right">Baho</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedGrades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">{grade.courseName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {grade.assignmentName || grade.testName || "—"}
                              {grade.scorePercentage >= 90 && (
                                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(grade.date).toLocaleDateString("uz-UZ")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {grade.earnedScore}/{grade.maxScore}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            grade.scorePercentage >= 90 ? "text-green-600" :
                            grade.scorePercentage >= 70 ? "text-blue-600" :
                            grade.scorePercentage >= 60 ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {grade.scorePercentage}%
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={GRADE_BG[grade.gradeLetter] ?? ""}>
                              {grade.gradeLetter}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart view */}
        <TabsContent value="chart" className="space-y-4 mt-4">
          {/* Bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />Fan bo'yicha o'rtacha ball
              </CardTitle>
              <CardDescription>Har bir fandagi o'rtacha ko'rsatkich</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ma'lumot mavjud emas</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => [`${v}%`, "Ball"]} />
                    <Bar dataKey="ball" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Radar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />Bilim profili
              </CardTitle>
              <CardDescription>Har bir fan bo'yicha natija</CardDescription>
            </CardHeader>
            <CardContent>
              {radarData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ma'lumot mavjud emas</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Ball" dataKey="ball" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}