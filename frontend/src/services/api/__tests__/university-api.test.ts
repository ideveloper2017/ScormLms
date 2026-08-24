import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { createUniversity, deleteUniversity, listUniversities, updateUniversity, type SaveUniversityRequest } from "../university-api";

vi.mock("@/lib/api");

const request: SaveUniversityRequest = {
  name: "Namangan Davlat Texnika Universiteti",
  rector: "Muhammadjon Dadamirzayev",
  address: "Namangan shahar",
  defaultLanguage: "UZ_LATIN",
  phone: "+998901234567",
  bankDetails: "Hisob raqami 202080001",
  chiefAccountant: "Bosh Hisobchi",
  legalCounsel: "Bosh Yurist",
  active: true,
};

describe("universityApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("universitet reyestrini yuklaydi", async () => {
    const records = [{ id: 1, ...request }];
    vi.mocked(api.get).mockResolvedValue({ data: records });

    await expect(listUniversities()).resolves.toEqual(records);
    expect(api.get).toHaveBeenCalledWith("/universities");
  });

  it("universitetni yaratadi va yangilaydi", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1, ...request } });
    vi.mocked(api.put).mockResolvedValue({ data: { id: 1, ...request, active: false } });

    await createUniversity(request);
    await updateUniversity(1, { ...request, active: false });

    expect(api.post).toHaveBeenCalledWith("/universities", request);
    expect(api.put).toHaveBeenCalledWith("/universities/1", { ...request, active: false });
  });

  it("universitetni o'chiradi", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await deleteUniversity(4);

    expect(api.delete).toHaveBeenCalledWith("/universities/4");
  });
});
