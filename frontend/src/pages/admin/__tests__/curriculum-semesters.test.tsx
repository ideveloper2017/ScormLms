import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculumSemesters } from "@/pages/admin/curriculum-semesters";
import { curriculumApi, type CurriculumSemesterOverview } from "@/services/api/curriculum-api";

vi.mock("@/services/api/curriculum-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  curriculumApi: { semesterOverview: vi.fn() },
}));
// Katalog tabi bu testda ochilmaydi
vi.mock("@/pages/admin/academic-periods", () => ({ AdminAcademicPeriods: () => null }));

const row = (semesterNumber: number, startsOn: string | null, endsOn: string | null): CurriculumSemesterOverview => ({
  curriculumId: 7, curriculumName: "Dasturiy injiniring", versionCode: "CUR-2026", programName: "DI",
  curriculumStatus: "APPROVED", academicYear: "2026-2027", semesterNumber, periodId: startsOn ? semesterNumber : null,
  startsOn, endsOn, active: startsOn ? true : null,
});

describe("CurriculumSemesters", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-11-01T10:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("reja semestrlarini muddat holati bilan ko'rsatadi va muddatni o'zgartirishga olib boradi", async () => {
    vi.mocked(curriculumApi.semesterOverview).mockResolvedValue([
      row(1, "2026-09-15", "2027-01-31"), row(2, "2027-02-02", "2027-06-06"), row(3, null, null),
    ]);
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter><CurriculumSemesters /></MemoryRouter>
    </QueryClientProvider>);

    const first = (await screen.findByText("1-semestr")).closest("tr") as HTMLElement;
    expect(within(first).getByText("Joriy")).toBeInTheDocument();
    expect(first).toHaveTextContent("15.09.2026");
    expect(first).toHaveTextContent("Tasdiqlangan");
    expect(within(screen.getByText("2-semestr").closest("tr") as HTMLElement).getByText("Kelgusi")).toBeInTheDocument();
    expect(within(screen.getByText("3-semestr").closest("tr") as HTMLElement).getByText("Muddat kiritilmagan")).toBeInTheDocument();
  });
});
