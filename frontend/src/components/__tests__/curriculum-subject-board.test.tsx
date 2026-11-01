import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculumSubjectBoard } from "@/components/admin/curriculum-subject-board";
import type { SubjectRecord } from "@/lib/academic-api";
import { curriculumApi, type CurriculumSubject, type CurriculumVersion } from "@/services/api/curriculum-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { addSubject: vi.fn(), moveSubject: vi.fn(), updateSubject: vi.fn() },
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const client = () => new QueryClient({ defaultOptions: { mutations: { retry: false } } });
const item = (id: number, name: string, semester: number, credits: number, extra: Partial<CurriculumSubject> = {}): CurriculumSubject => ({
  id, subjectId: id * 10, subjectCode: `C${id}`, subjectName: name, credits, semester, planItemType: "REQUIRED",
  totalHours: credits * 30, ...extra,
});
const subjects = [
  item(1, "Fizika", 1, 6, { syllabusId: 7, syllabusName: "Fizika dasturi", syllabusComplete: true }),
  item(2, "Dasturlash", 1, 4, { totalHours: 100 }),
  item(3, "Python", 2, 5, { planItemType: "ELECTIVE", planRowNumber: "2.04" }),
  item(4, "PHP", 2, 5, { planItemType: "ELECTIVE", planRowNumber: "2.04" }),
];
const catalog: SubjectRecord[] = [
  { id: 99, name: "Kimyo", code: "KIM1", credits: 4, active: true },
  { id: 10, name: "Fizika", code: "C1", credits: 6, active: true },
];
const dataTransfer = () => ({ setData: vi.fn(), effectAllowed: "", dropEffect: "" });

const renderBoard = (editable = true) => render(
  <QueryClientProvider client={client()}>
    <CurriculumSubjectBoard curriculumId={5} subjects={subjects}
      components={[{ id: 3, type: "PRACTICE", name: "Malakaviy amaliyot", semester: 2, credits: 6, hours: 180 }]}
      catalog={catalog} semesters={[1, 2, 3]} editable={editable} onRemove={vi.fn()} onChanged={vi.fn()} />
  </QueryClientProvider>,
);
const semester = (n: number) => screen.getByRole("region", { name: `${n}-semestr` });

describe("CurriculumSubjectBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(curriculumApi.addSubject).mockResolvedValue({} as CurriculumVersion);
    vi.mocked(curriculumApi.moveSubject).mockResolvedValue({} as CurriculumVersion);
  });

  it("semestrlarda jami soat/kredit, tanlov guruhi, amaliyot va holat belgilari", () => {
    renderBoard();
    // 1-sem: 180+100 soat, 6+4 kredit; 2-sem: 150+150+180 soat, 5+5+6 kredit
    expect(within(semester(1)).getByTitle("Jami soat / kredit")).toHaveTextContent("280/10");
    expect(within(semester(2)).getByTitle("Jami soat / kredit")).toHaveTextContent("480/16");
    expect(within(semester(2)).getByText("Tanlov fanlari · 2.04")).toBeInTheDocument();
    expect(within(semester(2)).getByText("Malakaviy amaliyot")).toBeInTheDocument();
    expect(within(semester(3)).getByText("Fanni shu yerga sudrab tashlang")).toBeInTheDocument();

    expect(within(semester(1)).getByLabelText("O'quv dasturi: Fizika dasturi — mavzular to'liq")).toBeInTheDocument();
    expect(within(semester(1)).getByLabelText(/Soatlar kreditga mos emas: 4 kredit uchun 120 soat/)).toBeInTheDocument();
    // Katalogda rejadagi fan semestri ko'rsatiladi
    expect(screen.getByText(/rejada: 1-sem\./)).toBeInTheDocument();
  });

  it("katalogdan semestrga sudrab qo'shadi, fanni boshqa semestrga sudrab ko'chiradi", async () => {
    renderBoard();
    const kimyo = screen.getByText("Kimyo").closest("li") as HTMLElement;
    fireEvent.dragStart(kimyo, { dataTransfer: dataTransfer() });
    fireEvent.dragOver(semester(3), { dataTransfer: dataTransfer() });
    fireEvent.drop(semester(3), { dataTransfer: dataTransfer() });
    await waitFor(() => expect(curriculumApi.addSubject).toHaveBeenCalledWith(5, { subjectId: 99, semester: 3, planItemType: "REQUIRED" }));

    const card = within(semester(1)).getByText("Dasturlash").closest("[draggable]") as HTMLElement;
    fireEvent.dragStart(card, { dataTransfer: dataTransfer() });
    // O'z semestriga tashlash hech narsa qilmaydi
    fireEvent.drop(semester(1), { dataTransfer: dataTransfer() });
    expect(curriculumApi.moveSubject).not.toHaveBeenCalled();
    fireEvent.dragStart(card, { dataTransfer: dataTransfer() });
    fireEvent.dragOver(semester(2), { dataTransfer: dataTransfer() });
    fireEvent.drop(semester(2), { dataTransfer: dataTransfer() });
    await waitFor(() => expect(curriculumApi.moveSubject).toHaveBeenCalledWith(5, 2, 2));
  });

  it("sichqonchasiz: menyu orqali ko'chirish, rejadagi semestr katalog menyusida yopiq", async () => {
    renderBoard();
    fireEvent.keyDown(screen.getByRole("button", { name: "Fizika — amallar" }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "3-semestr" }));
    await waitFor(() => expect(curriculumApi.moveSubject).toHaveBeenCalledWith(5, 1, 3));

    fireEvent.keyDown(screen.getByRole("button", { name: "Fizika — semestrga qo'shish" }), { key: "Enter" });
    expect(await screen.findByRole("menuitem", { name: "1-semestr" })).toHaveAttribute("data-disabled");
  });

  it("tasdiqlangan rejada katalog va amallar yo'q, sudrab bo'lmaydi", () => {
    renderBoard(false);
    expect(screen.queryByRole("complementary", { name: "Fanlar katalogi" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /amallar/ })).not.toBeInTheDocument();
    expect(within(semester(1)).getByText("Fizika").closest("[draggable]")).toHaveAttribute("draggable", "false");
  });
});
