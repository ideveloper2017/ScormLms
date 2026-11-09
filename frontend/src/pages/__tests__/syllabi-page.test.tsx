import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { AdminSyllabi } from "../admin/syllabi";
import { curriculumApi, type CurriculumSubject, type CurriculumVersion } from "@/services/api/curriculum-api";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { list: vi.fn(), get: vi.fn(), attachSyllabus: vi.fn() },
}));
vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { list: vi.fn(), delete: vi.fn(), mediaFile: vi.fn() },
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ user: { id: 1, role: { name: "admin" }, roles: [], permissions: ["ACADEMIC_WRITE"] } }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const row = (patch: Partial<CurriculumSubject>): CurriculumSubject => ({
  id: 9, subjectId: 1, subjectCode: "DAS1110", subjectName: "Dasturlash 1,2", credits: 6, semester: 1, planItemType: "REQUIRED",
  planRowNumber: "1.09", lectureHours: 18, practicalHours: 27, laboratoryHours: 27, seminarHours: 0, auditoryHours: 72, selfStudyHours: 108, ...patch,
});
const version = (id: number, subjects: CurriculumSubject[], patch: Partial<CurriculumVersion> = {}) => ({
  id, programName: "Dasturiy injiniring", versionCode: `DI-${id}`, academicYear: "2025-2026", educationLanguage: "uz-Latn",
  status: "APPROVED", subjects, ...patch,
}) as CurriculumVersion;
const syllabus = (patch: Partial<SubjectSyllabus>): SubjectSyllabus => ({
  id: 41, subjectId: 1, subjectCode: "DAS1110", subjectName: "Dasturlash 1,2", name: "Dasturlash 1,2", language: "UZ", shortDescription: "q",
  fullDescription: "t", active: true, status: "APPROVED", revisionNumber: 1, topics: [], ...patch,
});
const mount = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <MemoryRouter><AdminSyllabi /></MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({})]);
  vi.mocked(curriculumApi.list).mockResolvedValue([version(5, []), version(6, [], { status: "ARCHIVED", versionCode: "ESKI" })]);
  vi.mocked(curriculumApi.get).mockResolvedValue(version(5, [row({}), row({ id: 10, semester: 2 }), row({ id: 11, subjectId: 2, subjectName: "Akademik yozuv" })]));
});

it("faqat bitta «O'quv dasturlari» ro'yxati (tablarsiz); ⋮ menyudan dastur o'quv reja faniga biriktiriladi", async () => {
  mount();

  expect(await screen.findByRole("heading", { level: 1, name: "O'quv dasturlari" })).toBeInTheDocument();
  expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  const line = (await screen.findByRole("button", { name: /Dasturlash 1,2 — dasturni ochish/ })).closest("tr") as HTMLElement;

  fireEvent.keyDown(within(line).getByRole("button", { name: "Dasturlash 1,2 — amallar" }), { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem", { name: "O'quv rejaga biriktirish" }));
  const dialog = await screen.findByRole("dialog", { name: "O'quv rejaga biriktirish" });
  // Arxivlangan reja chiqmaydi; rejada faqat shu fan (ikki semestri bitta qator bo'lib)
  expect(within(await within(dialog).findByLabelText("O'quv reja")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Dasturiy injiniring · DI-5 · 2025-2026"]);
  expect(await within(dialog).findByText("1, 2-semestr", { exact: false })).toBeInTheDocument();
  expect(within(dialog).queryByText(/Akademik yozuv/)).not.toBeInTheDocument();

  vi.mocked(curriculumApi.attachSyllabus).mockResolvedValue(version(5, []));
  fireEvent.click(within(dialog).getByRole("button", { name: "Biriktirish" }));
  await waitFor(() => expect(curriculumApi.attachSyllabus).toHaveBeenCalledWith(5, 9, 41));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
