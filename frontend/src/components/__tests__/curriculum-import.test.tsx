import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculumExcelPrefill, CurriculumImportDialog } from "@/components/admin/curriculum-import-dialog";
import { CurriculumSubjectsTable } from "@/components/admin/curriculum-subjects-table";
import { curriculumApi, type CurriculumImportRow, type CurriculumSubject } from "@/services/api/curriculum-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { importPreview: vi.fn(), importApply: vi.fn(), updateSubject: vi.fn(), importDraft: vi.fn() },
}));

const client = () => new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
const row = (patch: Partial<CurriculumImportRow>): CurriculumImportRow => ({
  rowNumber: "1.09", code: "DAS1110", name: "Dasturlash 1,2", planItemType: "REQUIRED", alternative: false,
  totalHours: 300, auditoryHours: 120, lectureHours: 30, practicalHours: 45, laboratoryHours: 45, seminarHours: 0,
  courseWorkHours: 0, selfStudyHours: 180, semesterCredits: [{ semester: 1, credits: 6 }, { semester: 2, credits: 4 }],
  action: "USE_EXISTING", subjectId: 1, subjectName: "Dasturlash 1, 2", issues: [], ...patch,
});

describe("CurriculumImportDialog", () => {
  beforeEach(() => vi.resetAllMocks());

  it("faylni ko'rib chiqadi, qarorni o'zgartirish va import qilish mumkin", async () => {
    vi.mocked(curriculumApi.importPreview).mockResolvedValue({
      sheets: [{ name: "40-60", rowCount: 2 }, { name: "50-50", rowCount: 2 }], sheet: "40-60",
      rows: [row({ courseWorkType: "COURSE_WORK" }), row({ rowNumber: "2.04", code: "PDT2504", name: "Python", planItemType: "ELECTIVE", action: "CREATE",
        subjectId: null, createCode: "PDT2504-A", issues: ["Kod PDT2504 band — yangi fan PDT2504-A kodi bilan yaratiladi"],
        semesterCredits: [{ semester: 5, credits: 4 }] })],
      header: { programCode: "60610300", programName: "Kompyuter injiniringi", degree: "BAKALAVR", educationForm: "DISTANCE",
        educationFormText: "masofaviy", durationYears: 4, qualification: "Kompyuter tizimlari muhandisi" },
      warnings: ["Faylda ta'lim shakli masofaviy, rejada kunduzgi"],
      components: [{ type: "PRACTICE", name: "Malakaviy amaliyot", semester: 8, credits: 30, hours: 900, weeks: 15 },
        { type: "STATE_ATTESTATION", name: "Yakuniy davlat attestatsiyasi", semester: 8, credits: 0, hours: 0, weeks: 8 }],
      schedule: [{ course: 1, weeks: ["FT", "", "A"] }],
    });
    vi.mocked(curriculumApi.importApply).mockResolvedValue({ subjectsCreated: 0, itemsAdded: 2, itemsSkipped: 0, curriculum: {} as never });
    const onImported = vi.fn();
    render(<QueryClientProvider client={client()}><CurriculumImportDialog curriculumId={5} onClose={vi.fn()} onImported={onImported} /></QueryClientProvider>);

    const file = new File(["x"], "reja.xlsx");
    fireEvent.change(screen.getByLabelText("Excel fayl (.xlsx)"), { target: { files: [file] } });
    await waitFor(() => expect(curriculumApi.importPreview).toHaveBeenCalledWith(5, file, undefined));

    expect(await screen.findByText("Dasturlash 1,2")).toBeInTheDocument();
    // Fayl sarlavhasi va rejaga mos kelmasligi
    expect(screen.getByLabelText("Fayl sarlavhasi")).toHaveTextContent("60610300 – Kompyuter injiniringi");
    expect(screen.getByLabelText("Fayl sarlavhasi")).toHaveTextContent("ta'lim shakli: masofaviy · o'qish muddati: 4 yil · kvalifikatsiya: Kompyuter tizimlari muhandisi");
    expect(screen.getByLabelText("Fayl va reja farqi")).toHaveTextContent("Faylda ta'lim shakli masofaviy, rejada kunduzgi");
    expect(screen.getByText("Dasturlash 1,2").closest("tr")).toHaveTextContent("Kurs ishi");
    const extras = screen.getByLabelText("Fan bo'lmagan qismlar");
    expect(extras).toHaveTextContent("Malakaviy amaliyot — 8-semestr · 30 kredit · 900 soat · 15 hafta");
    expect(extras).toHaveTextContent("Yakuniy davlat attestatsiyasi — 8-semestr · 8 hafta");
    expect(extras).toHaveTextContent("O'quv jarayoni jadvali — 1 kurs bo'yicha haftalar");
    expect(screen.getByText("1: 6, 2: 4")).toBeInTheDocument();
    expect(screen.getAllByText("M 30 · A 45 · L 45 · MT 180")).toHaveLength(2);
    expect(screen.getByText(/PDT2504-A kodi bilan yaratiladi/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Mavjud fan: 1");

    // Varaq almashtirilsa qayta o'qiladi
    fireEvent.change(screen.getByLabelText("Varaq"), { target: { value: "50-50" } });
    await waitFor(() => expect(curriculumApi.importPreview).toHaveBeenLastCalledWith(5, file, "50-50"));

    fireEvent.change(await screen.findByLabelText("Python — qaror"), { target: { value: "SKIP" } });
    fireEvent.click(screen.getByRole("button", { name: "Import qilish (1 ta fan)" }));
    await waitFor(() => expect(curriculumApi.importApply).toHaveBeenCalledWith(5, [
      expect.objectContaining({ code: "DAS1110", action: "USE_EXISTING" }),
      expect.objectContaining({ code: "PDT2504", action: "SKIP" }),
    ], {
      // Amaliyot/YaDA, o'quv jarayoni jadvali va kvalifikatsiya ham fayldan
      components: [expect.objectContaining({ type: "PRACTICE" }), expect.objectContaining({ type: "STATE_ATTESTATION" })],
      schedule: [{ course: 1, weeks: ["FT", "", "A"] }],
      qualification: "Kompyuter tizimlari muhandisi",
    }));
    await waitFor(() => expect(onImported).toHaveBeenCalled());
  });
});

describe("Excel'dan reja yaratish", () => {
  beforeEach(() => vi.resetAllMocks());

  it("yangi reja formasi fayldan to'ldiriladi, yo'nalish topilmasa ogohlantiriladi", async () => {
    vi.mocked(curriculumApi.importDraft).mockResolvedValue({
      sheet: "1-курс_KI_2025", programId: null, programName: null, semesterCount: 8,
      header: { programCode: "60610300", programName: "Kompyuter injiniringi", educationForm: "DISTANCE", educationFormText: "masofaviy",
        durationYears: 4, qualification: "Kompyuter tizimlari muhandisi" },
    });
    const onFilled = vi.fn();
    render(<QueryClientProvider client={client()}><CurriculumExcelPrefill onFilled={onFilled} /></QueryClientProvider>);

    const file = new File(["x"], "reja.xlsx");
    fireEvent.change(screen.getByLabelText("Ishchi o'quv reja faylidan to'ldirish"), { target: { files: [file] } });
    await waitFor(() => expect(onFilled).toHaveBeenCalledWith(expect.objectContaining({ semesterCount: 8 }), file));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Fayldan olindi: 60610300 – Kompyuter injiniringi · ta'lim shakli: masofaviy · 8 semestr · kvalifikatsiya: Kompyuter tizimlari muhandisi");
    expect(screen.getByRole("status")).toHaveTextContent("Yo'nalish 60610300 tizimda topilmadi");
  });

  it("reja yaratilgach import oynasi shu faylni darhol o'qiydi", async () => {
    vi.mocked(curriculumApi.importPreview).mockResolvedValue({ sheets: [{ name: "Reja", rowCount: 0 }], sheet: "Reja", rows: [] });
    const file = new File(["x"], "reja.xlsx");
    render(<QueryClientProvider client={client()}>
      <CurriculumImportDialog curriculumId={7} initialFile={file} onClose={vi.fn()} onImported={vi.fn()} />
    </QueryClientProvider>);
    await waitFor(() => expect(curriculumApi.importPreview).toHaveBeenCalledWith(7, file, undefined));
    expect(curriculumApi.importPreview).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Fayl: reja.xlsx")).toBeInTheDocument();
  });
});

describe("CurriculumSubjectsTable", () => {
  beforeEach(() => vi.resetAllMocks());
  const subject: CurriculumSubject = {
    id: 9, subjectId: 1, subjectCode: "DAS1110", subjectName: "Dasturlash 1,2", credits: 6, semester: 1, planItemType: "REQUIRED",
    planRowNumber: "1.09", lectureHours: 18, practicalHours: 27, laboratoryHours: 27, seminarHours: 0, courseWorkHours: 0,
    auditoryHours: 72, selfStudyHours: 100, totalHours: 172,
  };

  it("ikki semestrli fan bitta qatorda ko'rsatiladi, kurs ishi semestri bilan belgilanadi", () => {
    render(<QueryClientProvider client={client()}>
      <CurriculumSubjectsTable curriculumId={5} editable={false} onRemove={vi.fn()} onChanged={vi.fn()} subjects={[
        { ...subject, totalHours: 180, selfStudyHours: 108 },
        { ...subject, id: 10, semester: 2, credits: 4, lectureHours: 12, practicalHours: 18, laboratoryHours: 18, auditoryHours: 48, selfStudyHours: 72, totalHours: 120,
          courseWorkType: "COURSE_PROJECT" },
      ]} />
    </QueryClientProvider>);
    const rowEl = screen.getByText("Dasturlash 1,2").closest("tr") as HTMLElement;
    expect(within(rowEl).getByText("1, 2")).toBeInTheDocument();
    expect(within(rowEl).getByText("6+4")).toBeInTheDocument();
    expect(within(rowEl).getByText("M 30 · A 45 · L 45")).toBeInTheDocument();
    expect(within(rowEl).getByText("Kurs loyihasi (2-sem.)")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2); // sarlavha + bitta fan
  });

  it("soatlarni ko'rsatadi, kreditga mos kelmasa ogohlantiradi va tahrirlaydi", async () => {
    vi.mocked(curriculumApi.updateSubject).mockResolvedValue({} as never);
    const onChanged = vi.fn();
    render(<QueryClientProvider client={client()}>
      <CurriculumSubjectsTable curriculumId={5} subjects={[subject]} editable onRemove={vi.fn()} onChanged={onChanged} />
    </QueryClientProvider>);

    const rowEl = screen.getByText("Dasturlash 1,2").closest("tr") as HTMLElement;
    expect(within(rowEl).getByText("1.09")).toBeInTheDocument();
    expect(within(rowEl).getByText("M 18 · A 27 · L 27")).toBeInTheDocument();
    expect(within(rowEl).getByLabelText("Soat kreditga mos emas")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("button", { name: "Dasturlash 1,2 — amallar" }), { key: "Enter" });
    fireEvent.click(await screen.findByRole("menuitem", { name: "Kredit va soatlar" }));
    expect(screen.getByLabelText("Auditoriya jami")).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Mustaqil ta'lim"), { target: { value: "108" } });
    fireEvent.change(screen.getByLabelText("Kurs ishi (loyihasi)"), { target: { value: "COURSE_WORK" } });
    expect(screen.getByText(/= 180 soat — kreditga mos/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => expect(curriculumApi.updateSubject).toHaveBeenCalledWith(5, 9, {
      credits: 6, planItemType: "REQUIRED", planRowNumber: "1.09",
      hours: { lecture: 18, practical: 27, laboratory: 27, seminar: 0, courseWork: 0, auditory: 72, selfStudy: 108 },
      courseWorkType: "COURSE_WORK",
    }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});
