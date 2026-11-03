import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, ChevronDown, ChevronRight, GraduationCap, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TopicTypeBadge } from "@/components/topic-type-badge";
import { modulesOf } from "@/lib/syllabus-modules";
import { educationFormLabels, type CurriculumSubject } from "@/services/api/curriculum-api";
import { studyPlanApi } from "@/services/api/study-plan-api";
import type { SubjectSyllabus } from "@/services/api/syllabus-api";

const HOURS: [keyof CurriculumSubject, string][] = [
  ["lectureHours", "Ma'ruza"], ["practicalHours", "Amaliy"], ["laboratoryHours", "Laboratoriya"], ["seminarHours", "Seminar"],
  ["selfStudyHours", "Mustaqil"],
];
const hoursText = (s: CurriculumSubject) => {
  const typed = HOURS.filter(([key]) => Number(s[key] ?? 0) > 0).map(([key, label]) => `${label} ${s[key]}`);
  return typed.length ? typed.join(" · ") : s.auditoryHours ? `Auditoriya ${s.auditoryHours} · Mustaqil ${s.selfStudyHours ?? 0}` : "—";
};

/**
 * Talabaning o'quv rejasi: semestrlar bo'yicha fanlar (kredit, soatlar) va har fanning tasdiqlangan o'quv dasturi
 * (modul -> dars). Joriy semestr ochiq turadi.
 */
export function StudentCurriculum() {
  const query = useQuery({ queryKey: ["student", "curriculum"], queryFn: () => studyPlanApi.getMyCurriculum() });
  const [openSemesters, setOpenSemesters] = useState<Set<number> | null>(null);
  const [openSubject, setOpenSubject] = useState<number | null>(null);

  if (query.isLoading) return <div className="flex items-center justify-center gap-2 p-8"><Loader2 className="h-5 w-5 animate-spin" />O'quv reja yuklanmoqda...</div>;
  if (query.isError) {
    return <div className="space-y-3 p-8 text-center"><p className="text-destructive">{query.error.message}</p>
      <Button variant="outline" className="gap-2" onClick={() => query.refetch()}><RefreshCw className="h-4 w-4" />Qayta urinish</Button></div>;
  }
  const { curriculum, currentSemester, syllabi, reason } = query.data!;
  if (!curriculum) {
    return <Card><CardContent className="py-10 text-center text-muted-foreground"><GraduationCap className="mx-auto mb-2 h-9 w-9 opacity-50" />
      {reason ?? "O'quv reja topilmadi"}. O'quv bo'limiga murojaat qiling.</CardContent></Card>;
  }
  const semesters = [...new Set(curriculum.subjects.map((s) => s.semester))].sort((a, b) => a - b);
  // Avvaliga joriy semestr (bo'lmasa birinchisi) ochiq
  const open = openSemesters ?? new Set([currentSemester && semesters.includes(currentSemester) ? currentSemester : semesters[0]]);
  const toggle = (semester: number) => setOpenSemesters(() => {
    const next = new Set(open);
    if (next.has(semester)) next.delete(semester); else next.add(semester);
    return next;
  });
  const syllabusOf = (id?: number | null) => syllabi.find((s) => s.id === id);

  return <div className="space-y-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{curriculum.name}</CardTitle>
        <CardDescription>
          {[curriculum.programName, curriculum.facultyName, `${curriculum.academicYear} o'quv yili`,
            educationFormLabels[curriculum.educationForm] ?? curriculum.educationForm].filter(Boolean).join(" · ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 text-sm">
        <Badge variant="secondary">{curriculum.semesterCount} semestr</Badge>
        <Badge variant="secondary">{curriculum.subjectCount} ta fan</Badge>
        <Badge variant="secondary">{curriculum.totalCredits} kredit</Badge>
        {currentSemester ? <Badge>Joriy: {currentSemester}-semestr</Badge> : null}
      </CardContent>
    </Card>

    {semesters.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">O'quv rejaga hali fan kiritilmagan.</CardContent></Card>}
    {semesters.map((semester) => {
      const subjects = curriculum.subjects.filter((s) => s.semester === semester);
      const expanded = open.has(semester);
      return <section key={semester} aria-label={`${semester}-semestr`} className="rounded-lg border">
        <button type="button" aria-expanded={expanded} onClick={() => toggle(semester)}
          className="flex w-full items-center gap-2 p-3 text-left font-semibold hover:bg-muted/40">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <CalendarDays className="h-4 w-4" />{semester}-semestr
          {semester === currentSemester && <Badge className="ml-1">joriy</Badge>}
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {subjects.length} ta fan · {subjects.reduce((sum, s) => sum + s.credits, 0)} kredit
          </span>
        </button>
        {expanded && <ul className="divide-y border-t">
          {subjects.map((subject) => {
            const syllabus = syllabusOf(subject.syllabusId);
            const shown = openSubject === subject.id;
            return <li key={subject.id} className="space-y-2 p-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{subject.subjectName}</p>
                  <p className="text-xs text-muted-foreground">
                    {subject.subjectCode} · {subject.credits} kredit · {hoursText(subject)}
                  </p>
                </div>
                <Badge variant="outline">{subject.planItemType === "ELECTIVE" ? "Tanlov" : "Majburiy"}</Badge>
                {syllabus
                  ? <Button size="sm" variant={shown ? "secondary" : "outline"} className="gap-1.5" aria-expanded={shown}
                      onClick={() => setOpenSubject(shown ? null : subject.id)}>
                      <BookOpen className="h-3.5 w-3.5" />O'quv dasturi
                    </Button>
                  : <span className="text-xs text-muted-foreground">Dastur hali tasdiqlanmagan</span>}
              </div>
              {shown && syllabus && <SyllabusView syllabus={syllabus} />}
            </li>;
          })}
        </ul>}
      </section>;
    })}
  </div>;
}

function SyllabusView({ syllabus }: { syllabus: SubjectSyllabus }) {
  const modules = modulesOf(syllabus);
  return <div aria-label={`${syllabus.name} — o'quv dasturi`} className="space-y-3 rounded-md bg-muted/30 p-3">
    <p className="text-sm">{syllabus.shortDescription}</p>
    {syllabus.requirements && <p className="text-xs text-muted-foreground">Talablar: {syllabus.requirements}</p>}
    {modules.length === 0 && <p className="text-sm text-muted-foreground">Dasturda hali modul yo'q.</p>}
    <ol className="space-y-3">
      {modules.map((module, index) => <li key={module.id ?? `m-${index}`}>
        <p className="text-sm font-semibold">{index + 1}. {module.name}</p>
        {module.description && <p className="text-xs text-muted-foreground">{module.description}</p>}
        <ol className="mt-1 space-y-1 pl-5">
          {module.lessons.map((lesson, lessonIndex) => <li key={lesson.id ?? `l-${lessonIndex}`} className="flex items-center gap-2 text-sm">
            <span className="w-6 text-xs text-muted-foreground">{lessonIndex + 1}.</span>
            <span className="flex-1">{lesson.title}</span>
            <TopicTypeBadge type={lesson.type} />
          </li>)}
          {module.lessons.length === 0 && <li className="text-xs text-muted-foreground">Darslar yo'q</li>}
        </ol>
      </li>)}
    </ol>
  </div>;
}
