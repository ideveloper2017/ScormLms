import { describe, expect, it } from "vitest";
import { admissionPolicyInputError, authorityForGovernance, type SaveDistanceAdmissionPolicyInput } from "../admission-policy-api";

const input = (patch: Partial<SaveDistanceAdmissionPolicyInput> = {}): SaveDistanceAdmissionPolicyInput => ({
  programId: 1, academicYear: "2026-2027", versionCode: "QABUL-2026-01",
  institutionGovernanceType: "STATE_STANDARD", approvalAuthorityType: "SUBORDINATE_MINISTRY_AGENCY",
  institutionName: "Test universiteti", approvingAuthorityName: "Tegishli vazirlik",
  admissionQuota: 300, contractAmount: 12_000_000,
  higherEducationMinistryAgreementReference: "OO'MTV-17", economyMinistryAgreementReference: "IQV-21",
  ...patch,
});

describe("decision 559 admission policy guards", () => {
  it("maps each institution type to the prescribed approval authority", () => {
    expect(authorityForGovernance("STATE_STANDARD")).toBe("SUBORDINATE_MINISTRY_AGENCY");
    expect(authorityForGovernance("STATE_FINANCIALLY_AUTONOMOUS")).toBe("SUPERVISORY_BOARD");
    expect(authorityForGovernance("NON_STATE")).toBe("FOUNDER");
  });

  it("requires both ministry agreements only for a standard state institution", () => {
    expect(admissionPolicyInputError(input())).toBeNull();
    expect(admissionPolicyInputError(input({ economyMinistryAgreementReference: "" }))).toContain("ikki vazirlik");
    expect(admissionPolicyInputError(input({
      institutionGovernanceType: "NON_STATE", approvalAuthorityType: "FOUNDER",
      higherEducationMinistryAgreementReference: null, economyMinistryAgreementReference: null,
    }))).toBeNull();
  });

  it("rejects mismatched authority, invalid year, quota and amount", () => {
    expect(admissionPolicyInputError(input({ approvalAuthorityType: "FOUNDER" }))).toContain("mos tasdiqlovchi");
    expect(admissionPolicyInputError(input({ academicYear: "2026-2028" }))).toContain("YYYY-YYYY");
    expect(admissionPolicyInputError(input({ admissionQuota: 0 }))).toContain("musbat butun");
    expect(admissionPolicyInputError(input({ contractAmount: 0 }))).toContain("musbat");
  });
});
