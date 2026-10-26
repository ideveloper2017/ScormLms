import { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { SyllabusTopicsDialog, SyllabusTopicsEditor, SyllabusTopicsView } from "@/components/admin/syllabus-topics";
import { syllabusApi, type SubjectSyllabus, type SyllabusTopicInput } from "@/services/api/syllabus-api";

vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { updateTopics: vi.fn() },
}));

const draft: SubjectSyllabus = {
  id: 40, subjectId: 7, subjectCode: "FIZ", subjectName: "Fizika", name: "Fizika dasturi", language: "UZ",
  shortDescription: "Qisqa", fullDescription: "To'liq", active: true, status: "DRAFT", revisionNumber: 1, topics: [],
};
const mountDialog = (item: SubjectSyllabus, onSaved = vi.fn(), onClose = vi.fn()) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    <SyllabusTopicsDialog item={item} canWrite onSaved={onSaved} onClose={onClose} />
  </QueryClientProvider>,
);

describe("SyllabusTopicsDialog", () => {
  it("qoralama dasturga mavzularni alohida saqlaydi", async () => {
    vi.mocked(syllabusApi.updateTopics).mockResolvedValue(draft);
    const onSaved = vi.fn();
    const onClose = vi.fn();
    mountDialog(draft, onSaved, onClose);

    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    fireEvent.click(screen.getByRole("button", { name: "Mavzularni saqlash" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nazariy mavzu nomi kiritilmagan");

    fireEvent.change(screen.getByLabelText("1-mavzu nomi"), { target: { value: " Kirish " } });
    fireEvent.click(screen.getByRole("button", { name: "Mavzularni saqlash" }));

    await waitFor(() => expect(syllabusApi.updateTopics).toHaveBeenCalledWith(40, [
      { type: "THEORETICAL", title: "Kirish", description: null, hours: 2 },
    ]));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalled();
  });

  it("tasdiqlangan dastur mavzularini faqat ko'rsatadi", () => {
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
  it("nazariy mavzu qo'shadi va soatlarni hisoblaydi", () => {
    const spy = vi.fn();
    render(<Harness initial={[{ type: "PRACTICAL", title: "Laboratoriya", hours: 4 }]} spy={spy} />);

    fireEvent.click(screen.getByRole("button", { name: /Mavzu qo'shish/ }));
    fireEvent.change(screen.getByLabelText("1-mavzu nomi"), { target: { value: "Kirish" } });

    const last = spy.mock.calls.at(-1)?.[0] as SyllabusTopicInput[];
    expect(last.map((t) => [t.type, t.title])).toEqual([["THEORETICAL", "Kirish"], ["PRACTICAL", "Laboratoriya"]]);
    expect(screen.getByText(/Jami: 6 soat \(nazariy 2, amaliy 4\)/)).toBeInTheDocument();
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

describe("SyllabusTopicsView", () => {
  it("nazariy va amaliy mavzularni alohida ko'rsatadi", () => {
    render(<SyllabusTopicsView topics={[
      { type: "PRACTICAL", sortOrder: 1, title: "Amaliy ish", hours: 4 },
      { type: "THEORETICAL", sortOrder: 1, title: "Ma'ruza", hours: 2 },
    ]} />);
    const theory = screen.getByText("Nazariy mashg'ulotlar").closest("div.rounded-md") as HTMLElement;
    expect(within(theory).getByText("Ma'ruza")).toBeInTheDocument();
    expect(within(theory).queryByText("Amaliy ish")).not.toBeInTheDocument();
  });
});
