import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { listElectiveExceptions, listInactiveStudents, listLearningParticipation, listLessonComments, listStudentIps } from "../monitoring-reports-api";

vi.mock("@/lib/api");

describe("monitoringReportsApi", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: [] }); });

  it("har bir monitoring sahifasi alohida endpoint ishlatadi", async () => {
    await Promise.all([listInactiveStudents(30), listElectiveExceptions(), listLearningParticipation(), listStudentIps(), listLessonComments()]);
    expect(api.get).toHaveBeenCalledWith("/monitoring/inactive-students", { params: { inactiveDays: 30 } });
    expect(api.get).toHaveBeenCalledWith("/monitoring/elective-exceptions", undefined);
    expect(api.get).toHaveBeenCalledWith("/monitoring/learning-participation", undefined);
    expect(api.get).toHaveBeenCalledWith("/monitoring/student-ips", undefined);
    expect(api.get).toHaveBeenCalledWith("/monitoring/lesson-comments", undefined);
  });
});
