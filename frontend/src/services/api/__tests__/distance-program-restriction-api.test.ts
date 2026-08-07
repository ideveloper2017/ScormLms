import { describe, expect, it } from "vitest";
import { distanceRestrictionInputError, type SaveDistanceProgramRestrictionCatalogInput } from "../distance-program-restriction-api";

const valid = (): SaveDistanceProgramRestrictionCatalogInput => ({
  catalogYear: new Date().getFullYear(), versionCode: "2026-1", authorityName: "Vakolatli vazirlik",
  documentNumber: "LIST-14", documentDate: "2026-03-20", publicationDate: "2026-04-01",
  documentReference: "OFFICIAL/REGISTER/14", scopeNote: "Rasmiy ro'yxatning to'liq qamrovi",
  entries: [{ programCode: "LAW-601", programName: "Huquqshunoslik", degreeLevel: "BACHELOR", reason: "Rasmiy ro'yxatga kiritilgan" }],
});

describe("distance program restriction validation", () => {
  it("accepts an official annual catalog", () => expect(distanceRestrictionInputError(valid())).toBeNull());
  it("allows an explicitly documented empty list", () => expect(distanceRestrictionInputError({ ...valid(), entries: [] })).toBeNull());
  it("rejects document date after publication", () => expect(distanceRestrictionInputError({ ...valid(), documentDate: "2026-04-02" })).toContain("keyin"));
  it("rejects duplicate code and degree", () => expect(distanceRestrictionInputError({ ...valid(), entries: [valid().entries[0], valid().entries[0]] })).toContain("takrorlanmasligi"));
});
