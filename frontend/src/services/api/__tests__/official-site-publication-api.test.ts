import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { officialSitePublicationApi, officialSitePublicationInputError, type SaveOfficialSitePublicationInput } from "@/services/api/official-site-publication-api";

vi.mock("@/lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  API_BASE_URL: "http://localhost:8080/api/v1",
}));

const input: SaveOfficialSitePublicationInput = {
  category: "CHARTER_OR_STATUTE", slug: "institution-charter", versionCode: "1.0",
  title: "Tashkilot ustavi", summary: "Ommaga taqdim etiladigan rasmiy va tekshirilgan tashkilot ustavi haqida ma'lumot.",
  sourceDocumentNumber: "USTAV-1", sourceDocumentDate: "2026-08-06", sourceReference: "evidence://charter/1",
  effectiveFrom: "2026-08-06", effectiveTo: null,
};

describe("official site publication api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("validates slug content and effective range", () => {
    expect(officialSitePublicationInputError(input)).toBeNull();
    expect(officialSitePublicationInputError({ ...input, slug: "Bad Slug" })).toContain("Slug");
    expect(officialSitePublicationInputError({ ...input, summary: "short" })).toContain("Ommaviy");
    expect(officialSitePublicationInputError({ ...input, effectiveTo: "2026-08-05" })).toContain("oldin");
  });

  it("uses authenticated lifecycle endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 4 } } as never);
    vi.mocked(api.put).mockResolvedValue({ data: { id: 4 } } as never);
    await officialSitePublicationApi.create(input);
    await officialSitePublicationApi.update(4, input);
    await officialSitePublicationApi.publish(4, "Mustaqil tekshirildi");
    await officialSitePublicationApi.reject(4, "Dalil yetarli emas");
    await officialSitePublicationApi.archive(4);
    expect(api.post).toHaveBeenNthCalledWith(1, "/official-site-publications", input);
    expect(api.put).toHaveBeenCalledWith("/official-site-publications/4", input);
    expect(api.post).toHaveBeenNthCalledWith(2, "/official-site-publications/4/publish", { note: "Mustaqil tekshirildi" });
    expect(api.post).toHaveBeenNthCalledWith(3, "/official-site-publications/4/reject", { note: "Dalil yetarli emas" });
    expect(api.post).toHaveBeenNthCalledWith(4, "/official-site-publications/4/archive");
  });

  it("loads anonymous public disclosure without auth api client", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ complete: true, publications: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    await expect(officialSitePublicationApi.publicDisclosure()).resolves.toMatchObject({ complete: true });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/public/api/institution-disclosures", { headers: { Accept: "application/json" } });
    expect(api.get).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

