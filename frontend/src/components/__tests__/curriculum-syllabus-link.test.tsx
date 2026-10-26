import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculumSyllabusCell } from "@/components/admin/curriculum-syllabus-link";
import { PlanHoursCheck } from "@/components/admin/syllabus-topics";
import { curriculumApi, type CurriculumSubject, type CurriculumVersion } from "@/services/api/curriculum-api";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { attachSyllabus: vi.fn(), createSyllabus: vi.fn(), detachSyllabus: vi.fn() },
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
const mount = (subject: CurriculumSubject, onChanged = vi.fn()) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <CurriculumSyllabusCell curriculumId={5} subject={subject} rows={[subject.id === 9 ? subject : sem1, sem2]} canLink canEditTopics
      educationLanguage="ru" onChanged={onChanged} />
  </QueryClientProvider>,
);

describe("CurriculumSyllabusCell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({}), syllabus({ id: 41, name: "Dasturlash (RU)", language: "RU", status: "APPROVED" })]);
  });

  it("mavjud dasturni tanlab biriktiradi", async () => {
    vi.mocked(curriculumApi.attachSyllabus).mockResolvedValue({} as CurriculumVersion);
    const onChanged = vi.fn();
    mount(sem1, onChanged);

    fireEvent.click(screen.getByRole("button", { name: /Dastur biriktirish/ }));
    const list = await screen.findByRole("radiogroup", { name: "Mavjud o'quv dasturlari" });
    fireEvent.click(await within(list).findByText("Dasturlash (RU)"));
    fireEvent.click(screen.getByRole("button", { name: "Biriktirish" }));

    await waitFor(() => expect(curriculumApi.attachSyllabus).toHaveBeenCalledWith(5, 9, 41));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("yangi dastur yaratadi (reja tili bilan) va mavzular oynasini reja limitlari bilan ochadi", async () => {
    vi.mocked(curriculumApi.createSyllabus).mockResolvedValue({ subjects: [{ ...sem1, syllabusId: 40 }] } as CurriculumVersion);
    mount(sem1);

    fireEvent.click(screen.getByRole("button", { name: /Dastur biriktirish/ }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Yangi dastur" }));
    fireEvent.click(screen.getByRole("tab", { name: "Yangi dastur" }));
    expect(await screen.findByLabelText("Dastur tili")).toHaveValue("RU");
    fireEvent.change(screen.getByLabelText("Qisqa ta'rif *"), { target: { value: "Qisqa mazmun" } });
    fireEvent.change(screen.getByLabelText("To'liq ta'rif *"), { target: { value: "To'liq mazmun" } });
    fireEvent.click(screen.getByRole("button", { name: "Yaratish va biriktirish" }));

    await waitFor(() => expect(curriculumApi.createSyllabus).toHaveBeenCalledWith(5, 9, {
      language: "RU", shortDescription: "Qisqa mazmun", requirements: null, fullDescription: "To'liq mazmun",
    }));
    const check = await screen.findByLabelText("Reja bilan solishtirish");
    expect(within(check).getByText("Nazariy").nextSibling).toHaveTextContent("taqsimlandi 0 / reja 30");
    expect(within(check).getByText("1-qism (1-semestr) · Laboratoriya").nextSibling).toHaveTextContent("taqsimlandi 0 / reja 27");
  });

  it("biriktirilgan dastur nomi, mavzular soni va reja soatlariga mosligini ko'rsatadi", () => {
    mount({ ...sem1, syllabusId: 40, syllabusName: "Dasturlash 1,2", syllabusTopicCount: 12, syllabusHoursMatch: true });
    const button = screen.getByRole("button", { name: /Dasturlash 1,2/ });
    expect(button).toHaveTextContent("12 mavzu");
    expect(button).toHaveAttribute("title", "Mavzu soatlari rejaga mos");
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
