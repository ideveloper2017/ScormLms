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
  syllabusApi: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), updateModulesWithCourses: vi.fn(), linkedCourses: vi.fn(async () => []),
    uploadMedia: vi.fn(), removeMedia: vi.fn(), mediaFile: vi.fn() },
}));
vi.mock("@/components/editor/lazy-rich-text-editor", () => ({ LazyRichTextEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) =>
  <textarea aria-label="To'liq ta'rif *" value={value} onChange={(event) => onChange(event.target.value)} /> }));
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

  it("katalog: holat va til, tasdiqlangan dastur faqat ochiladi/o'chirilmaydi, qoralama o'chiriladi", async () => {
    vi.mocked(syllabusApi.list).mockResolvedValue([item(1, "DRAFT"), item(2, "APPROVED", 2)]);
    vi.mocked(syllabusApi.delete).mockResolvedValue();
    wrap(<SyllabusCatalog canWrite />);

    const approved = (await screen.findByText("Fizika dasturi 2")).closest("tr") as HTMLElement;
    expect(within(approved).getByText("Tasdiqlangan")).toBeInTheDocument();
    // Tasdiqlangan dastur faqat ko'rish uchun ochiladi, ⋮ menyuda o'chirish yopiq
    expect(within(approved).getByRole("button", { name: /dasturni ochish/ })).toBeEnabled();
    expect(within(approved).getByRole("button", { name: "Fizika dasturi 2 — ko'rish" })).toHaveTextContent("0 bo'lim · 0 dars");
    fireEvent.keyDown(within(approved).getByRole("button", { name: "Fizika dasturi 2 — amallar" }), { key: "Enter" });
    expect(await screen.findByRole("menuitem", { name: "O'chirish" })).toHaveAttribute("data-disabled");
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.getByText("Umumiy soni: 2")).toBeInTheDocument();
    expect(screen.getByText("2 tadan 1–2 ko'rsatilmoqda")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("button", { name: "Fizika dasturi 1 — amallar" }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "O'chirish" }));
    fireEvent.click(await screen.findByRole("button", { name: "O'chirish" }));
    await waitFor(() => expect(syllabusApi.delete).toHaveBeenCalledWith(1));
  });

  it("yangi dastur (to'liq sahifa): fan tanlanmaydi (o'quv rejada biriktiriladi), nom va ta'riflar yuboriladi, keyin O'quv dasturi ochiladi", async () => {
    vi.mocked(syllabusApi.list).mockResolvedValue([]);
    vi.mocked(syllabusApi.create).mockResolvedValue(item(3, "DRAFT"));
    vi.mocked(syllabusApi.uploadMedia).mockResolvedValue({ ...item(3, "DRAFT"), coverImageAvailable: true });
    wrap(<SyllabusCatalog canWrite />);

    fireEvent.click(await screen.findByRole("button", { name: /Yangi dastur/ }));
    expect(await screen.findByLabelText("Nomi *")).toBeInTheDocument();
    expect(screen.queryByLabelText("Fan *")).not.toBeInTheDocument();
    expect(screen.getByText(/Fan o'quv reja taxtasida/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nomi *"), { target: { value: "Mexanika" } });
    fireEvent.change(screen.getByLabelText("Qisqa ta'rif *"), { target: { value: "Mexanika asoslari" } });
    fireEvent.change(screen.getByLabelText("Talablar"), { target: { value: "Matematika" } });
    fireEvent.change(screen.getByLabelText("To'liq ta'rif *"), { target: { value: "Kinematika va dinamika" } });
    // Mentor kabi chap menyu: Asosiy → Media (holat saqlanadi, hammasi bitta "Saqlash" bilan)
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Media" }));
    const cover = new File([new Uint8Array([1, 2])], "muqova.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Muqova rasmi fayli"), { target: { files: [cover] } });
    expect(await screen.findByRole("img", { name: "Muqova rasmi" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Yoki video havolasi"), { target: { value: "https://youtu.be/abc" } });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash va davom etish" }));
    await waitFor(() => expect(syllabusApi.create).toHaveBeenCalledWith(expect.objectContaining({
      subjectId: null, name: "Mexanika", language: "UZ", shortDescription: "Mexanika asoslari", requirements: "Matematika", fullDescription: "Kinematika va dinamika",
      introVideoUrl: "https://youtu.be/abc",
    })));
    await waitFor(() => expect(syllabusApi.uploadMedia).toHaveBeenCalledWith(3, "cover", cover));
    expect(await screen.findByRole("tab", { name: "O'quv dasturi", selected: true })).toBeInTheDocument();
  });
});
