import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyllabusTopicsEditor, SyllabusTopicsView } from "@/components/admin/syllabus-topics";
import type { SyllabusTopicInput } from "@/services/api/syllabus-api";

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
