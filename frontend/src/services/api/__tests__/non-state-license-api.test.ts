import { describe, expect, it } from "vitest";
import { nonStateLicenseInputError, type SaveNonStateLicenseInput } from "../non-state-license-api";

const valid = (): SaveNonStateLicenseInput => ({
  institutionName: "Nodavlat universitet", licenseNumber: "L-16", issuingAuthority: "Vakolatli organ",
  issueDate: "2026-01-01", validFrom: "2026-01-02", validUntil: "2027-01-01",
  officialRegistryReference: "registry.gov.uz/L-16",
});

describe("nonStateLicenseInputError", () => {
  it("accepts complete official registry data", () => expect(nonStateLicenseInputError(valid())).toBeNull());
  it("rejects invalid validity interval", () => expect(nonStateLicenseInputError({ ...valid(), validUntil: "2025-12-31" })).toContain("tugash"));
  it("requires official registry evidence", () => expect(nonStateLicenseInputError({ ...valid(), officialRegistryReference: "" })).toContain("reestri"));
});
