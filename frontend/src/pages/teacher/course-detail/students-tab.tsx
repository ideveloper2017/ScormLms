import type { UseQueryResult } from "@tanstack/react-query";
import { Trash2, UserPlus, Users } from "lucide-react";
import { AcademicYearSelect } from "@/components/academic-year-select";
import { CourseEnrollmentPicker } from "@/components/course-enrollment-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import type { CourseEnrollment, TeacherCourse } from "@/services/api/teacher-portal-api";
import type { ConfirmFn } from "./shared";
import { Empty, Loading } from "./shared-ui";
import type { StudentsTabController } from "./use-students-tab";

/** "Talabalar" tabi: talabalarni biriktirish formasi va biriktirilganlar ro'yxati */
export function StudentsTab({
  course,
  courseId,
  enrollmentsQuery,
  controller,
  confirm,
}: {
  course: TeacherCourse;
  courseId: string;
  enrollmentsQuery: UseQueryResult<CourseEnrollment[]>;
  controller: StudentsTabController;
  confirm: ConfirmFn;
}) {
  const { user } = useAuth();
  const enrollments = enrollmentsQuery.data ?? [];
  const {
    studentIds,
    setStudentIds,
    enrollmentAcademicYear,
    setEnrollmentAcademicYear,
    enrollmentSemester,
    setEnrollmentSemester,
    enrollmentCredits,
    setEnrollmentCredits,
    enrollmentRequired,
    setEnrollmentRequired,
    enrollMutation,
    withdrawMutation,
    enrollStudents,
  } = controller;

  return (
    <TabsContent value="students" className="mt-4 space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Talabani biriktirish
          </CardTitle>
          <CardDescription>
            Talabalarni ism yoki guruh bo'yicha tanlang, so'ng individual reja parametrlarini kiriting.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <CourseEnrollmentPicker key={`${user?.id}-${courseId}`} actorId={user?.id} courseId={courseId} selected={studentIds} onChange={setStudentIds} disabled={course.status === "archived" || enrollMutation.isPending} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-[2]">
              <label className="space-y-1 text-sm">O'quv yili<AcademicYearSelect aria-label="O'quv yili" value={enrollmentAcademicYear} onChange={setEnrollmentAcademicYear} disabled={course.status === "archived"} /></label>
              <label className="space-y-1 text-sm">Semestr<Input type="number" min={1} max={20} value={enrollmentSemester} onChange={(event) => setEnrollmentSemester(event.target.value)} disabled={course.status === "archived"} /></label>
              <label className="space-y-1 text-sm">Kredit<Input type="number" min={0} max={100} value={enrollmentCredits} onChange={(event) => setEnrollmentCredits(event.target.value)} disabled={course.status === "archived"} /></label>
              <div className="space-y-1 text-sm">Fan turi<Select value={enrollmentRequired} onValueChange={setEnrollmentRequired}><SelectTrigger aria-label="Fan turi"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Majburiy</SelectItem><SelectItem value="false">Tanlov</SelectItem></SelectContent></Select></div>
            </div>
            <Button
              onClick={enrollStudents}
              disabled={
                course.status === "archived" || enrollMutation.isPending || !studentIds.length
              }
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Biriktirish
            </Button>
        </CardContent>
      </Card>
      {enrollmentsQuery.isLoading && <Loading />}
      {enrollmentsQuery.isError && <div role="alert" className="rounded-md border p-4">Biriktirilgan talabalarni yuklab bo'lmadi. <Button variant="outline" onClick={() => void enrollmentsQuery.refetch()}>Qayta urinish</Button></div>}
      {!enrollmentsQuery.isLoading && !enrollmentsQuery.isError && enrollments.length === 0 && (
        <Empty text="Hozircha talaba biriktirilmagan" />
      )}
      {enrollments.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{item.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {item.studentNumber} · ID {item.studentId} ·{" "}
                {item.academicYear} · {item.semester}-semestr ·{" "}
                {item.credits} kredit ·{" "}
                {item.required ? "majburiy" : "tanlov"} · {item.progress}%
              </p>
            </div>
            <Badge
              variant={item.status === "active" ? "default" : "secondary"}
            >
              {item.status === "active"
                ? "Faol"
                : item.status === "completed"
                  ? "Yakunlagan"
                  : "Chiqarilgan"}
            </Badge>
            {item.status === "active" && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label="Talabani kursdan chiqarish"
                onClick={async () => {
                  if (await confirm({ title: `${item.studentName} kursdan chiqarilsinmi?`, description: "Talaba kursdan chiqarilgan deb belgilanadi.", confirmLabel: "Chiqarish" }))
                    withdrawMutation.mutate(item.studentId);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </TabsContent>
  );
}
