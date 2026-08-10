import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { academicPeriodApi } from "../academic-period-api";

vi.mock("@/lib/api");

describe("academicPeriodApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads active academic years for selectors", async () => {
    const years = [{ id: 1, code: "2026-2027", startsOn: "2026-09-01", endsOn: "2027-08-31", active: true, current: true }];
    vi.mocked(api.get).mockResolvedValue({ data: years });
    await expect(academicPeriodApi.listYears()).resolves.toEqual(years);
    expect(api.get).toHaveBeenCalledWith("/academic-periods/years", { params: { includeInactive: false } });
  });

  it("updates immutable semester definition state", async () => {
    const semester = { id: 3, semesterNumber: 3, nameUz: "3-semestr", courseNumber: 2, active: false };
    vi.mocked(api.put).mockResolvedValue({ data: semester });
    await expect(academicPeriodApi.updateSemester(3, { nameUz: "3-semestr", active: false })).resolves.toEqual(semester);
    expect(api.put).toHaveBeenCalledWith("/academic-periods/semesters/3", { nameUz: "3-semestr", active: false });
  });
});
