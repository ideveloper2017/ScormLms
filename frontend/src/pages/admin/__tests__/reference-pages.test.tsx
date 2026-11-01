import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ControlsOverview } from "@/pages/admin/controls-overview";
import { TeacherLoginMonitoring } from "@/pages/admin/monitoring-reports";
import { StudentMovementRegistry } from "@/pages/admin/student-movements";
import { listStudentMovements } from "@/lib/student-api";
import { listAcademicStatements, type AcademicStatementRow } from "@/services/api/academic-results-api";
import { listTeacherLogins } from "@/services/api/monitoring-reports-api";

vi.mock("@/lib/student-api", () => ({ listStudentMovements: vi.fn() }));
vi.mock("@/services/api/academic-results-api", () => ({ listAcademicStatements: vi.fn() }));
vi.mock("@/services/api/monitoring-reports-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  listTeacherLogins: vi.fn(),
}));

const wrap = (node: ReactNode) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{node}</MemoryRouter>
  </QueryClientProvider>,
);

describe("Everest referensidagi sahifalar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("akademik ta'til reyestri buyruq turi bo'yicha so'raydi va sababni ko'rsatadi", async () => {
    vi.mocked(listStudentMovements).mockResolvedValue({
      items: [{
        eventId: 1, eventType: "SUSPENSION", studentId: 5, studentNumber: "ST-1", studentName: "Karimov Ali",
        studentStatus: "SUSPENDED", groupName: "KI-26", orderNumber: "AT-12/2026", orderDate: "2026-10-20",
        effectiveDate: "2026-10-21", reason: "Sog'lig'i sababli",
      }],
      page: 0, size: 20, totalElements: 1, totalPages: 1,
    });
    wrap(<StudentMovementRegistry eventType="SUSPENSION" showReason title="Akademik ta'tildagi talabalar" description="d" />);

    const row = (await screen.findByText("Karimov Ali")).closest("tr") as HTMLElement;
    expect(row).toHaveTextContent("KI-26");
    expect(row).toHaveTextContent("To'xtatilgan");
    expect(row).toHaveTextContent("Sog'lig'i sababli");
    expect(row).toHaveTextContent("AT-12/2026");
    expect(listStudentMovements).toHaveBeenCalledWith({ eventType: "SUSPENSION", search: undefined, page: 0, size: 20 });
    expect(screen.getByRole("columnheader", { name: "Sabab" })).toBeInTheDocument();
  });

  it("tiklash reyestrida sabab ustuni yo'q", async () => {
    vi.mocked(listStudentMovements).mockResolvedValue({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    wrap(<StudentMovementRegistry eventType="REINSTATEMENT" title="O'qishni tiklagan talabalar" description="d" />);
    expect(await screen.findByText("Ma'lumot mavjud emas")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Sabab" })).not.toBeInTheDocument();
    expect(listStudentMovements).toHaveBeenCalledWith(expect.objectContaining({ eventType: "REINSTATEMENT" }));
  });

  it("nazoratlar guruh, yil va semestr bo'yicha fanlarga yig'iladi", async () => {
    const row = (id: number, group: string, subject: string, finalStatement: boolean): AcademicStatementRow => ({
      id, topic: "t", subject, group, academicYear: "2026-2027", semester: 1, controlType: "", statement: "",
      status: finalStatement ? "COMPLETED" : "PUBLISHED", finalStatement, addedDate: "2026-10-01", resultCount: 0, passedCount: 0,
    });
    vi.mocked(listAcademicStatements).mockResolvedValue([
      row(1, "KI-26", "Fizika", true), row(2, "KI-26", "Fizika", false), row(3, "KI-26", "Dasturlash", true), row(4, "DI-26", "Fizika", true),
    ]);
    wrap(<ControlsOverview />);

    const ki = (await screen.findByText("KI-26")).closest("tr") as HTMLElement;
    expect(within(ki).getByText("Fizika · 1/2")).toBeInTheDocument();
    expect(within(ki).getByText("Dasturlash · 1/1")).toBeInTheDocument();
    expect(within(screen.getByText("DI-26").closest("tr") as HTMLElement).getByText("Fizika · 1/1")).toBeInTheDocument();
    expect(listAcademicStatements).toHaveBeenCalledWith();
  });

  it("o'qituvchilar monitoringi kafedra va oxirgi kirishni ko'rsatadi", async () => {
    vi.mocked(listTeacherLogins).mockResolvedValue([
      { teacherId: 1, fullName: "Aliyev Vali", department: "Fizika kafedrasi", lastLoginAt: null, inactiveDays: null },
    ]);
    wrap(<TeacherLoginMonitoring />);
    const row = (await screen.findByText("Aliyev Vali")).closest("tr") as HTMLElement;
    expect(row).toHaveTextContent("Fizika kafedrasi");
    expect(row).toHaveTextContent("Kirmagan");
  });
});
