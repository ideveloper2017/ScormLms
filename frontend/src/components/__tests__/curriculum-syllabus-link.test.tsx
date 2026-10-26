import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculumSyllabusCell, LinkSyllabusDialog } from "@/components/admin/curriculum-syllabus-link";
import { PlanHoursCheck } from "@/components/admin/syllabus-topics";
import { curriculumApi, type CurriculumSubject, type CurriculumVersion } from "@/services/api/curriculum-api";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { ensureSyllabus: vi.fn(), attachSyllabus: vi.fn(), detachSyllabus: vi.fn() },
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
const mountCell = (subject: CurriculumSubject, onChanged = vi.fn()) => render(
  <QueryClientProvider client={client()}>
    <CurriculumSyllabusCell curriculumId={5} subject={subject} rows={[subject, sem2]} canLink onChanged={onChanged} />
  </QueryClientProvider>,
);

describe("CurriculumSyllabusCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({}), syllabus({ id: 41, name: "Dasturlash (RU)", language: "RU", status: "APPROVED" })]);
  });

  it("'+ Mavzular' bitta bosishda dasturni ochadi va ixcham mavzular oynasini reja limitlari bilan ko'rsatadi", async () => {
    vi.mocked(curriculumApi.ensureSyllabus).mockResolvedValue(40);
    const onChanged = vi.fn();
    mountCell(sem1, onChanged);

    fireEvent.click(screen.getByRole("button", { name: /Mavzular/ }));
    await waitFor(() => expect(curriculumApi.ensureSyllabus).toHaveBeenCalledWith(5, 9));
    expect(await screen.findByRole("dialog", { name: "Dasturlash 1,2 — mavzular" })).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalled();

    // Faqat rejada soati bor turlar (seminar yo'q), nom + soat + qism
    expect(screen.getAllByRole("tab").map((t) => t.textContent?.replace(/\d.*$/, "").trim())).toEqual(["Nazariy", "Amaliy", "Laboratoriya"]);
    const check = screen.getByLabelText("Reja bilan solishtirish");
    expect(within(check).getAllByText("Nazariy")[0].parentElement).toHaveTextContent("Nazariy 0/30");
    expect(within(check).getByText("2-qism (2-semestr):")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    expect(screen.getByLabelText("1-mavzu qismi")).toHaveValue("1");
    expect(screen.queryByLabelText("1-mavzu mazmuni")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yuqoriga" })).not.toBeInTheDocument();
  });

  it("biriktirilgan dasturda mavzular soni va reja soatlariga mosligi ko'rinadi", () => {
    mountCell({ ...sem1, syllabusId: 40, syllabusName: "Dasturlash 1,2", syllabusTopicCount: 12, syllabusHoursMatch: true });
    const button = screen.getByRole("button", { name: /12 mavzu/ });
    expect(button).toHaveAttribute("title", "Mavzu soatlari rejaga mos");
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

describe("PlanHoursCheck", () => {
  it("qismlar bo'yicha ham solishtiradi, masofaviy rejada auditoriya jami bilan", () => {
    const plan = [
      { part: 1, semester: 1, lecture: 18, practical: 27, laboratory: 27, seminar: 0, auditory: 72 },
      { part: 2, semester: 2, lecture: 12, practical: 18, laboratory: 18, seminar: 0, auditory: 48 },
    ];
    const { unmount } = render(<PlanHoursCheck plan={plan} topics={[
      { type: "THEORETICAL", hours: 18, part: 1 }, { type: "THEORETICAL", hours: 12, part: 2 }, { type: "PRACTICAL", hours: 20, part: 1 },
    ]} />);
    expect(screen.getByText("Nazariy").nextSibling).toHaveTextContent("taqsimlandi 30 / reja 30 ✓");
    expect(screen.getByText("Amaliy").nextSibling).toHaveTextContent("taqsimlandi 20 / reja 45");
    expect(screen.getByText("2-qism (2-semestr) · Nazariy").nextSibling).toHaveTextContent("taqsimlandi 12 / reja 12 ✓");
    unmount();

    render(<PlanHoursCheck plan={[{ part: 1, semester: 1, lecture: 0, practical: 0, laboratory: 0, seminar: 0, auditory: 60 }]}
      topics={[{ type: "THEORETICAL", hours: 60 }]} />);
    expect(screen.getByText("Auditoriya (turlarga bo'linmagan)").nextSibling).toHaveTextContent("taqsimlandi 60 / reja 60 ✓");
  });
});
