import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { AdminSyllabi } from "../admin/syllabi";
import { curriculumApi, type CurriculumSubject, type CurriculumVersion } from "@/services/api/curriculum-api";
import { syllabusApi, type SubjectSyllabus } from "@/services/api/syllabus-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { list: vi.fn(), get: vi.fn(), createSyllabus: vi.fn(), attachSyllabus: vi.fn(), detachSyllabus: vi.fn() },
}));
vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: { list: vi.fn(), linkedCourses: vi.fn(async () => []), updateTopicsWithCourses: vi.fn() },
}));
vi.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ user: { id: 1, role: { name: "admin" }, roles: [], permissions: ["ACADEMIC_WRITE"] } }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

const row = (patch: Partial<CurriculumSubject>): CurriculumSubject => ({
  id: 9, subjectId: 1, subjectCode: "DAS1110", subjectName: "Dasturlash 1,2", credits: 6, semester: 1, planItemType: "REQUIRED",
  planRowNumber: "1.09", lectureHours: 18, practicalHours: 27, laboratoryHours: 27, seminarHours: 0, auditoryHours: 72, selfStudyHours: 108, ...patch,
});
const sem2 = row({ id: 10, semester: 2, credits: 4, lectureHours: 12, practicalHours: 18, laboratoryHours: 18, auditoryHours: 48, selfStudyHours: 72 });
const writing = row({
  id: 11, subjectId: 2, subjectCode: "AKY1104", subjectName: "Akademik yozuv", planRowNumber: "1.10", credits: 4, lectureHours: 0,
  practicalHours: 48, laboratoryHours: 0, auditoryHours: 48, selfStudyHours: 72,
  syllabusId: 40, syllabusName: "Akademik yozuv", syllabusLanguage: "UZ", syllabusStatus: "APPROVED", syllabusTopicCount: 9, syllabusHoursMatch: true,
});
const version = (id: number, subjects: CurriculumSubject[], patch: Partial<CurriculumVersion> = {}) => ({
  id, programName: "Dasturiy injiniring", versionCode: `DI-${id}`, academicYear: "2025-2026", educationLanguage: "uz-Latn",
  status: "APPROVED", subjects, ...patch,
}) as CurriculumVersion;
const syllabus = (patch: Partial<SubjectSyllabus>): SubjectSyllabus => ({
  id: 41, subjectId: 1, subjectName: "Dasturlash 1,2", name: "Dasturlash 1,2", language: "UZ", shortDescription: "q",
  fullDescription: "t", active: true, status: "DRAFT", revisionNumber: 1, topics: [], ...patch,
});
const mount = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <MemoryRouter><AdminSyllabi /></MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(curriculumApi.list).mockResolvedValue([version(5, []), version(6, [], { status: "ARCHIVED", versionCode: "ESKI" })]);
  vi.mocked(curriculumApi.get).mockResolvedValue(version(5, [row({}), sem2, writing]));
  vi.mocked(syllabusApi.list).mockResolvedValue([]);
});

it("reja fanlari va ularning o'quv dasturlari; dastur yaratilgach mavzular oynasi reja soatlari bilan ochiladi", async () => {
  mount();

  const select = await screen.findByLabelText("O'quv reja");
  expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["Dasturiy injiniring · DI-5 · 2025-2026"]);
  const dasturlash = (await screen.findByText("Dasturlash 1,2")).closest("tr") as HTMLElement;
  expect(within(dasturlash).getByText("1, 2")).toBeInTheDocument();
  expect(within(dasturlash).getByText("Tuzilmagan")).toBeInTheDocument();
  const yozuv = screen.getByText("Akademik yozuv", { selector: "p.font-medium" }).closest("tr") as HTMLElement;
  expect(within(yozuv).getByText("Tasdiqlangan")).toBeInTheDocument();
  expect(within(yozuv).getByRole("button", { name: /9 mavzu/ })).toHaveAttribute("title", "Mavzu soatlari rejaga mos");
  expect(screen.getByText("2 ta fandan 1 tasiga o'quv dasturi tuzilgan")).toBeInTheDocument();

  fireEvent.click(within(dasturlash).getByRole("button", { name: /Dastur yaratish/ }));
  const dialog = await screen.findByRole("dialog", { name: "Yangi o'quv dasturi" });
  expect(within(dialog).getByLabelText("Fan *")).toHaveValue("9");
  expect(within(dialog).getByLabelText("Rejadagi soatlar"))
    .toHaveTextContent("Rejada: 1, 2-semestr · 6+4 kredit · Ma'ruza 30 · Amaliy 45 · Laboratoriya 45 · Mustaqil ta'lim 180");
  expect(within(dialog).getByRole("option", { name: "1.10 Akademik yozuv — dastur bor" })).toBeDisabled();
  expect(await within(dialog).findByLabelText("Dastur tili")).toHaveValue("UZ");

  vi.mocked(curriculumApi.createSyllabus).mockResolvedValue(version(5, []));
  vi.mocked(curriculumApi.get).mockResolvedValue(version(5, [
    row({ syllabusId: 41, syllabusName: "Dasturlash 1,2", syllabusTopicCount: 0, syllabusHoursMatch: false }),
    { ...sem2, syllabusId: 41 }, writing,
  ]));
  vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({})]);
  fireEvent.change(within(dialog).getByLabelText("Fanning maqsadi va vazifalari"), { target: { value: "Dasturlash asoslari" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Yaratish va mavzularni kiritish" }));

  await waitFor(() => expect(curriculumApi.createSyllabus).toHaveBeenCalledWith(5, 9, {
    language: "UZ", shortDescription: "Dasturlash asoslari", fullDescription: "Dasturlash asoslari",
  }));
  const topics = await screen.findByRole("dialog", { name: "Dasturlash 1,2 — mavzular" });
  expect(within(topics).getByLabelText("Reja bilan solishtirish")).toHaveTextContent("2-qism (2-semestr):");
  expect(screen.queryByRole("dialog", { name: "Yangi o'quv dasturi" })).not.toBeInTheDocument();
});

it("fanning mavjud dasturi oldindan tanlanadi va biriktiriladi", async () => {
  vi.mocked(syllabusApi.list).mockResolvedValue([syllabus({ id: 30, name: "Dasturlash (KI rejasi)", topics: [] })]);
  vi.mocked(curriculumApi.attachSyllabus).mockResolvedValue(version(5, []));
  mount();

  fireEvent.click(await screen.findByRole("button", { name: /Yangi o'quv dasturi/ }));
  const dialog = await screen.findByRole("dialog", { name: "Yangi o'quv dasturi" });
  const existing = await within(dialog).findByRole("radio", { name: /Dasturlash \(KI rejasi\)/ });
  expect(existing).toBeChecked();
  expect(within(dialog).queryByLabelText("Dastur tili")).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Biriktirish va mavzularni ochish" }));
  await waitFor(() => expect(curriculumApi.attachSyllabus).toHaveBeenCalledWith(5, 9, 30));
  expect(curriculumApi.createSyllabus).not.toHaveBeenCalled();
});

it("o'quv rejalar yuklanmasa xabar va qayta yuklash tugmasi chiqadi", async () => {
  vi.mocked(curriculumApi.list).mockRejectedValue(new Error("offline"));
  mount();
  expect(await screen.findByRole("alert")).toHaveTextContent("O'quv rejalar yuklanmadi");
  fireEvent.click(screen.getByRole("button", { name: "Qayta yuklash" }));
  await waitFor(() => expect(curriculumApi.list).toHaveBeenCalledTimes(2));
});
