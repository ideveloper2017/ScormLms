import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import {
  createRatingSystem,
  deleteRatingSystem,
  getAcademicDashboard,
  listAcademicStatements,
  listAcademicTestResults,
  listFailedStudentSummary,
  listGradeDistribution,
  listProgramAppropriation,
  listRatingSystems,
  listStudentAcademicResults,
  listStudentGpa,
  listStudentTaskReports,
  listSubjectReports,
  updateRatingSystem,
} from "../academic-results-api";

vi.mock("@/lib/api");

describe("academicResultsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("barcha natija va statistika endpointlarini alohida chaqiradi", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await Promise.all([
      listRatingSystems(), listAcademicStatements(true), listStudentAcademicResults(), listStudentGpa(),
      listAcademicTestResults(), listSubjectReports(), listStudentTaskReports(), listProgramAppropriation(),
      listGradeDistribution(), listFailedStudentSummary(), getAcademicDashboard(),
    ]);
    expect(api.get).toHaveBeenCalledWith("/academic-results/statements", { params: { final: true } });
    expect(api.get).toHaveBeenCalledWith("/academic-results/student-results", undefined);
    expect(api.get).toHaveBeenCalledWith("/academic-results/gpa", undefined);
    expect(api.get).toHaveBeenCalledWith("/academic-results/test-results", undefined);
    expect(api.get).toHaveBeenCalledWith("/academic-results/subject-reports", undefined);
    expect(api.get).toHaveBeenCalledWith("/academic-results/student-tasks", undefined);
    expect(api.get).toHaveBeenCalledWith("/academic-results/appropriation", undefined);
    expect(api.get).toHaveBeenCalledWith("/academic-results/grade-distribution", undefined);
    expect(api.get).toHaveBeenCalledWith("/academic-results/failed-summary", undefined);
    expect(api.get).toHaveBeenCalledWith("/academic-results/dashboard", undefined);
  });

  it("baholash tizimi CRUD endpointlarini ishlatadi", async () => {
    const body = { name: "100 ballik", shortName: "100 ball", minScore: 0, maxScore: 100, passScore: 60, active: true };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1, ...body } });
    vi.mocked(api.put).mockResolvedValue({ data: { id: 1, ...body } });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });
    await createRatingSystem(body); await updateRatingSystem(1, body); await deleteRatingSystem(1);
    expect(api.post).toHaveBeenCalledWith("/academic-results/rating-systems", body);
    expect(api.put).toHaveBeenCalledWith("/academic-results/rating-systems/1", body);
    expect(api.delete).toHaveBeenCalledWith("/academic-results/rating-systems/1");
  });
});
