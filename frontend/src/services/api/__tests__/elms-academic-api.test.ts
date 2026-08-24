import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { curriculumApi } from "../curriculum-api";
import { syllabusApi } from "../syllabus-api";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

describe("ELMS akademik zanjir API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejaning semestr muddatini saqlaydi", async () => {
    const input = { semesterNumber: 2, startsOn: "2027-02-01", endsOn: "2027-06-30", active: true };
    vi.mocked(api.put).mockResolvedValueOnce({ data: { id: 1, curriculumId: 9, academicYear: "2026-2027", ...input } } as never);

    await curriculumApi.saveSemesterPeriod(9, input);

    expect(api.put).toHaveBeenCalledWith("/curricula/9/semesters/2", input);
  });

  it("tanlangan talabalarni reja semestriga biriktiradi", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: [] } as never);

    await curriculumApi.assignStudents(9, [31, 32], 2);

    expect(api.post).toHaveBeenCalledWith("/curricula/9/student-assignments", { studentIds: [31, 32], semesterNumber: 2 });
  });

  it("fan oquv dasturini katalogga yuboradi", async () => {
    const input = { subjectId: 7, name: "Algoritmlar dasturi", language: "UZ" as const, shortDescription: "Qisqa", requirements: null, fullDescription: "To'liq", active: true };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 5, ...input } } as never);

    await syllabusApi.create(input);

    expect(api.post).toHaveBeenCalledWith("/syllabi", input);
  });
});
