import { describe, expect, it } from "vitest";
import { canApprovePractice, canCompletePractice, practicePlacementInputValid, type SaveStudentPracticeInput, type StudentPractice } from "../practice-api";

const input = (patch: Partial<SaveStudentPracticeInput> = {}): SaveStudentPracticeInput => ({
  studentId: 1,
  academicYear: "2026-2027",
  planReference: "O'R-2026/21",
  startsOn: "2027-02-01",
  endsOn: "2027-03-15",
  placementBasis: "CURRENT_WORKPLACE",
  organizationName: "Raqamli markaz",
  organizationAddress: "Toshkent shahri",
  jobTitle: "Dasturchi",
  specialtyMatchConfirmed: true,
  basisEvidenceReference: "EMP-001",
  ...patch,
});

const practice = (patch: Partial<StudentPractice> = {}): StudentPractice => ({
  id: 1, studentId: 1, studentNumber: "S-1", studentName: "Ali Karimov", academicYear: "2026-2027",
  planReference: "O'R-2026/21", startsOn: "2027-02-01", endsOn: "2027-03-15", placementBasis: "CURRENT_WORKPLACE",
  organizationName: "Raqamli markaz", organizationAddress: "Toshkent", jobTitle: "Dasturchi",
  specialtyMatchConfirmed: true, basisEvidenceReference: "EMP-001", ruleCompliant: true, status: "DRAFT", ...patch,
});

describe("decision 559 practice guards", () => {
  it("requires specialty match at a current workplace", () => {
    expect(practicePlacementInputValid(input())).toBe(true);
    expect(practicePlacementInputValid(input({ specialtyMatchConfirmed: false }))).toBe(false);
    expect(practicePlacementInputValid(input({ jobTitle: "" }))).toBe(false);
  });

  it("requires an agreement made no later than partner practice start", () => {
    expect(practicePlacementInputValid(input({ placementBasis: "PARTNER_ORGANIZATION", jobTitle: undefined, specialtyMatchConfirmed: false, agreementNumber: "KEL-17", agreementDate: "2027-01-10" }))).toBe(true);
    expect(practicePlacementInputValid(input({ placementBasis: "PARTNER_ORGANIZATION", agreementNumber: "KEL-17", agreementDate: "2027-02-02" }))).toBe(false);
  });

  it("gates approval and completion by lifecycle and end date", () => {
    expect(canApprovePractice(practice())).toBe(true);
    expect(canApprovePractice(practice({ ruleCompliant: false }))).toBe(false);
    expect(canCompletePractice(practice({ status: "APPROVED" }), new Date("2027-03-15T12:00:00Z"))).toBe(true);
    expect(canCompletePractice(practice({ status: "APPROVED" }), new Date("2027-03-14T12:00:00Z"))).toBe(false);
  });
});

