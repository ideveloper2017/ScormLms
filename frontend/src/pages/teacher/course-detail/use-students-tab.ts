import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";
import { createShowError } from "./shared";

/**
 * "Talabalar" tabining holati va mutatsiyalari. Konteynerda chaqiriladi: tanlangan talabalar va
 * individual reja parametrlari tab almashganda saqlanib qoladi.
 */
export function useStudentsTab({
  courseId,
  refreshCourse,
}: {
  courseId: string;
  refreshCourse: () => Promise<unknown>;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const showError = createShowError(toast);
  const [studentIds, setStudentIds] = useState<number[]>([]);
  useEffect(() => { setStudentIds([]); }, [courseId]);
  const currentYear = new Date().getFullYear();
  const academicYearStart =
    new Date().getMonth() >= 8 ? currentYear : currentYear - 1;
  const [enrollmentAcademicYear, setEnrollmentAcademicYear] = useState(
    `${academicYearStart}-${academicYearStart + 1}`,
  );
  const [enrollmentSemester, setEnrollmentSemester] = useState("1");
  const [enrollmentCredits, setEnrollmentCredits] = useState("0");
  const [enrollmentRequired, setEnrollmentRequired] = useState("true");

  const refreshEnrollments = () =>
    Promise.all([
      refreshCourse(),
      queryClient.invalidateQueries({ queryKey: ["teacher", "course", courseId, "candidates"] }),
      queryClient.invalidateQueries({
        queryKey: ["teacher", "course", courseId, "enrollments"],
      }),
    ]);

  const enrollMutation = useMutation({
    mutationFn: (ids: number[]) =>
      teacherPortalApi.enrollStudents(courseId, ids, {
        academicYear: enrollmentAcademicYear,
        semester: Number(enrollmentSemester),
        credits: Number(enrollmentCredits),
        required: enrollmentRequired === "true",
      }),
    onSuccess: async () => {
      setStudentIds([]);
      await refreshEnrollments();
      toast({ title: "Talabalar biriktirildi" });
    },
    onError: showError("Talabalar biriktirilmadi"),
  });
  const withdrawMutation = useMutation({
    mutationFn: (studentId: number) =>
      teacherPortalApi.withdrawStudent(courseId, studentId),
    onSuccess: async () => {
      await refreshEnrollments();
      toast({ title: "Talaba kursdan chiqarildi" });
    },
    onError: showError("Talaba chiqarilmadi"),
  });

  function enrollStudents() {
    if (!studentIds.length) return toast({ variant: "destructive", title: "Kamida bitta talabani tanlang" });
    enrollMutation.mutate(studentIds);
  }

  return {
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
  };
}

export type StudentsTabController = ReturnType<typeof useStudentsTab>;
