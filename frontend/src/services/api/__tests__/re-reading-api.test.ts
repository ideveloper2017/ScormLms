import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import {
  changeReReadingApplicationStatus, createReReadingApplication, createReReadingPlan,
  deleteReReadingApplication, deleteReReadingPlan, listReReadingApplications, listReReadingPlans,
  listReReadingRecoveryResults, listReReadingStudentReport, listReReadingStudents,
  listReReadingTeacherReport, updateReReadingApplication, updateReReadingPlan,
} from "../re-reading-api";

vi.mock("@/lib/api");

describe("reReadingApi", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: [] }); vi.mocked(api.post).mockResolvedValue({ data: {} }); vi.mocked(api.put).mockResolvedValue({ data: {} }); vi.mocked(api.delete).mockResolvedValue({ data: undefined }); });

  it("reja va ariza oqimini alohida endpointlarga yuboradi", async () => {
    const plan = { title: "Kuzgi qayta o'qish", applicationDeadline: "2026-09-01", description: "", status: "OPEN" as const };
    const application = { planId: 2, studentId: 3, contractNumber: null, totalCredits: 6, totalAmount: 900000, paidAmount: 450000 };
    await listReReadingPlans(); await createReReadingPlan(plan); await updateReReadingPlan(2, plan); await deleteReReadingPlan(2);
    await listReReadingStudents(); await listReReadingApplications(); await createReReadingApplication(application); await updateReReadingApplication(7, application); await changeReReadingApplicationStatus(7, "SUBMITTED"); await deleteReReadingApplication(7);
    expect(api.get).toHaveBeenCalledWith("/re-reading/plans");
    expect(api.post).toHaveBeenCalledWith("/re-reading/plans", plan);
    expect(api.put).toHaveBeenCalledWith("/re-reading/plans/2", plan);
    expect(api.delete).toHaveBeenCalledWith("/re-reading/plans/2");
    expect(api.get).toHaveBeenCalledWith("/re-reading/students");
    expect(api.post).toHaveBeenCalledWith("/re-reading/applications", application);
    expect(api.post).toHaveBeenCalledWith("/re-reading/applications/7/status", { status: "SUBMITTED" });
  });

  it("baholash va ikkala hisobotni alohida yuklaydi", async () => {
    await Promise.all([listReReadingRecoveryResults(), listReReadingTeacherReport(), listReReadingStudentReport()]);
    expect(api.get).toHaveBeenCalledWith("/re-reading/recovery-results");
    expect(api.get).toHaveBeenCalledWith("/re-reading/teacher-report");
    expect(api.get).toHaveBeenCalledWith("/re-reading/student-report");
  });
});
