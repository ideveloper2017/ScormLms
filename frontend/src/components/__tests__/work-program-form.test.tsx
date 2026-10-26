import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkProgramForm } from "@/components/admin/work-program-form";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";
import { academicPeriodApi } from "@/services/api/academic-period-api";
import type { ModelProgram } from "@/services/api/model-program-api";

vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { createWorkProgram: vi.fn() },
}));
vi.mock("@/services/api/academic-period-api", () => ({ academicPeriodApi: { listYears: vi.fn(), listSemesters: vi.fn() } }));

const model: ModelProgram = {
  id: 3, subjectId: 5, subjectCode: "MA01", subjectName: "Matematika", subjectCredits: 4, language: "RU", name: "Matematika",
  shortDescription: "Namunaviy qisqa", fullDescription: "To'liq", active: true, workProgramCount: 0,
};
const mount = (onCreated = vi.fn()) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <MemoryRouter><WorkProgramForm model={model} onClose={vi.fn()} onCreated={onCreated} /></MemoryRouter>
  </QueryClientProvider>,
);

describe("WorkProgramForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(academicPeriodApi.listYears).mockResolvedValue([
      { id: 1, code: "2025-2026", startsOn: "", endsOn: "", active: true, current: false },
      { id: 2, code: "2026-2027", startsOn: "", endsOn: "", active: true, current: true },
    ]);
    vi.mocked(academicPeriodApi.listSemesters).mockResolvedValue([
      { id: 1, semesterNumber: 1, nameUz: "1-semestr", courseNumber: 1, active: true },
      { id: 2, semesterNumber: 2, nameUz: "2-semestr", courseNumber: 1, active: true },
    ]);
  });

  it("o'quv dasturidan davr uchun fan dasturi, mavzular va kursni yaratadi", async () => {
    const syllabus = { id: 41, name: "Matematika · 2026-2027 · 2-semestr", topics: [{}], theoreticalHours: 2 } as SubjectSyllabus;
    vi.mocked(syllabusApi.createWorkProgram).mockResolvedValue({ syllabus, course: { id: 77, title: "Matematika" } });
    const onCreated = vi.fn();
    mount(onCreated);

    // Joriy o'quv yili tanlangan, kurs ma'lumotlari o'quv dasturidan
    await waitFor(() => expect(screen.getByLabelText("O'quv yili *")).toHaveValue("2026-2027"));
    expect(screen.getByLabelText("Kurs nomi *")).toHaveValue("Matematika");
    expect(screen.getByLabelText("Kurs tili")).toHaveValue("ru");
    fireEvent.change(await screen.findByLabelText("Semestr *"), { target: { value: "2" } });

    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    fireEvent.change(screen.getByLabelText("1-mavzu nomi"), { target: { value: "Kirish" } });
    expect(within(screen.getByRole("list", { name: "Kurs bo'limlari" })).getByText("Kirish")).toBeInTheDocument();
    expect(screen.getByText(/umumiy yuklama 120 soat/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fan dasturi va kursni yaratish" }));
    await waitFor(() => expect(syllabusApi.createWorkProgram).toHaveBeenCalledWith({
      modelProgramId: 3, academicYear: "2026-2027", semester: 2,
      topics: [{ type: "THEORETICAL", title: "Kirish", description: null, hours: 2 }],
      course: { title: "Matematika", shortDescription: "Namunaviy qisqa", level: "BEGINNER", language: "ru" },
    }));
    expect(await screen.findByRole("button", { name: "Kursni ochish" })).toBeInTheDocument();
    expect(onCreated).toHaveBeenCalled();
  });

  it("kurs o'chirilsa faqat fan dasturi yaratiladi", async () => {
    vi.mocked(syllabusApi.createWorkProgram).mockResolvedValue({ syllabus: { id: 41, name: "x" } as SubjectSyllabus, course: null });
    mount();
    fireEvent.click(screen.getByRole("switch", { name: "Kurs ham yaratilsin" }));
    fireEvent.click(screen.getByRole("button", { name: "Fan dasturini yaratish" }));
    await waitFor(() => expect(syllabusApi.createWorkProgram).toHaveBeenCalledWith(expect.objectContaining({ course: null })));
  });
});
