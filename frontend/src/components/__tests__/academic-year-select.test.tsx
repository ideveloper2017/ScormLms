import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AcademicYearSelect } from "@/components/academic-year-select";

vi.mock("@/services/api/academic-period-api", () => ({
  academicPeriodApi: {
    listYears: vi.fn(async () => [
      { id: 1, code: "2024-2025", current: false, active: true },
      { id: 2, code: "2025-2026", current: true, active: true },
    ]),
  },
}));

const mount = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

describe("AcademicYearSelect", () => {
  beforeEach(() => vi.clearAllMocks());

  it("o'quv yili ro'yxatdan tanlanadi, bo'sh bo'lsa joriy yil o'zi qo'yiladi", async () => {
    const onChange = vi.fn();
    mount(<AcademicYearSelect aria-label="O'quv yili" value="" onChange={onChange} />);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("2025-2026"));

    fireEvent.change(screen.getByLabelText("O'quv yili"), { target: { value: "2024-2025" } });
    expect(onChange).toHaveBeenLastCalledWith("2024-2025");
  });

  it("emptyLabel berilsa bo'sh qoladi (masalan, filtrda barcha yillar)", async () => {
    const onChange = vi.fn();
    mount(<AcademicYearSelect aria-label="O'quv yili" value="" emptyLabel="Barcha yillar" onChange={onChange} />);
    expect(await screen.findByRole("option", { name: "2025-2026 · joriy" })).toBeInTheDocument();
    expect(screen.getByLabelText("O'quv yili")).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });
});
