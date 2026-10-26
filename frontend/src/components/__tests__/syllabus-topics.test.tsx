import { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { SyllabusTopicsDialog, SyllabusTopicsEditor, SyllabusTopicsView } from "@/components/admin/syllabus-topics";
import { syllabusApi, type SubjectSyllabus, type SyllabusTopicInput } from "@/services/api/syllabus-api";

vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { updateTopicsWithCourses: vi.fn(), linkedCourses: vi.fn() },
}));
const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

const draft: SubjectSyllabus = {
  id: 40, subjectId: 7, subjectCode: "FIZ", subjectName: "Fizika", name: "Fizika dasturi", language: "UZ",
  shortDescription: "Qisqa", fullDescription: "To'liq", active: true, status: "DRAFT", revisionNumber: 1, topics: [],
};
const mountDialog = (item: SubjectSyllabus, onSaved = vi.fn(), onClose = vi.fn()) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <SyllabusTopicsDialog item={item} canWrite onSaved={onSaved} onClose={onClose} />
  </QueryClientProvider>,
);

describe("SyllabusTopicsDialog", () => {
  it("qoralama dasturga mavzularni saqlaydi va bog'langan qoralama kursni yangilaydi", async () => {
    vi.mocked(syllabusApi.linkedCourses).mockResolvedValue([
      { id: 77, title: "Fizika 2026", status: "draft", autoSync: true, added: 0, updated: 0 },
      { id: 78, title: "Fizika 2025", status: "published", autoSync: false, added: 0, updated: 0 },
    ]);
    vi.mocked(syllabusApi.updateTopicsWithCourses).mockResolvedValue({ syllabus: draft, courses: [
      { id: 77, title: "Fizika 2026", status: "draft", autoSync: true, added: 1, updated: 0 },
      { id: 78, title: "Fizika 2025", status: "published", autoSync: false, added: 0, updated: 0 },
    ] });
    const onSaved = vi.fn();
    const onClose = vi.fn();
    mountDialog(draft, onSaved, onClose);
    expect(await screen.findByText(/qoralama — bo'limlari avtomatik yangilanadi/)).toBeInTheDocument();
    expect(screen.getByText(/nashr qilingan — dastur tasdiqlangach/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mavzularni saqlash" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nazariy mavzu nomi kiritilmagan");

    fireEvent.change(screen.getByLabelText("1-mavzu nomi"), { target: { value: " Kirish " } });
    fireEvent.click(screen.getByRole("button", { name: "Mavzularni saqlash" }));

    // Mavzuda soat yo'q — soatlar fan bo'yicha o'quv rejada
    expect(screen.queryByLabelText("1-mavzu soati")).not.toBeInTheDocument();
    await waitFor(() => expect(syllabusApi.updateTopicsWithCourses).toHaveBeenCalledWith(40, [
      { id: null, type: "THEORETICAL", title: "Kirish", description: null, part: null },
    ]));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "«Fizika 2026»: 1 ta bo'lim qo'shildi, 0 ta yangilandi" }));
  });

  it("tasdiqlangan dastur mavzularini faqat ko'rsatadi", () => {
    vi.mocked(syllabusApi.linkedCourses).mockResolvedValue([]);
    mountDialog({ ...draft, status: "APPROVED", topics: [{ type: "PRACTICAL", sortOrder: 1, title: "Tajriba", hours: 4 }] });
    expect(screen.getByText("Tajriba")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mavzularni saqlash" })).not.toBeInTheDocument();
  });
});

function Harness({ initial, spy }: { initial: SyllabusTopicInput[]; spy: (v: SyllabusTopicInput[]) => void }) {
  const [value, setValue] = useState(initial);
  return <SyllabusTopicsEditor value={value} onChange={(v) => { setValue(v); spy(v); }} />;
}

describe("SyllabusTopicsEditor", () => {
  it("nazariy mavzu qo'shadi va mavzular sonini ko'rsatadi", () => {
    const spy = vi.fn();
    render(<Harness initial={[{ type: "PRACTICAL", title: "Laboratoriya" }]} spy={spy} />);

    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    fireEvent.change(screen.getByLabelText("1-mavzu nomi"), { target: { value: "Kirish" } });

    const last = spy.mock.calls.at(-1)?.[0] as SyllabusTopicInput[];
    expect(last.map((t) => [t.type, t.title])).toEqual([["THEORETICAL", "Kirish"], ["PRACTICAL", "Laboratoriya"]]);
    expect(screen.getByText("Jami: 2 ta mavzu")).toBeInTheDocument();
  });

  it("ro'yxatdan bir nechta mavzuni bir yo'la qo'shadi", () => {
    const spy = vi.fn();
    render(<Harness initial={[]} spy={spy} />);

    fireEvent.click(screen.getByRole("button", { name: /Ro'yxatdan qo'shish/ }));
    fireEvent.change(screen.getByLabelText("Mavzular ro'yxati"), { target: { value: "Birinchi\n\n Ikkinchi \n" } });
    fireEvent.click(screen.getByRole("button", { name: "Qo'shish" }));

    const last = spy.mock.calls.at(-1)?.[0] as SyllabusTopicInput[];
    expect(last.map((t) => t.title)).toEqual(["Birinchi", "Ikkinchi"]);
    expect(last.every((t) => t.type === "THEORETICAL")).toBe(true);
  });
});

describe("Laboratoriya va seminar", () => {
  it("laboratoriya va seminar mavzulari alohida tablarda kiritiladi va tartibda turadi", () => {
    const spy = vi.fn();
    render(<Harness initial={[{ type: "THEORETICAL", title: "Kirish" }]} spy={spy} />);

    fireEvent.mouseDown(screen.getByRole("tab", { name: /Seminar/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Seminar/ }));
    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    fireEvent.change(screen.getByLabelText("1-mavzu nomi"), { target: { value: "Munozara" } });
    fireEvent.mouseDown(screen.getByRole("tab", { name: /Laboratoriya/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Laboratoriya/ }));
    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    fireEvent.change(screen.getByLabelText("1-mavzu nomi"), { target: { value: "Mayatnik" } });

    const last = spy.mock.calls.at(-1)?.[0] as SyllabusTopicInput[];
    expect(last.map((t) => [t.type, t.title])).toEqual([["THEORETICAL", "Kirish"], ["LABORATORY", "Mayatnik"], ["SEMINAR", "Munozara"]]);
    expect(screen.getByText("Jami: 3 ta mavzu")).toBeInTheDocument();
  });

  it("ko'rinishda faqat mavzusi bor turlar chiqadi", () => {
    render(<SyllabusTopicsView topics={[
      { type: "LABORATORY", sortOrder: 1, title: "Mayatnik", hours: 4 },
      { type: "THEORETICAL", sortOrder: 1, title: "Kinematika", hours: 2 },
    ]} />);
    expect(screen.getByText("Laboratoriya mashg'ulotlari")).toBeInTheDocument();
    expect(screen.queryByText("Seminar mashg'ulotlari")).not.toBeInTheDocument();
    expect(screen.queryByText("Amaliy mashg'ulotlar")).not.toBeInTheDocument();
  });
});

describe("SyllabusTopicsView", () => {
  it("nazariy va amaliy mavzularni alohida ko'rsatadi", () => {
    render(<SyllabusTopicsView topics={[
      { type: "PRACTICAL", sortOrder: 1, title: "Amaliy ish", hours: 4 },
      { type: "THEORETICAL", sortOrder: 1, title: "Ma'ruza", hours: 2 },
    ]} />);
    const theory = screen.getByText("Nazariy mashg'ulotlar (ma'ruza)").closest("div.rounded-md") as HTMLElement;
    expect(within(theory).getByText("Ma'ruza")).toBeInTheDocument();
    expect(within(theory).queryByText("Amaliy ish")).not.toBeInTheDocument();
  });
});
