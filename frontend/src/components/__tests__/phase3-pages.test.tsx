import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttachedStudentsRegistry } from "@/components/admin/attached-students-registry";
import { SyllabusCatalog } from "@/components/admin/syllabus-catalog";
import { curriculumApi, type CurriculumVersion } from "@/services/api/curriculum-api";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { searchStudentAssignments: vi.fn(), removeStudentAssignment: vi.fn() },
}));
vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/lib/academic-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  listGroups: vi.fn().mockResolvedValue([{ id: 4, name: "KI-26", active: true }]),
  listSubjects: vi.fn().mockResolvedValue([{ id: 9, name: "Fizika", code: "FIZ1", active: true }]),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/components/admin/syllabus-workflow", async (importOriginal) => ({
  ...await importOriginal<object>(),
  SyllabusWorkflow: () => null,
}));

const wrap = (node: ReactNode) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>{node}</QueryClientProvider>,
);

describe("AttachedStudentsRegistry", () => {
  beforeEach(() => vi.clearAllMocks());

  it("barcha rejalar bo'yicha biriktirilganlarni guruh bilan ko'rsatadi va filtrni serverga uzatadi", async () => {
    vi.mocked(curriculumApi.searchStudentAssignments).mockResolvedValue([{
      id: 1, curriculumId: 7, studentId: 3, studentNumber: "ST-3", fullName: "Karimov Ali", groupId: 4, groupName: "KI-26",
      academicYear: "2026-2027", semesterNumber: 3, startsOn: "2026-09-15", endsOn: "2027-01-31", active: true,
      curriculumName: "Dasturiy injiniring",
    }]);
    wrap(<AttachedStudentsRegistry curricula={[{ id: 7, name: "Dasturiy injiniring", programName: "DI", versionCode: "V1", academicYear: "2026-2027" } as CurriculumVersion]} canWrite />);

    const row = (await screen.findByText("Karimov Ali")).closest("tr") as HTMLElement;
    expect(row).toHaveTextContent("KI-26");
    expect(row).toHaveTextContent("15.09.2026");
    expect(row).toHaveTextContent("Dasturiy injiniring");
    fireEvent.change(screen.getByLabelText("Jadval: semestr"), { target: { value: "3" } });
    await waitFor(() => expect(curriculumApi.searchStudentAssignments).toHaveBeenLastCalledWith(expect.objectContaining({ semester: 3 })));
  });
});

describe("SyllabusCatalog", () => {
  const item = (id: number, status: SubjectSyllabus["status"], revisionNumber = 1): SubjectSyllabus => ({
    id, subjectId: 9, subjectName: "Fizika", subjectCode: "FIZ1", name: `Fizika dasturi ${id}`, language: "UZ",
    shortDescription: "Qisqa", fullDescription: "To'liq", active: true, status, revisionNumber, topics: [],
  });
  beforeEach(() => vi.clearAllMocks());

  it("katalog: holat va til, tasdiqlangan dastur tahrirlanmaydi/o'chirilmaydi, qoralama o'chiriladi", async () => {
    vi.mocked(syllabusApi.list).mockResolvedValue([item(1, "DRAFT"), item(2, "APPROVED", 2)]);
    vi.mocked(syllabusApi.delete).mockResolvedValue();
    wrap(<SyllabusCatalog canWrite />);

    const approved = (await screen.findByText("Fizika dasturi 2")).closest("tr") as HTMLElement;
    expect(within(approved).getByText("Tasdiqlangan")).toBeInTheDocument();
    expect(within(approved).getByRole("button", { name: /tahrirlash/ })).toBeDisabled();
    expect(within(approved).getByRole("button", { name: /o'chirish/ })).toBeDisabled();
    expect(screen.getByText("Umumiy soni: 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fizika dasturi 1 — o'chirish" }));
    fireEvent.click(await screen.findByRole("button", { name: "O'chirish" }));
    await waitFor(() => expect(syllabusApi.delete).toHaveBeenCalledWith(1));
  });

  it("yangi dastur: qisqa ta'rif, talablar va to'liq ta'rif alohida yuboriladi", async () => {
    vi.mocked(syllabusApi.list).mockResolvedValue([]);
    vi.mocked(syllabusApi.create).mockResolvedValue(item(3, "DRAFT"));
    wrap(<SyllabusCatalog canWrite />);

    fireEvent.click(await screen.findByRole("button", { name: /Yangi dastur/ }));
    await screen.findByRole("option", { name: "Fizika (FIZ1)" });
    fireEvent.change(screen.getByLabelText("Fan *"), { target: { value: "9" } });
    fireEvent.change(screen.getByLabelText("Qisqa ta'rif *"), { target: { value: "Mexanika asoslari" } });
    fireEvent.change(screen.getByLabelText("Talablar"), { target: { value: "Matematika" } });
    fireEvent.change(screen.getByLabelText("To'liq ta'rif *"), { target: { value: "Kinematika va dinamika" } });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));
    await waitFor(() => expect(syllabusApi.create).toHaveBeenCalledWith(expect.objectContaining({
      subjectId: 9, language: "UZ", shortDescription: "Mexanika asoslari", requirements: "Matematika", fullDescription: "Kinematika va dinamika",
    })));
  });
});
