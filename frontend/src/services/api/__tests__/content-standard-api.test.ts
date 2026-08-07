import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { assessmentInputError, checklistInputError, contentStandardApi, type SaveChecklistInput, type StandardCriterion } from "@/services/api/content-standard-api";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

const checklist: SaveChecklistInput = {
  standardCode: "O'ZDST 36.2030", versionCode: "2026.1", title: "Rasmiy kontent checklisti",
  issuingAuthority: "Vakolatli organ", sourceDocumentNumber: "STD-1", sourceDocumentDate: "2026-08-06",
  sourceReference: "evidence://standard/1", validFrom: "2026-08-06", validUntil: null,
  criteria: [{ criterionCode: "C-1", title: "Birinchi mezon", description: "Rasmiy standartdagi birinchi mezon tavsifi", required: true, position: 1 }],
};
const criteria: StandardCriterion[] = [{ id: 11, ...checklist.criteria[0] }];

describe("content standard api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates official checklist identity, uniqueness and dates", () => {
    expect(checklistInputError(checklist)).toBeNull();
    expect(checklistInputError({ ...checklist, standardCode: "O'ZDST 36.2030" })).toBeNull();
    expect(checklistInputError({ ...checklist, validUntil: "2026-08-05" })).toContain("oldin");
    expect(checklistInputError({ ...checklist, criteria: [...checklist.criteria, { ...checklist.criteria[0] }] })).toContain("takrorlanmasligi");
  });

  it("requires evidence for met and explanation for unmet criteria", () => {
    const base = { contentRevisionId: 7, checklistId: 3, responses: [{ criterionId: 11, met: true, evidenceReference: "repo://proof" }] };
    expect(assessmentInputError(base, criteria)).toBeNull();
    expect(assessmentInputError({ ...base, responses: [{ criterionId: 11, met: true }] }, criteria)).toContain("dalil");
    expect(assessmentInputError({ ...base, responses: [{ criterionId: 11, met: false, note: "qisqa" }] }, criteria)).toContain("izoh");
  });

  it("uses checklist lifecycle endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never);
    await contentStandardApi.createChecklist(checklist);
    await contentStandardApi.updateChecklist(3, checklist);
    await contentStandardApi.publishChecklist(3, "Mustaqil tekshiruv yakunlandi");
    await contentStandardApi.rejectChecklist(3, "Rasmiy mezonlar to'liq emas");
    await contentStandardApi.archiveChecklist(3);
    expect(api.post).toHaveBeenNthCalledWith(1, "/content-standard/checklists", checklist);
    expect(api.put).toHaveBeenCalledWith("/content-standard/checklists/3", checklist);
    expect(api.post).toHaveBeenNthCalledWith(2, "/content-standard/checklists/3/publish", { note: "Mustaqil tekshiruv yakunlandi" });
    expect(api.post).toHaveBeenNthCalledWith(3, "/content-standard/checklists/3/reject", { note: "Rasmiy mezonlar to'liq emas" });
    expect(api.post).toHaveBeenNthCalledWith(4, "/content-standard/checklists/3/archive");
  });

  it("uses exact revision assessment and independent review endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    const input = { contentRevisionId: 7, checklistId: 3, responses: [{ criterionId: 11, met: true, evidenceReference: "repo://proof" }] };
    await contentStandardApi.createAssessment(input);
    await contentStandardApi.reviewAssessment(9, "PASSED", "Barcha majburiy mezonlar tekshirildi");
    expect(api.post).toHaveBeenNthCalledWith(1, "/content-standard/assessments", input);
    expect(api.post).toHaveBeenNthCalledWith(2, "/content-standard/assessments/9/review", { decision: "PASSED", note: "Barcha majburiy mezonlar tekshirildi" });
  });
});
