import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { StudentCurriculum } from "@/components/learning/student-curriculum";
import { studyPlanApi, type StudentCurriculum as Data } from "@/services/api/study-plan-api";
import type { CurriculumVersion } from "@/services/api/curriculum-api";
import type { SubjectSyllabus } from "@/services/api/syllabus-api";

vi.mock("@/services/api/study-plan-api", () => ({ studyPlanApi: { getMyCurriculum: vi.fn() } }));

const subject = (id: number, semester: number, name: string, syllabusId: number | null = null) => ({
  id, subjectId: id, subjectCode: `F${id}`, subjectName: name, credits: 4, semester, planItemType: "REQUIRED" as const,
  lectureHours: 30, practicalHours: 30, selfStudyHours: 60, syllabusId,
});
const curriculum = {
  id: 2, programId: 1, programName: "Dasturiy injiniring", facultyName: "Informatika", name: "Dasturiy injiniring (2026_uzb)",
  academicYear: "2026-2027", educationForm: "DISTANCE", semesterCount: 8, subjectCount: 3, totalCredits: 12,
  subjects: [subject(1, 1, "Matematika", 40), subject(2, 1, "Fizika"), subject(3, 2, "Dasturlash")],
} as unknown as CurriculumVersion;
const syllabus = {
  id: 40, subjectId: 1, subjectName: "Matematika", name: "Matematika dasturi", language: "UZ", shortDescription: "Oliy matematika asoslari",
  fullDescription: "t", active: true, status: "APPROVED", revisionNumber: 1, topics: [],
  modules: [{ id: 5, sortOrder: 1, name: "Chiziqli algebra", lessons: [{ id: 11, type: "THEORETICAL", sortOrder: 1, title: "Matritsalar", moduleId: 5 }] }],
} as unknown as SubjectSyllabus;
const mount = (data: Data) => {
  vi.mocked(studyPlanApi.getMyCurriculum).mockResolvedValue(data);
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><StudentCurriculum /></QueryClientProvider>);
};

describe("StudentCurriculum", () => {
  it("joriy semestr fanlarini va tasdiqlangan dasturning modul/darslarini ko'rsatadi", async () => {
    mount({ curriculum, currentSemester: 1, syllabi: [syllabus] });
    const first = await screen.findByRole("region", { name: "1-semestr" });
    expect(within(first).getByText("F1 · 4 kredit · Ma'ruza 30 · Amaliy 30 · Mustaqil 60")).toBeInTheDocument();
    expect(within(first).getByText("Dastur hali tasdiqlanmagan")).toBeInTheDocument();
    // 2-semestr yopiq
    expect(screen.queryByText("Dasturlash")).not.toBeInTheDocument();

    fireEvent.click(within(first).getByRole("button", { name: /O'quv dasturi/ }));
    const view = screen.getByLabelText("Matematika dasturi — o'quv dasturi");
    expect(within(view).getByText("1. Chiziqli algebra")).toBeInTheDocument();
    expect(within(view).getByText("Matritsalar")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /2-semestr/ }));
    expect(screen.getByText("Dasturlash")).toBeInTheDocument();
  });

  it("reja topilmasa sababini aytadi", async () => {
    mount({ curriculum: null, syllabi: [], reason: "Mutaxassisligingiz bo'yicha tasdiqlangan o'quv reja hali yo'q" });
    expect(await screen.findByText(/Mutaxassisligingiz bo'yicha tasdiqlangan o'quv reja hali yo'q/)).toBeInTheDocument();
  });
});
