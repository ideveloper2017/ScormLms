import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonQuizzes, questionProblem } from "@/components/admin/syllabus-lesson-quizzes";
import { importQuizDocx, parseQuizText } from "@/lib/quiz-docx";
import { syllabusApi, type LessonQuiz } from "@/services/api/syllabus-api";

vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { lessonQuizzes: vi.fn(), createLessonQuiz: vi.fn(), updateLessonQuiz: vi.fn(), deleteLessonQuiz: vi.fn() },
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/quiz-docx", async (importOriginal) => ({ ...await importOriginal<object>(), importQuizDocx: vi.fn() }));

const test: LessonQuiz = {
  id: 1, kind: "TEST", title: "Kinematika testi", instructions: null, durationMinutes: 20, allowedAttempts: 1, passingPercentage: 60, version: 1,
  questions: [{ text: "Tezlik birligi?", type: "SINGLE_CHOICE", options: ["m/s", "kg"], correctAnswer: "m/s", explanation: null, points: 1 }],
};
const mount = (editable = true, onChanged = vi.fn()) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <LessonQuizzes syllabusId={40} lessonId={11} editable={editable} onChanged={onChanged} />
  </QueryClientProvider>,
);

describe("LessonQuizzes", { timeout: 20_000 }, () => {
  beforeEach(() => vi.clearAllMocks());

  it("darsga test bitta: mavjud bo'lsa Test qo'shish o'chiq, Savol/Javob qo'shiladi", async () => {
    vi.mocked(syllabusApi.lessonQuizzes).mockResolvedValue([test]);
    const question: LessonQuiz = { ...test, id: 2, kind: "QUESTION", title: "Tezlanish", durationMinutes: 30, allowedAttempts: 3, passingPercentage: 100,
      questions: [{ text: "Tezlanish vektormi?", type: "TRUE_FALSE", options: [], correctAnswer: "true", explanation: "Ha, yo'nalishi bor", points: 1 }] };
    vi.mocked(syllabusApi.createLessonQuiz).mockResolvedValue({ quizzes: [test, question], courses: [] });
    const onChanged = vi.fn();
    mount(true, onChanged);
    expect(await screen.findByText("1 ta savol · 20 daqiqa · o'tish 60% · 1 urinish")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Test qo'shish/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Savol \/ Javob qo'shish/ }));
    const form = screen.getByLabelText("Savol / Javob formasi");
    fireEvent.change(within(form).getByLabelText("Nomi *"), { target: { value: "Tezlanish" } });
    fireEvent.change(within(form).getByLabelText("Urinishlar soni"), { target: { value: "3" } });
    fireEvent.change(within(form).getByLabelText("1-savol turi"), { target: { value: "TRUE_FALSE" } });
    expect(within(form).getByRole("button", { name: "Saqlash" })).toBeDisabled();
    fireEvent.change(within(form).getByLabelText("1-savol matni"), { target: { value: " Tezlanish vektormi? " } });
    fireEvent.change(within(form).getByLabelText("1-savol izohi"), { target: { value: "Ha, yo'nalishi bor" } });
    fireEvent.click(within(form).getByRole("button", { name: "Saqlash" }));

    await waitFor(() => expect(syllabusApi.createLessonQuiz).toHaveBeenCalledWith(40, 11, {
      kind: "QUESTION", title: "Tezlanish", instructions: null, allowedAttempts: 3, durationMinutes: null, passingPercentage: null,
      questions: [{ text: "Tezlanish vektormi?", type: "TRUE_FALSE", points: 1, explanation: "Ha, yo'nalishi bor", options: [], correctAnswer: "true" }],
    }));
    expect(await screen.findByText("Tezlanish vektormi? · 3 urinish")).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledWith(2, "Savol / Javob qo'shildi", []);
  });

  it("test savollari variantlari bilan kiritiladi", async () => {
    vi.mocked(syllabusApi.lessonQuizzes).mockResolvedValue([]);
    vi.mocked(syllabusApi.createLessonQuiz).mockResolvedValue({ quizzes: [test], courses: [] });
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Test qo'shish/ }));
    const form = screen.getByLabelText("Test formasi");
    fireEvent.change(within(form).getByLabelText("1-savol matni"), { target: { value: "Tezlik birligi?" } });
    fireEvent.change(within(form).getByLabelText("1-savol 1-variant"), { target: { value: "m/s" } });
    fireEvent.change(within(form).getByLabelText("1-savol 2-variant"), { target: { value: "kg" } });
    expect(within(form).getByText("1-savol: to'g'ri variantni belgilang")).toBeInTheDocument();
    fireEvent.click(within(form).getAllByRole("radio")[0]);
    fireEvent.click(within(form).getByRole("button", { name: /Savol qo'shish/ }));
    fireEvent.change(within(form).getByLabelText("2-savol turi"), { target: { value: "SHORT_ANSWER" } });
    fireEvent.change(within(form).getByLabelText("2-savol matni"), { target: { value: "1 km necha metr?" } });
    fireEvent.change(within(form).getByLabelText("2-savol to'g'ri javobi"), { target: { value: "1000|1000 m" } });
    fireEvent.click(within(form).getByRole("button", { name: "Saqlash" }));

    await waitFor(() => expect(syllabusApi.createLessonQuiz).toHaveBeenCalled());
    const input = vi.mocked(syllabusApi.createLessonQuiz).mock.calls[0][2];
    expect(input).toMatchObject({ kind: "TEST", title: "Dars testi", durationMinutes: 20, passingPercentage: 60, allowedAttempts: 1 });
    expect(input.questions).toEqual([
      { text: "Tezlik birligi?", type: "SINGLE_CHOICE", points: 1, explanation: null, options: ["m/s", "kg"], correctAnswer: "m/s" },
      { text: "1 km necha metr?", type: "SHORT_ANSWER", points: 1, explanation: null, options: [], correctAnswer: "1000|1000 m" },
    ]);
  });

  it(".docx fayldan savollar formaga yuklanadi, belgilanmagan javob ko'rsatiladi", async () => {
    vi.mocked(syllabusApi.lessonQuizzes).mockResolvedValue([]);
    vi.mocked(syllabusApi.createLessonQuiz).mockResolvedValue({ quizzes: [test], courses: [] });
    vi.mocked(importQuizDocx).mockResolvedValue(parseQuizText("Tezlik birligi?\n====\n#m/s\n====\nkg\n++++\nMassa birligi?\n====\nkg\n====\nm"));
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Test qo'shish/ }));
    const form = screen.getByLabelText("Test formasi");
    expect(within(form).getByRole("link", { name: "Namuna fayl" })).toHaveAttribute("href", "/templates/test-namuna.docx");
    const file = new File(["x"], "test.docx");
    fireEvent.change(within(form).getByLabelText("Test fayli (.docx)"), { target: { files: [file] } });

    expect(await within(form).findByText("2 ta savol yuklandi, 1 tasini to'g'rilang")).toBeInTheDocument();
    expect(vi.mocked(importQuizDocx).mock.calls[0][0]).toBe(file);
    expect(within(form).getByLabelText("1-savol matni")).toHaveValue("Tezlik birligi?");
    expect(within(form).getByLabelText("2-savol 2-variant")).toHaveValue("m");
    expect(within(form).getByText("2-savol: to'g'ri variantni belgilang")).toBeInTheDocument();
    fireEvent.click(within(within(form).getByRole("radiogroup", { name: "2-savol variantlari" })).getAllByRole("radio")[0]);
    fireEvent.click(within(form).getByRole("button", { name: "Saqlash" }));
    await waitFor(() => expect(syllabusApi.createLessonQuiz).toHaveBeenCalled());
    expect(vi.mocked(syllabusApi.createLessonQuiz).mock.calls[0][2].questions.map((q) => q.correctAnswer)).toEqual(["m/s", "kg"]);
  });

  it("savol tekshiruvi", () => {
    expect(questionProblem({ text: "", type: "SHORT_ANSWER", options: [], correctAnswer: "x", points: 1 }, 0)).toBe("1-savol: matn kiritilmagan");
    expect(questionProblem({ text: "Q", type: "SINGLE_CHOICE", options: ["a", ""], correctAnswer: "a", points: 1 }, 1)).toBe("2-savol: kamida 2 variant kiriting");
    expect(questionProblem({ text: "Q", type: "TRUE_FALSE", options: [], correctAnswer: "false", points: 1 }, 0)).toBeNull();
  });
});
