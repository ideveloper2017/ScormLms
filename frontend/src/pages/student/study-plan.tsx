import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BookMarked, BookOpen, CalendarDays, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { studyPlanApi } from '@/services/api/study-plan-api';

export function StudentStudyPlan() {
  const navigate = useNavigate();
  const planQuery = useQuery({
    queryKey: ['student', 'study-plan'],
    queryFn: () => studyPlanApi.getMyPlan(),
  });

  if (planQuery.isLoading) {
    return <div className="p-8 flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />O'quv reja yuklanmoqda...</div>;
  }
  if (planQuery.error || !planQuery.data) {
    return <div className="p-8 text-center space-y-3"><p className="text-destructive">{planQuery.error?.message ?? "O'quv reja topilmadi"}</p><Button variant="outline" onClick={() => planQuery.refetch()} className="gap-2"><RefreshCw className="h-4 w-4" />Qayta urinish</Button></div>;
  }

  const plan = planQuery.data;
  const semesters = [...new Set(plan.courses.map(course => course.semester))].sort((a, b) => a - b);
  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookMarked className="h-6 w-6" />Individual o'quv reja</h1>
        <p className="text-sm text-muted-foreground">{plan.academicYear} o'quv yili · {plan.studentName} · {plan.studentNumber}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardHeader className="pb-2"><CardDescription>Umumiy bajarilish</CardDescription><CardTitle>{plan.overallProgress}%</CardTitle></CardHeader><CardContent><Progress value={plan.overallProgress} /></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Rejadagi fanlar</CardDescription><CardTitle>{plan.courses.length}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{plan.courses.filter(course => course.status === 'completed').length} tasi yakunlangan</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>O'zlashtirilgan kredit</CardDescription><CardTitle>{plan.completedCredits}/{plan.totalCredits}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Kreditlar fan yakunlanganda hisoblanadi</CardContent></Card>
      </div>

      {plan.courses.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground"><BookOpen className="h-9 w-9 mx-auto mb-2 opacity-50" />Bu o'quv yiliga fan biriktirilmagan.</CardContent></Card>}
      {semesters.map(semester => (
        <section key={semester} className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><CalendarDays className="h-5 w-5" />{semester}-semestr</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {plan.courses.filter(course => course.semester === semester).map(course => (
              <Card key={course.enrollmentId}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div><CardTitle className="text-base">{course.subjectName}</CardTitle><CardDescription>{course.title} · {course.instructor}</CardDescription></div>
                    <Badge variant={course.status === 'completed' ? 'default' : 'secondary'} className="gap-1">{course.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}{course.status === 'completed' ? 'Yakunlangan' : 'Jarayonda'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div><div className="flex justify-between text-sm mb-2"><span>Fan progressi</span><strong>{course.progress}%</strong></div><Progress value={course.progress} /></div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <span>{course.credits} kredit</span>
                    <span>{course.required ? 'Majburiy' : 'Tanlov'}</span>
                    <span>Kontent {course.completedContents}/{course.totalContents}</span>
                    <span>SCORM {course.completedScormPackages}/{course.totalScormPackages}</span>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/student/courses/${course.courseId}/learn`)} className="w-full gap-2"><BookOpen className="h-4 w-4" />Kursni davom ettirish</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
