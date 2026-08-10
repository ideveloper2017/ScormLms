import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { canApproveCurriculum, curriculumApi, curriculumInputError, type CurriculumStudentPage, type CurriculumVersion, type SaveCurriculumVersionInput } from "../curriculum-api";

vi.mock("@/lib/api");

const input = (patch: Partial<SaveCurriculumVersionInput> = {}): SaveCurriculumVersionInput => ({
  programId: 1,
  versionCode: "CUR-2026-01",
  academicYear: "2026-2027",
  credentialType: "STATE_DIPLOMA",
  normativeBasisType: "STATE_EDUCATION_STANDARD",
  standardReference: "DTS-2026/17",
  qualificationRequirementsReference: "MT-2026/09",
  validFrom: "2026-09-01",
  validUntil: "2027-08-31",
  ...patch,
});

const version = (patch: Partial<CurriculumVersion> = {}): CurriculumVersion => ({
  id: 1, programId: 1, programName: "Dastur", versionCode: "CUR-2026-01", academicYear: "2026-2027",
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

  it("allows approval only for a draft with at least one subject", () => {
    expect(canApproveCurriculum(version())).toBe(false);
    expect(canApproveCurriculum(version({ subjectCount: 1 }))).toBe(true);
    expect(canApproveCurriculum(version({ status: "APPROVED", subjectCount: 1 }))).toBe(false);
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
