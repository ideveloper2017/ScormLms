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
    lessonMaterials: vi.fn(async () => []), lessonQuizzes: vi.fn(async () => []), uploadLessonAsset: vi.fn(), createLessonMaterial: vi.fn(), updateLessonMaterial: vi.fn(),
  },
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/components/editor/lazy-rich-text-editor", () => ({ LazyRichTextEditor: ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) =>
  <textarea aria-label={placeholder ?? "Matn muharriri"} value={value} onChange={(event) => onChange(event.target.value)} /> }));

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

  it("rejadagi fan dasturi: Mentor kabi bo'lim qo'shish va bo'lim menyusidan dars qo'shish (reja limitlari bilan)", async () => {
    const saved = syllabus({ modules: [{ id: 5, sortOrder: 1, name: "Asoslar", lessons: [] }] });
    vi.mocked(syllabusApi.updateModulesWithCourses).mockResolvedValue({ syllabus: saved, courses: [] });
    render(<QueryClientProvider client={client()}>
      <CurriculumSyllabusPage rows={[{ ...sem1, syllabusId: 40 }, { ...sem2, syllabusId: 40 }]} canWrite onClose={vi.fn()} onSaved={vi.fn()} />
    </QueryClientProvider>);

    // Chap menyu: O'quv dasturi, Asosiy, Ma'lumot, Media; rejadan ochilganda — O'quv dasturi
    expect(await screen.findByRole("tab", { name: "O'quv dasturi", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Asosiy" })).toBeInTheDocument();
    expect(syllabusApi.list).toHaveBeenCalledWith(1);
    const check = screen.getByLabelText("Reja bilan solishtirish");
    expect(within(check).getAllByText("Nazariy")[0].parentElement).toHaveTextContent("Nazariy 30 soat · dars yo'q");
    expect(within(check).getByText("2-qism (2-semestr):")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Bo'lim qo'shish/ }));
    fireEvent.change(await screen.findByLabelText("Bo'lim nomi *"), { target: { value: "Asoslar" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Saqlash" }));
    await waitFor(() => expect(syllabusApi.updateModulesWithCourses).toHaveBeenCalledWith(40, [{ id: null, name: "Asoslar", description: null, lessons: [] }]));

    const section = await screen.findByRole("region", { name: "1. Asoslar" });
    fireEvent.keyDown(within(section).getByRole("button", { name: /Bo'lim menyusi/ }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: /Dars qo'shish/ }));
    fireEvent.click(await screen.findByLabelText(/Faqat dars/));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    fireEvent.change(screen.getByLabelText("Nomi *"), { target: { value: "O'zgaruvchilar" } });
    // Faqat rejada soati bor turlar (seminar yo'q), ko'p semestrli fanda qism tanlanadi
    expect(within(screen.getByLabelText("Mashg'ulot turi *")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Nazariy", "Amaliy", "Laboratoriya"]);
    fireEvent.change(screen.getByLabelText("Qism (semestr)"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Dars qo'shish" }));
    await waitFor(() => expect(syllabusApi.updateModulesWithCourses).toHaveBeenLastCalledWith(40, [{
      id: 5, name: "Asoslar", description: null,
      lessons: [{ id: null, type: "THEORETICAL", title: "O'zgaruvchilar", description: null, part: 2 }],
    }]));
  });

  it("dars resurslari dastur sahifasi ichida ochiladi va orqaga qaytiladi", async () => {
    const lesson = { id: 11, type: "THEORETICAL" as const, sortOrder: 1, title: "Kinematika", moduleId: 5, lessonOrder: 1, materialCount: 2, quizCount: 1 };
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({ modules: [{ id: 5, sortOrder: 1, name: "Mexanika", lessons: [lesson] }], topics: [lesson] })]);
    const onClose = vi.fn();
    render(<QueryClientProvider client={client()}>
      <CurriculumSyllabusPage rows={[{ ...sem1, syllabusId: 40 }]} canWrite onClose={onClose} onSaved={vi.fn()} />
    </QueryClientProvider>);

    const section = await screen.findByRole("region", { name: "1. Mexanika" });
    expect(within(section).getByText("3 resurs")).toBeInTheDocument();
    fireEvent.click(within(section).getByRole("button", { name: "1-bo'lim 1-dars: Kinematika" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Kinematika" })).toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Sahifa yo'li" })).getByText("Mexanika")).toBeInTheDocument();
    await waitFor(() => expect(syllabusApi.lessonMaterials).toHaveBeenCalledWith(40, 11));

    fireEvent.click(screen.getByRole("button", { name: "Dasturga qaytish" }));
    expect(screen.queryByRole("heading", { level: 1, name: "Kinematika" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "1. Mexanika" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Orqaga" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("bo'lim menyusidan rasm fayli bilan dars: dars saqlanadi, fayl yuklanib material yaratiladi", async () => {
    const lesson = { id: 12, type: "THEORETICAL" as const, sortOrder: 1, title: "Sxema", moduleId: 5, lessonOrder: 1 };
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({ modules: [{ id: 5, sortOrder: 1, name: "Mexanika", lessons: [] }] })]);
    vi.mocked(syllabusApi.updateModulesWithCourses).mockResolvedValue({
      syllabus: syllabus({ modules: [{ id: 5, sortOrder: 1, name: "Mexanika", lessons: [lesson] }], topics: [lesson] }), courses: [],
    });
    vi.mocked(syllabusApi.uploadLessonAsset).mockResolvedValue({ id: 77 } as never);
    vi.mocked(syllabusApi.createLessonMaterial).mockResolvedValue({ materials: [], courses: [] });
    render(<QueryClientProvider client={client()}>
      <CurriculumSyllabusPage rows={[{ ...sem1, syllabusId: 40 }]} canWrite onClose={vi.fn()} onSaved={vi.fn()} />
    </QueryClientProvider>);

    const section = await screen.findByRole("region", { name: "1. Mexanika" });
    fireEvent.keyDown(within(section).getByRole("button", { name: /Bo'lim menyusi/ }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: /Dars qo'shish/ }));
    fireEvent.click(await screen.findByLabelText("Rasm fayl"));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    fireEvent.change(screen.getByLabelText("Nomi *"), { target: { value: "Sxema" } });
    const file = new File([new Uint8Array([1])], "sxema.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Rasm fayl *"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Dars qo'shish" }));
    await waitFor(() => expect(syllabusApi.createLessonMaterial).toHaveBeenCalledWith(40, 12, expect.objectContaining({ title: "Sxema", contentType: "FILE", assetId: 77 })));
    expect(syllabusApi.uploadLessonAsset).toHaveBeenCalledWith(40, file);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("Mentor kabi video havola darsi: manba, ulashish havolasi, davomiylik va xulosa; tahrirlashda kontent ham o'zgaradi", async () => {
    const lesson = { id: 12, type: "THEORETICAL" as const, sortOrder: 1, title: "CSS asoslari", moduleId: 5, lessonOrder: 1 };
    const withLesson = syllabus({ modules: [{ id: 5, sortOrder: 1, name: "Kirish", lessons: [lesson] }], topics: [lesson] });
    vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({ modules: [{ id: 5, sortOrder: 1, name: "Kirish", lessons: [] }] })]);
    vi.mocked(syllabusApi.updateModulesWithCourses).mockResolvedValue({ syllabus: withLesson, courses: [] });
    vi.mocked(syllabusApi.createLessonMaterial).mockResolvedValue({ materials: [], courses: [] });
    render(<QueryClientProvider client={client()}>
      <CurriculumSyllabusPage rows={[{ ...sem1, syllabusId: 40 }]} canWrite onClose={vi.fn()} onSaved={vi.fn()} />
    </QueryClientProvider>);

    const section = await screen.findByRole("region", { name: "1. Kirish" });
    fireEvent.keyDown(within(section).getByRole("button", { name: /Bo'lim menyusi/ }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: /Dars qo'shish/ }));
    fireEvent.click(await screen.findByLabelText("Video havola"));
    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    fireEvent.change(screen.getByLabelText("Nomi *"), { target: { value: "CSS asoslari" } });
    expect(screen.getByLabelText("Video manbasi")).toHaveValue("youtube");
    fireEvent.change(screen.getByLabelText(/Video havolasi/), { target: { value: "https://vimeo.com/1" } });
    expect(screen.getByText("YouTube ulashish havolasini kiriting")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Video havolasi/), { target: { value: "https://youtu.be/1Rs2ND1ryYc" } });
    fireEvent.change(screen.getByLabelText("Davomiyligi"), { target: { value: "06:18:37" } });
    fireEvent.change(screen.getByLabelText(/Dars haqida qisqacha/), { target: { value: "<p>Kirish darsi</p>" } });
    fireEvent.click(screen.getByRole("button", { name: "Dars qo'shish" }));
    await waitFor(() => expect(syllabusApi.createLessonMaterial).toHaveBeenCalledWith(40, 12, {
      title: "CSS asoslari", description: "<p>Kirish darsi</p>", contentType: "VIDEO", contentBody: null,
      contentUrl: "https://youtu.be/1Rs2ND1ryYc", assetId: null, durationSeconds: 22717,
    }));
    expect(syllabusApi.updateModulesWithCourses).toHaveBeenLastCalledWith(40, [{ id: 5, name: "Kirish", description: null,
      lessons: [{ id: null, type: "THEORETICAL", title: "CSS asoslari", description: "Kirish darsi", part: null }] }]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    // Tahrirlash: mavjud video material bilan to'ldiriladi va yangilanadi
    vi.mocked(syllabusApi.lessonMaterials).mockResolvedValue([{ id: 90, subjectId: 1, subjectName: "x", title: "CSS asoslari", contentType: "video",
      contentUrl: "https://youtu.be/1Rs2ND1ryYc", description: "<p>Kirish darsi</p>", durationSeconds: 22717,
      languageCode: "uz", authorName: "a", contentVersion: "1.0", sourceName: "s" }]);
    vi.mocked(syllabusApi.updateLessonMaterial).mockResolvedValue({ materials: [], courses: [] });
    const updated = await screen.findByRole("region", { name: "1. Kirish" });
    fireEvent.keyDown(within(updated).getByRole("button", { name: "CSS asoslari — menyu" }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Tahrirlash" }));
    expect(await screen.findByDisplayValue("06:18:37")).toBeInTheDocument();
    expect(screen.getByLabelText(/Video havolasi/)).toHaveValue("https://youtu.be/1Rs2ND1ryYc");
    fireEvent.change(screen.getByLabelText("Davomiyligi"), { target: { value: "10:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Darsni saqlash" }));
    await waitFor(() => expect(syllabusApi.updateLessonMaterial).toHaveBeenCalledWith(40, 12, 90, expect.objectContaining({ durationSeconds: 600, contentType: "VIDEO" })));
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
