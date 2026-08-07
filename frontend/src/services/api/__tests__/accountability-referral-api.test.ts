import { describe, expect, it } from "vitest";
import { accountabilityDecisionInputError, accountabilityReferralInputError, type AccountabilityDecisionInput, type SaveAccountabilityReferralInput } from "../accountability-referral-api";

const referral = (): SaveAccountabilityReferralInput => ({
  complianceIssueId: 17, reviewSubjectReference: "HR/SUBJECT-17", competentAuthority: "Intizomiy komissiya",
  legalBasis: "Mehnat kodeksi va ichki reglament", referralNumber: "REF-33-17", referralDate: "2026-08-05",
  evidencePackageReference: "LEGAL/EVIDENCE-33-17",
});
const decision = (): AccountabilityDecisionInput => ({
  outcome: "NO_RESPONSIBILITY_FOUND", decisionAuthority: "Intizomiy komissiya", decisionNumber: "DEC-33-17",
  decisionDate: "2026-08-06", decisionEvidenceReference: "LEGAL/DECISION-33-17",
  decisionSummary: "Vakolatli komissiya javobgarlik uchun asos topilmadi deb qaror qildi.",
});

describe("accountability referral validation", () => {
  it("accepts complete referral evidence", () => expect(accountabilityReferralInputError(referral(), "2026-08-06")).toBeNull());
  it("rejects future referral date", () => expect(accountabilityReferralInputError({ ...referral(), referralDate: "2026-08-07" }, "2026-08-06")).toContain("kelajakda"));
  it("accepts an authoritative external decision", () => expect(accountabilityDecisionInputError(decision(), "2026-08-05", "2026-08-06")).toBeNull());
  it("rejects decision before referral", () => expect(accountabilityDecisionInputError({ ...decision(), decisionDate: "2026-08-04" }, "2026-08-05", "2026-08-06")).toContain("oldin"));
});
