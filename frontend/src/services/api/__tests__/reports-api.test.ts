import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { downloadInstitutionReport, getContentCompletenessReport, getInstitutionReport } from "../reports-api";

vi.mock("@/lib/api");

describe("reports api", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("sana oraligidagi real tashkilot hisobotini oladi", async () => {
    const report = { scope: "INSTITUTION", from: "2026-01-01", to: "2026-08-06", metrics: [], courses: [] };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: report } });

    await expect(getInstitutionReport("2026-01-01", "2026-08-06")).resolves.toEqual(report);
    expect(api.get).toHaveBeenCalledWith("/reports/institution", {
      params: { from: "2026-01-01", to: "2026-08-06" },
    });
  });

  it("o'quv yili bo'yicha kontent to'liqligi hisobotini oladi", async () => {
    const report = { scope: "TEACHER", academicYear: "2026-2027", courses: [], totalCourses: 0 };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: report } });

    await expect(getContentCompletenessReport("2026-2027")).resolves.toEqual(report);
    expect(api.get).toHaveBeenCalledWith("/reports/institution/content-completeness", {
      params: { academicYear: "2026-2027" },
    });
  });

  it("server yaratgan XLSX faylni javobdagi nom bilan yuklaydi", async () => {
    const click = vi.fn();
    const revokeObjectURL = vi.fn();
    const createObjectURL = vi.fn().mockReturnValue("blob:report");
    vi.spyOn(document, "createElement").mockReturnValue({ click } as unknown as HTMLAnchorElement);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    const blob = new Blob(["xlsx"]);
    vi.mocked(api.get).mockResolvedValue({
      data: blob,
      headers: { "content-disposition": 'attachment; filename="lms-report.xlsx"' },
    });

    await downloadInstitutionReport("2026-01-01", "2026-08-06", "XLSX");

    expect(api.get).toHaveBeenCalledWith("/reports/institution/export", {
      params: { from: "2026-01-01", to: "2026-08-06", format: "XLSX" },
      responseType: "blob",
    });
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:report");
  });
});
