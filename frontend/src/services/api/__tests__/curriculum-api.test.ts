import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { canApproveCurriculum, curriculumApi, curriculumInputError, type CurriculumStudentPage, type CurriculumVersion, type SaveCurriculumVersionInput } from "../curriculum-api";

vi.mock("@/lib/api");

const input = (patch: Partial<SaveCurriculumVersionInput> = {}): SaveCurriculumVersionInput => ({
  programId: 1,
  versionCode: "CUR-2026-01",
  academicYear: "2026-2027",
  name: "Dasturiy injinering 2026",
  active: true,
  educationLanguage: "uz-Latn",
  passingScore: 60,
  baseCreditAmount: 9444000,
  educationForm: "DISTANCE",
  ratingSystemId: 1,
  semesterCount: 8,
  credentialType: "STATE_DIPLOMA",
  normativeBasisType: "STATE_EDUCATION_STANDARD",
  standardReference: "DTS-2026/17",
  qualificationRequirementsReference: "MT-2026/09",
  validFrom: "2026-09-01",
  validUntil: "2027-08-31",
  ...patch,
});

const version = (patch: Partial<CurriculumVersion> = {}): CurriculumVersion => ({
  id: 1, programId: 1, programName: "Dastur", facultyId: 1, facultyName: "Fakultet",
  versionCode: "CUR-2026-01", academicYear: "2026-2027", startYear: 2026,
  name: "Dasturiy injinering 2026", active: true, educationLanguage: "uz-Latn", passingScore: 60,
  baseCreditAmount: 9444000, educationForm: "DISTANCE", ratingSystemId: 1,
  ratingSystemName: "100 ballik baholash tizimi", semesterCount: 8,
  credentialType: "STATE_DIPLOMA", normativeBasisType: "STATE_EDUCATION_STANDARD", standardReference: "DTS-2026/17",
  qualificationRequirementsReference: "MT-2026/09", validFrom: "2026-09-01", validUntil: "2027-08-31",
  status: "DRAFT", subjects: [], subjectCount: 0, totalCredits: 0, ...patch,
});

describe("decision 559 curriculum guards", () => {
  beforeEach(() => vi.clearAllMocks());

  it("matches credential and normative basis", () => {
    expect(curriculumInputError(input())).toBeNull();
    expect(curriculumInputError(input({ normativeBasisType: "PROFESSIONAL_STANDARD" }))).toContain("Davlat diplomi");
    expect(curriculumInputError(input({ credentialType: "NON_STATE_CREDENTIAL", normativeBasisType: "PROFESSIONAL_STANDARD" }))).toBeNull();
  });

  it("requires validity to cover the full academic year", () => {
    expect(curriculumInputError(input({ validFrom: "2026-09-02" }))).toContain("butun o'quv yilini");
    expect(curriculumInputError(input({ validUntil: "2027-08-30" }))).toContain("butun o'quv yilini");
  });

  it("validates the reference-compatible curriculum fields", () => {
    expect(curriculumInputError(input({ name: "" }))).toContain("nomi");
    expect(curriculumInputError(input({ passingScore: 101 }))).toContain("0-100");
    expect(curriculumInputError(input({ baseCreditAmount: -1 }))).toContain("manfiy");
    expect(curriculumInputError(input({ ratingSystemId: 0 }))).toContain("baholash tizimini");
    expect(curriculumInputError(input({ semesterCount: 16 }))).toContain("1-15");
  });

  it("allows approval only for a draft with at least one subject", () => {
    expect(canApproveCurriculum(version())).toBe(false);
    expect(canApproveCurriculum(version({ subjectCount: 1 }))).toBe(true);
    expect(canApproveCurriculum(version({ status: "APPROVED", subjectCount: 1 }))).toBe(false);
    expect(canApproveCurriculum(version({ active: false, subjectCount: 1 }))).toBe(false);
    expect(canApproveCurriculum(version({ standardReference: "", subjectCount: 1 }))).toBe(false);
  });

  it("loads students derived from the selected curriculum program and year", async () => {
    const page: CurriculumStudentPage = {
      items: [{
        studentId: 7,
        studentNumber: "ST-007",
        fullName: "Karimov Ali",
        status: "ACTIVE",
        groupId: 3,
        groupName: "KI-26",
        courseNumber: 2,
        semesterNumber: 3,
        educationForm: "DISTANCE",
        educationLanguage: "uz",
      }],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    };
    vi.mocked(api.get).mockResolvedValue({ data: page });

    await expect(curriculumApi.listStudents(11, { search: "karimov", status: "ACTIVE", page: 0, size: 20 })).resolves.toEqual(page);
    expect(api.get).toHaveBeenCalledWith("/curricula/11/students", { params: { search: "karimov", status: "ACTIVE", page: 0, size: 20 } });
  });
});
