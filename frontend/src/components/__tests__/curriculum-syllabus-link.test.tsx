import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculumSyllabusPage, LinkSyllabusDialog } from "@/components/admin/curriculum-syllabus-link";
import { PlanTopicsCheck } from "@/components/admin/syllabus-topics";
import { curriculumApi, type CurriculumSubject, type CurriculumVersion } from "@/services/api/curriculum-api";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { attachSyllabus: vi.fn(), detachSyllabus: vi.fn() },
}));
vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: {
    list: vi.fn(), linkedCourses: vi.fn(async () => []), updateTopicsWithCourses: vi.fn(), updateModulesWithCourses: vi.fn(),
    lessonMaterials: vi.fn(async () => []), lessonQuizzes: vi.fn(async () => []),
  },
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const row = (patch: Partial<CurriculumSubject>): CurriculumSubject => ({
  id: 9, subjectId: 1, subjectCode: "DAS1110", subjectName: "Dasturlash 1,2", credits: 6, semester: 1, planItemType: "REQUIRED",
  lectureHours: 18, practicalHours: 27, laboratoryHours: 27, seminarHours: 0, auditoryHours: 72, selfStudyHours: 108, ...patch,
});
const sem1 = row({});
const sem2 = row({ id: 10, semester: 2, credits: 4, lectureHours: 12, practicalHours: 18, laboratoryHours: 18, auditoryHours: 48 });
const syllabus = (patch: Partial<SubjectSyllabus>): SubjectSyllabus => ({
  id: 40, subjectId: 1, subjectName: "Dasturlash 1,2", name: "Dasturlash 1,2", language: "UZ", shortDescription: "q",
  fullDescription: "t", active: true, status: "DRAFT", revisionNumber: 1, topics: [], ...patch,
});
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
describe("CurriculumSyllabusPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({}), syllabus({ id: 41, name: "Dasturlash (RU)", language: "RU", status: "APPROVED" })]);
  });

  it("rejadagi fan dasturini drawer'da, modullar va darslar bilan, reja limitlari bilan ochadi", async () => {
    vi.mocked(syllabusApi.updateModulesWithCourses).mockResolvedValue({ syllabus: syllabus({}), courses: [] });
    render(<QueryClientProvider client={client()}>
      <CurriculumSyllabusPage rows={[{ ...sem1, syllabusId: 40 }, { ...sem2, syllabusId: 40 }]} canWrite onClose={vi.fn()} onSaved={vi.fn()} />
    </QueryClientProvider>);

    // Everest kabi: "Ma'lumot" va "Dasturlar" tablari, rejadan ochilganda — "Dasturlar"
    expect(await screen.findByRole("tab", { name: "Dasturlar", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ma'lumot" })).toBeInTheDocument();
    expect(syllabusApi.list).toHaveBeenCalledWith(1);
    const check = screen.getByLabelText("Reja bilan solishtirish");
    expect(within(check).getAllByText("Nazariy")[0].parentElement).toHaveTextContent("Nazariy 30 soat · dars yo'q");
    expect(within(check).getByText("2-qism (2-semestr):")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Yangi modul/ }));
    fireEvent.change(screen.getByLabelText("1-modul nomi"), { target: { value: "Asoslar" } });
    fireEvent.click(screen.getByRole("button", { name: /Dars qo'shish/ }));
    fireEvent.change(screen.getByLabelText("1-modul 1-dars nomi"), { target: { value: "O'zgaruvchilar" } });
    // Faqat rejada soati bor turlar (seminar yo'q), ko'p semestrli fanda qism tanlanadi
    expect(within(screen.getByLabelText("1-modul 1-dars turi")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Nazariy", "Amaliy", "Laboratoriya"]);
    fireEvent.change(screen.getByLabelText("1-modul 1-dars qismi"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Dasturni saqlash" }));
    await waitFor(() => expect(syllabusApi.updateModulesWithCourses).toHaveBeenCalledWith(40, [{
      id: null, name: "Asoslar", description: null,
      lessons: [{ id: null, type: "THEORETICAL", title: "O'zgaruvchilar", description: null, part: 2 }],
    }]));
  });

  it("dars kontenti dastur sahifasi ichida ochiladi, orqaga qaytganda saqlanmagan o'zgarish qoladi", async () => {
    const lesson = { id: 11, type: "THEORETICAL" as const, sortOrder: 1, title: "Kinematika", moduleId: 5, lessonOrder: 1, materialCount: 2, quizCount: 1 };
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({ modules: [{ id: 5, sortOrder: 1, name: "Mexanika", lessons: [lesson] }], topics: [lesson] })]);
    const onClose = vi.fn();
    render(<QueryClientProvider client={client()}>
      <CurriculumSyllabusPage rows={[{ ...sem1, syllabusId: 40 }]} canWrite onClose={onClose} onSaved={vi.fn()} />
    </QueryClientProvider>);

    const page = await screen.findByRole("region", { name: "Dasturlash 1,2" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.change(within(page).getByLabelText("1-modul nomi"), { target: { value: "Mexanika asoslari" } });
    fireEvent.click(within(page).getByRole("button", { name: "1-modul 1-dars kontenti" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Kinematika" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Sahifa yo'li" })).getByText("Mexanika asoslari")).toBeInTheDocument();
    expect(screen.getByLabelText("1-modul nomi")).not.toBeVisible();
    await waitFor(() => expect(syllabusApi.lessonMaterials).toHaveBeenCalledWith(40, 11));

    fireEvent.click(screen.getByRole("button", { name: "Dasturga qaytish" }));
    expect(screen.queryByRole("heading", { level: 1, name: "Kinematika" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("1-modul nomi")).toHaveValue("Mexanika asoslari");
    fireEvent.click(screen.getByRole("button", { name: "Orqaga" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("LinkSyllabusDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("boshqa dasturni tanlab biriktiradi", async () => {
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({}), syllabus({ id: 41, name: "Dasturlash (RU)", language: "RU" })]);
    vi.mocked(curriculumApi.attachSyllabus).mockResolvedValue({} as CurriculumVersion);
    const onLinked = vi.fn();
    render(<QueryClientProvider client={client()}>
      <LinkSyllabusDialog curriculumId={5} subject={{ ...sem1, syllabusId: 40 }} onClose={vi.fn()} onLinked={onLinked} />
    </QueryClientProvider>);

    const list = await screen.findByRole("radiogroup", { name: "Mavjud o'quv dasturlari" });
    fireEvent.click(await within(list).findByText("Dasturlash (RU)"));
    fireEvent.click(screen.getByRole("button", { name: "Tanlash" }));
    await waitFor(() => expect(curriculumApi.attachSyllabus).toHaveBeenCalledWith(5, 9, 41));
    await waitFor(() => expect(onLinked).toHaveBeenCalled());
  });
});

describe("PlanTopicsCheck", () => {
  it("rejadagi soatni va har bir turga kiritilgan mavzular sonini ko'rsatadi, qismlar bo'yicha ham", () => {
    const plan = [
      { part: 1, semester: 1, lecture: 18, practical: 27, laboratory: 27, seminar: 0, auditory: 72 },
      { part: 2, semester: 2, lecture: 12, practical: 18, laboratory: 18, seminar: 0, auditory: 48 },
    ];
    const { unmount } = render(<PlanTopicsCheck plan={plan} topics={[
      { type: "THEORETICAL", part: 1 }, { type: "THEORETICAL", part: 2 }, { type: "PRACTICAL", part: 1 },
    ]} />);
    const [total, part1, part2] = screen.getAllByRole("list");
    expect(within(total).getByText("Nazariy").parentElement).toHaveTextContent("Nazariy 30 soat · 2 mavzu ✓");
    expect(within(total).getByText("Laboratoriya").parentElement).toHaveTextContent("Laboratoriya 45 soat · mavzu yo'q");
    expect(within(part1).getByText("Amaliy").parentElement).toHaveTextContent("Amaliy 27 soat · 1 mavzu ✓");
    expect(within(part2).getByText("Amaliy").parentElement).toHaveTextContent("Amaliy 18 soat · mavzu yo'q");
    unmount();

    render(<PlanTopicsCheck plan={[{ part: 1, semester: 1, lecture: 0, practical: 0, laboratory: 0, seminar: 0, auditory: 60 }]}
      topics={[{ type: "THEORETICAL" }]} />);
    expect(screen.getByText("Auditoriya").parentElement).toHaveTextContent("Auditoriya 60 soat · 1 mavzu ✓");
  });
});
