import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyllabusCourseWizard } from "@/components/admin/syllabus-course-wizard";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";
import type { SubjectRecord } from "@/lib/academic-api";

vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { createWithCourse: vi.fn() },
}));

const subjects = [{ id: 5, name: "Matematika", code: "MA01", credits: 4, active: true }] as SubjectRecord[];
const mount = (onCreated = vi.fn()) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    <MemoryRouter><SyllabusCourseWizard subjects={subjects} onClose={vi.fn()} onCreated={onCreated} /></MemoryRouter>
  </QueryClientProvider>,
);
const fillStepOne = () => {
  fireEvent.change(screen.getByLabelText("Fan *"), { target: { value: "5" } });
  fireEvent.change(screen.getByLabelText("Dastur tili *"), { target: { value: "RU" } });
  fireEvent.change(screen.getByLabelText("Qisqa ta'rif *"), { target: { value: "Qisqa mazmun" } });
  fireEvent.change(screen.getByLabelText("To'liq ta'rif *"), { target: { value: "To'liq mazmun" } });
  fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
};

describe("SyllabusCourseWizard", () => {
  beforeEach(() => vi.resetAllMocks());

  it("mavzular va kurs bitta qadamda: mavzular kurs bo'limlari bo'lib ko'rinadi va birga yaratiladi", async () => {
    const syllabus = { id: 41, name: "Matematika", topics: [{}], theoreticalHours: 2, practicalHours: 0 } as SubjectSyllabus;
    vi.mocked(syllabusApi.createWithCourse).mockResolvedValue({ syllabus, course: { id: 77, title: "Matematika" } });
    const onCreated = vi.fn();
    mount(onCreated);

    fireEvent.click(screen.getByRole("button", { name: "Keyingi" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Fan tanlang");
    fillStepOne();

    // 2-qadam: mavzular va kurs bir ekranda, kurs ma'lumotlari dasturdan to'ldirilgan
    expect(screen.getByLabelText("Kurs nomi *")).toHaveValue("Matematika");
    expect(screen.getByLabelText("Kurs tili")).toHaveValue("ru");
    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    fireEvent.change(screen.getByLabelText("1-mavzu nomi"), { target: { value: "Kirish" } });
    expect(within(screen.getByRole("list", { name: "Kurs bo'limlari" })).getByText("Kirish")).toBeInTheDocument();
    expect(screen.getByText(/umumiy yuklama 120 soat/)).toHaveTextContent("mustaqil ta'lim: 118 soat");

    fireEvent.click(screen.getByRole("button", { name: "Dastur va kursni yaratish" }));
    await waitFor(() => expect(syllabusApi.createWithCourse).toHaveBeenCalledWith({
      syllabus: { subjectId: 5, language: "RU", active: true, shortDescription: "Qisqa mazmun", requirements: null,
        fullDescription: "To'liq mazmun", topics: [{ type: "THEORETICAL", title: "Kirish", description: null, hours: 2 }] },
      course: { title: "Matematika", shortDescription: "Qisqa mazmun", level: "BEGINNER", language: "ru" },
    }));
    expect(await screen.findByRole("button", { name: "Kursni ochish" })).toBeInTheDocument();
    expect(onCreated).toHaveBeenCalled();
  });

  it("kurs o'chirilsa faqat dastur yaratiladi", async () => {
    vi.mocked(syllabusApi.createWithCourse).mockResolvedValue({ syllabus: { id: 41, name: "Matematika" } as SubjectSyllabus, course: null });
    mount();
    fillStepOne();
    fireEvent.click(screen.getByRole("switch", { name: "Kurs ham yaratilsin" }));
    fireEvent.click(screen.getByRole("button", { name: "Dasturni yaratish" }));

    await waitFor(() => expect(syllabusApi.createWithCourse).toHaveBeenCalledWith(expect.objectContaining({ course: null })));
    expect(screen.queryByRole("button", { name: "Kursni ochish" })).not.toBeInTheDocument();
  });
});
