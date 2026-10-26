import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculumTopicsDialog, LinkSyllabusDialog } from "@/components/admin/curriculum-syllabus-link";
import { PlanTopicsCheck } from "@/components/admin/syllabus-topics";
import { curriculumApi, type CurriculumSubject, type CurriculumVersion } from "@/services/api/curriculum-api";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { attachSyllabus: vi.fn(), detachSyllabus: vi.fn() },
}));
vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { list: vi.fn(), linkedCourses: vi.fn(async () => []), updateTopicsWithCourses: vi.fn() },
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
describe("CurriculumTopicsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({}), syllabus({ id: 41, name: "Dasturlash (RU)", language: "RU", status: "APPROVED" })]);
  });

  it("rejadagi fan dasturi mavzularini ixcham ko'rinishda, reja limitlari bilan ochadi", async () => {
    render(<QueryClientProvider client={client()}>
      <CurriculumTopicsDialog rows={[{ ...sem1, syllabusId: 40 }, { ...sem2, syllabusId: 40 }]} canWrite onClose={vi.fn()} onSaved={vi.fn()} />
    </QueryClientProvider>);

    expect(await screen.findByRole("dialog", { name: "Dasturlash 1,2 — mavzular" })).toBeInTheDocument();
    expect(syllabusApi.list).toHaveBeenCalledWith(1);

    // Faqat rejada soati bor turlar (seminar yo'q); mavzuda nom va qism, soat yo'q (soat fan bo'yicha rejada)
    expect(screen.getAllByRole("tab").map((t) => t.textContent?.replace(/\d.*$/, "").trim())).toEqual(["Nazariy", "Amaliy", "Laboratoriya"]);
    const check = screen.getByLabelText("Reja bilan solishtirish");
    expect(within(check).getAllByText("Nazariy")[0].parentElement).toHaveTextContent("Nazariy 30 soat · mavzu yo'q");
    expect(within(check).getByText("2-qism (2-semestr):")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    expect(screen.getByLabelText("1-mavzu qismi")).toHaveValue("1");
    expect(screen.queryByLabelText("1-mavzu soati")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("1-mavzu mazmuni")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yuqoriga" })).not.toBeInTheDocument();
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
