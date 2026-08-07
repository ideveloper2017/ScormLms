import { describe, expect, it } from "vitest";
import { assessmentLeaveDays, assessmentLeaveInputError, type SaveAssessmentLeaveEvidenceInput } from "../assessment-leave-api";

const valid = (): SaveAssessmentLeaveEvidenceInput => ({
  studentId: 1, academicYear: "2026-2027", leavePurpose: "SEMESTER_FINAL_ASSESSMENT",
  assessmentReference: "8-semestr jadvali №17", employerName: "Ish beruvchi", jobTitle: "Dasturchi",
  employmentDocumentReference: "MEHNAT-441", leaveOrderNumber: "ORDER-22", leaveOrderDate: "2026-09-01",
  leaveStartDate: "2026-09-10", leaveEndDate: "2026-09-24", salaryRetentionConfirmed: true,
  evidenceReference: "ARCHIVE/ORDER-22",
});

describe("assessment leave validation", () => {
  it("counts both boundary dates", () => expect(assessmentLeaveDays("2026-09-10", "2026-09-24")).toBe(15));
  it("accepts a complete fifteen-day record", () => expect(assessmentLeaveInputError(valid())).toBeNull());
  it("rejects fourteen calendar days", () => expect(assessmentLeaveInputError({ ...valid(), leaveEndDate: "2026-09-23" })).toContain("15 kalendar"));
  it("rejects an order issued after leave starts", () => expect(assessmentLeaveInputError({ ...valid(), leaveOrderDate: "2026-09-11" })).toContain("kech"));
});
