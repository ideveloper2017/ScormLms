import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { distanceReadinessApi, distanceReadinessInputError, type SaveDistanceReadinessInput } from "@/services/api/distance-readiness-api";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

const input: SaveDistanceReadinessInput = {
  versionCode: "INFRA-2026-1", title: "Masofaviy infratuzilma readiness profili",
  internetProvider: "Provayder", internetCapacityMbps: 1000, internetEvidenceReference: "evidence://internet/1",
  computerFacilityAddress: "Toshkent shahri, 101-xona", sanitationDocumentNumber: "SAN-1", sanitationDocumentDate: "2026-08-06", sanitationEvidenceReference: "evidence://sanitation/1",
  technicalStaffCount: 3, technicalStaffQualificationReference: "evidence://staff/1",
  plannedDistanceStudents: 500, serverCapacityStudents: 750, serverOwnershipType: "LEASED", serverCountryCode: "UZ",
  serverLocationAddress: "Toshkent shahri data markazi", serverDocumentNumber: "LEASE-1", serverDocumentDate: "2026-08-06", serverEvidenceReference: "evidence://server/1",
  leaseStartDate: "2026-08-06", leaseEndDate: "2031-08-06", officialWebsiteUrl: "https://example.edu.uz/distance",
  websiteHasCharter: true, websiteHasCurricula: true, websiteHasStaffInformation: true, websiteHasAcademicCalendar: true,
  websiteReviewedAt: "2026-08-06T12:00:00Z",
};

describe("distance readiness API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates server capacity, Uzbekistan location and five year lease", () => {
    expect(distanceReadinessInputError(input)).toBeNull();
    expect(distanceReadinessInputError({ ...input, serverCapacityStudents: 499 })).toContain("quvvati");
    expect(distanceReadinessInputError({ ...input, serverCountryCode: "US" })).toContain("O'zbekiston");
    expect(distanceReadinessInputError({ ...input, leaseEndDate: "2031-08-05" })).toContain("5 yil");
  });

  it("requires a safe official website URL", () => {
    expect(distanceReadinessInputError({ ...input, officialWebsiteUrl: "http://example.edu.uz" })).toContain("HTTPS");
    expect(distanceReadinessInputError({ ...input, officialWebsiteUrl: "https://user:pass@example.edu.uz" })).toContain("HTTPS");
  });

  it("creates updates and independently reviews a profile", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 9 } } as never);
    vi.mocked(api.put).mockResolvedValue({ data: { id: 9 } } as never);
    await distanceReadinessApi.create(input);
    await distanceReadinessApi.update(9, input);
    await distanceReadinessApi.verify(9, "Barcha dalillar mustaqil tekshirildi");
    await distanceReadinessApi.reject(9, "Majburiy dalil yetarli emas");
    expect(api.post).toHaveBeenNthCalledWith(1, "/distance-readiness", input);
    expect(api.put).toHaveBeenCalledWith("/distance-readiness/9", input);
    expect(api.post).toHaveBeenNthCalledWith(2, "/distance-readiness/9/verify", { note: "Barcha dalillar mustaqil tekshirildi" });
    expect(api.post).toHaveBeenNthCalledWith(3, "/distance-readiness/9/reject", { note: "Majburiy dalil yetarli emas" });
  });

  it("lists and archives profiles", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] } as never);
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never);
    await distanceReadinessApi.list();
    await distanceReadinessApi.archive(9);
    expect(api.get).toHaveBeenCalledWith("/distance-readiness");
    expect(api.post).toHaveBeenCalledWith("/distance-readiness/9/archive");
  });
});

