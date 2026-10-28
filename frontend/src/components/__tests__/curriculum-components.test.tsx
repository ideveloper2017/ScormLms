import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculumComponentsCard, CurriculumScheduleCard } from "@/components/admin/curriculum-components";
import { curriculumApi, type CurriculumComponent, type CurriculumVersion } from "@/services/api/curriculum-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { addComponent: vi.fn(), updateComponent: vi.fn(), removeComponent: vi.fn() },
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const client = () => new QueryClient({ defaultOptions: { mutations: { retry: false } } });
const practice: CurriculumComponent = { id: 3, type: "PRACTICE", name: "Malakaviy amaliyot", semester: 8, credits: 30, hours: 900, weeks: 15 };

describe("CurriculumComponentsCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("amaliyot va YaDA ro'yxati, qo'shish, tahrirlash va o'chirish", async () => {
    vi.mocked(curriculumApi.addComponent).mockResolvedValue({} as CurriculumVersion);
    vi.mocked(curriculumApi.updateComponent).mockResolvedValue({} as CurriculumVersion);
    vi.mocked(curriculumApi.removeComponent).mockResolvedValue({} as CurriculumVersion);
    const onChanged = vi.fn();
    render(<QueryClientProvider client={client()}>
      <CurriculumComponentsCard curriculumId={5} components={[practice]} semesterCount={8} editable onChanged={onChanged} />
    </QueryClientProvider>);

    const row = screen.getByText("Malakaviy amaliyot").closest("tr") as HTMLElement;
    expect(row).toHaveTextContent("8");
    expect(row).toHaveTextContent("900");
    expect(row).toHaveTextContent("15");

    // Yangi YaDA: nomi kiritilmasa turi nomi olinadi, semestr — oxirgi
    fireEvent.click(screen.getByRole("button", { name: /Qo'shish/ }));
    fireEvent.change(screen.getByLabelText("Turi"), { target: { value: "STATE_ATTESTATION" } });
    fireEvent.change(screen.getByLabelText("Hafta"), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));
    await waitFor(() => expect(curriculumApi.addComponent).toHaveBeenCalledWith(5, {
      type: "STATE_ATTESTATION", name: null, semester: 8, credits: 0, hours: 0, weeks: 8,
    }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());

    fireEvent.keyDown(within(row).getByRole("button", { name: "Malakaviy amaliyot — amallar" }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Tahrirlash" }));
    fireEvent.change(screen.getByLabelText("Kredit"), { target: { value: "24" } });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));
    await waitFor(() => expect(curriculumApi.updateComponent).toHaveBeenCalledWith(5, 3, expect.objectContaining({ credits: 24, hours: 900 })));

    fireEvent.keyDown(within(row).getByRole("button", { name: "Malakaviy amaliyot — amallar" }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "O'chirish" }));
    await waitFor(() => expect(curriculumApi.removeComponent).toHaveBeenCalledWith(5, 3));
  });

  it("tasdiqlangan rejada faqat ko'rinadi", () => {
    render(<QueryClientProvider client={client()}>
      <CurriculumComponentsCard curriculumId={5} components={[]} semesterCount={8} editable={false} onChanged={vi.fn()} />
    </QueryClientProvider>);
    expect(screen.queryByRole("button", { name: /Qo'shish/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Excel'dan import qilinganda fayldan olinadi/)).toBeInTheDocument();
  });
});

describe("CurriculumScheduleCard", () => {
  it("kurslar bo'yicha haftalar va har bir turdagi haftalar soni", () => {
    render(<CurriculumScheduleCard schedule={[
      { course: 1, weeks: ["FT", "", "", "A", "T"] },
      { course: 4, weeks: ["FT", "M", "M", "B"] },
    ]} />);
    const table = screen.getByRole("table", { name: "O'quv jarayoni jadvali" });
    const [, first, fourth] = within(table).getAllByRole("row");
    // Ustunlar: kurs, 5 hafta, N, A, FT, M, B, G, T, Jami
    const summary = (row: HTMLElement) => within(row).getAllByRole("cell").slice(6).map((c) => c.textContent);
    expect(within(first).getAllByRole("cell")[0]).toHaveTextContent("I");
    expect(summary(first)).toEqual(["2", "1", "1", "—", "—", "—", "1", "5"]);
    expect(within(fourth).getAllByRole("cell")[0]).toHaveTextContent("IV");
    expect(summary(fourth)).toEqual(["—", "—", "1", "2", "1", "—", "—", "4"]);
  });
});
