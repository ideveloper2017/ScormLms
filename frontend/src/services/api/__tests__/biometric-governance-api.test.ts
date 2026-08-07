import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { biometricGovernanceApi, biometricPolicyInputError, type SaveBiometricPolicyInput } from "@/services/api/biometric-governance-api";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

const input: SaveBiometricPolicyInput = {
  versionCode: "BIO-2026-1",
  title: "Proktoring biometrik siyosati",
  purposeText: "Proktorli test oldidan talaba shaxsini tekshirish",
  legalBasis: "Universitet tasdiqlagan yuridik hujjat",
  consentText: "Men biometrik shablon proktoring maqsadida qayta ishlanishiga aniq rozilik beraman.",
  privacyNotice: "Xom kadr saqlanmaydi, shablon va dalil retention muddati tugagach o'chiriladi.",
  documentNumber: "BIO-1",
  documentDate: "2026-08-06",
  documentReference: "REGISTER/BIO-1",
  faceTemplateRetentionDays: 30,
  proctoringEvidenceRetentionDays: 180,
};

describe("biometric governance API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates policy and retention boundaries", () => {
    expect(biometricPolicyInputError(input)).toBeNull();
    expect(biometricPolicyInputError({ ...input, faceTemplateRetentionDays: 0 })).toContain("1..3650");
    expect(biometricPolicyInputError({ ...input, consentText: "qisqa" })).toContain("rozilik");
  });

  it("creates and independently publishes a policy", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 7 } } as never);
    await biometricGovernanceApi.createPolicy(input);
    await biometricGovernanceApi.publishPolicy(7, "Mustaqil tekshirildi");
    expect(api.post).toHaveBeenNthCalledWith(1, "/biometric-governance/policies", input);
    expect(api.post).toHaveBeenNthCalledWith(2, "/biometric-governance/policies/7/publish", { approvalNote: "Mustaqil tekshirildi" });
  });

  it("binds consent to exact policy id and statement hash", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { consentGranted: true } } as never);
    await biometricGovernanceApi.accept(7, "abc123");
    expect(api.post).toHaveBeenCalledWith("/biometric-governance/me/consent", { policyId: 7, statementHash: "abc123" });
  });

  it("withdraws consent and invokes retention run", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    await biometricGovernanceApi.withdraw("Rozilikni qaytaraman");
    await biometricGovernanceApi.runRetention();
    expect(api.post).toHaveBeenNthCalledWith(1, "/biometric-governance/me/withdraw", { reason: "Rozilikni qaytaraman" });
    expect(api.post).toHaveBeenNthCalledWith(2, "/biometric-governance/retention/run");
  });
});
