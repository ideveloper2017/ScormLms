import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { AdminStudyPlanEditor } from "../admin/study-plan-editor";
import { listDepartments, listFaculties, listPrograms, listSubjects, type SubjectRecord } from "@/lib/academic-api";
import { curriculumApi, type CurriculumVersion } from "@/services/api/curriculum-api";

vi.mock("@/lib/academic-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  listDepartments: vi.fn(), listFaculties: vi.fn(), listPrograms: vi.fn(), listSubjects: vi.fn(),
}));
vi.mock("@/services/api/academic-period-api", () => ({
  academicPeriodApi: {
    listYears: vi.fn(async () => [{ id: 1, code: "2025-2026", current: true, active: true }]),
    listSemesters: vi.fn(async () => []),
  },
}));
vi.mock("@/services/api/academic-results-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  listRatingSystems: vi.fn(async () => [{ id: 3, name: "5 ballik", passScore: 60, active: true }]),
}));
vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { get: vi.fn(), create: vi.fn(), update: vi.fn(), addSubject: vi.fn(), importDraft: vi.fn() },
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ user: { id: 1, role: { name: "admin" }, roles: [], permissions: ["ACADEMIC_WRITE"] } }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const subject = (id: number, name: string, programId: number | null) =>
  ({ id, name, code: `F${id}`, credits: 4, active: true, programId }) as SubjectRecord;
const mount = (path: string) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/edu-process/curriculum/new" element={<AdminStudyPlanEditor />} />
        <Route path="/edu-process/curriculum/:id" element={<AdminStudyPlanEditor />} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  vi.mocked(listFaculties).mockResolvedValue([{ id: 2, name: "Muhandislik-axborot texnologiyalari", active: true }] as never);
  vi.mocked(listDepartments).mockResolvedValue([{ id: 4, name: "ATT kafedrasi", facultyId: 2 }] as never);
  vi.mocked(listPrograms).mockResolvedValue([
    { id: 31, name: "Kompyuter injiniringi", code: "60610300", active: true, distanceEnabled: true, departmentId: 4, educationLanguage: "uz" },
  ] as never);
});

it("yangi reja formasida faqat asosiy maydonlar, texnik maydonlar 'Qo'shimcha sozlamalar' ichida", async () => {
  mount("/edu-process/curriculum/new");

  expect(await screen.findByText("O'quv reja yaratish")).toBeInTheDocument();
  for (const label of ["Fakultet *", "Ta'lim yo'nalishi *", "O'quv yili *", "Ta'lim shakli *", "O'qitish tili *", "Semestrlar soni *", "Reja nomi *"]) {
    expect(screen.getByText(label)).toBeInTheDocument();
  }
  const advanced = screen.getByText("Qo'shimcha sozlamalar").closest("details") as HTMLElement;
  expect(advanced).not.toHaveAttribute("open");
  expect(within(advanced).getByText("Bazaviy kredit summasi")).toBeInTheDocument();
  expect(within(advanced).getByText("Baholash tizimi")).toBeInTheDocument();
  // Excel'dan to'ldirish ham shu yerda
  expect(screen.getByLabelText("Ishchi o'quv reja faylidan to'ldirish")).toBeInTheDocument();
  // Rekvizit va amal qilish sanalari yaratishda so'ralmaydi
  expect(screen.queryByText(/rekviziti/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/Amal qilish boshlanishi/)).not.toBeInTheDocument();
});

it("fan qo'shishda yo'nalish fanlari va umumiy fanlar chiqadi, boshqa yo'nalish fanlari chiqmaydi", async () => {
  vi.mocked(curriculumApi.get).mockResolvedValue({
    id: 5, programId: 31, programName: "Kompyuter injiniringi", versionCode: "CUR-1", academicYear: "2025-2026", name: "KI 2025",
    active: true, educationLanguage: "uz-Latn", passingScore: 60, baseCreditAmount: 0, educationForm: "DISTANCE", ratingSystemId: 3,
    ratingSystemName: "5 ballik", semesterCount: 8, credentialType: "STATE_DIPLOMA", normativeBasisType: "STATE_EDUCATION_STANDARD",
    standardReference: "", qualificationRequirementsReference: "", validFrom: "2025-09-01", validUntil: "2026-08-31", status: "DRAFT",
    subjects: [], subjectCount: 0, totalCredits: 0, startYear: 2025,
  } as unknown as CurriculumVersion);
  vi.mocked(listSubjects).mockResolvedValue([
    subject(1, "Dasturlash", 31), subject(2, "Falsafa", null), subject(3, "Mikroiqtisodiyot", 99),
  ]);
  mount("/edu-process/curriculum/5?tab=subjects");

  const trigger = await screen.findByRole("combobox", { name: "Fan" });
  await waitFor(() => expect(listSubjects).toHaveBeenCalled());
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  await waitFor(() => expect(screen.getAllByRole("option").length).toBeGreaterThan(1));
  const options = screen.getAllByRole("option").map((o) => o.textContent);
  expect(options).toEqual(expect.arrayContaining(["F1 · Dasturlash · 4 kredit", "F2 · Falsafa · 4 kredit"]));
  expect(options.some((o) => o?.includes("Mikroiqtisodiyot"))).toBe(false);
  expect(listSubjects).toHaveBeenCalledWith();
});
