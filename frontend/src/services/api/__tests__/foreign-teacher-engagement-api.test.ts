import { describe, expect, it } from "vitest";
import { foreignTeacherEngagementInputError, type SaveForeignTeacherEngagementInput } from "../foreign-teacher-engagement-api";

const valid = (): SaveForeignTeacherEngagementInput => ({
  teacherId: 7, academicYear: "2026-2027", citizenshipCountryCode: "IL",
  citizenshipEvidenceReference: "HR/CITIZENSHIP-7", qualificationReference: "HR/PHD-7",
  contractNumber: "FT-2026-7", contractDate: "2026-08-01", engagementOrderNumber: "ORDER-FT-7",
  engagementOrderDate: "2026-08-05", engagementStartDate: "2026-09-01", engagementEndDate: "2027-01-31",
  remoteTeachingConfirmed: true, evidenceReference: "HR/ARCHIVE-7", courseIds: [31],
});

describe("foreign teacher engagement validation", () => {
  it("accepts a complete foreign remote engagement", () => expect(foreignTeacherEngagementInputError(valid(), "2026-08-06")).toBeNull());
  it("rejects Uzbekistan as foreign citizenship", () => expect(foreignTeacherEngagementInputError({ ...valid(), citizenshipCountryCode: "UZ" }, "2026-08-06")).toContain("UZdan boshqa"));
  it("rejects an engagement without distance course", () => expect(foreignTeacherEngagementInputError({ ...valid(), courseIds: [] }, "2026-08-06")).toContain("masofaviy kurs"));
  it("rejects a future order", () => expect(foreignTeacherEngagementInputError({ ...valid(), engagementOrderDate: "2026-08-07" }, "2026-08-06")).toContain("kelajakda"));
});
