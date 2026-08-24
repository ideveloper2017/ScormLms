import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { createTutorGroup, deleteTutorGroup, getTutorGroupOptions, listTutorGroups, updateTutorGroup } from "../tutor-group-api";

vi.mock("@/lib/api");

describe("tutorGroupApi", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(api.get).mockResolvedValue({ data: [] }); vi.mocked(api.post).mockResolvedValue({ data: {} }); vi.mocked(api.put).mockResolvedValue({ data: {} }); vi.mocked(api.delete).mockResolvedValue({ data: undefined }); });
  it("tutor guruhining CRUD va option endpointlarini ishlatadi", async () => {
    const body = { name: "1-kurs tutor guruhi", code: "TG-01", facultyId: 2, tutorId: 4, nameUz: "1-kurs", nameRu: "1 курс", nameEn: "Year 1", active: true };
    await listTutorGroups(); await getTutorGroupOptions(); await createTutorGroup(body); await updateTutorGroup(9, body); await deleteTutorGroup(9);
    expect(api.get).toHaveBeenCalledWith("/tutor-groups");
    expect(api.get).toHaveBeenCalledWith("/tutor-groups/options");
    expect(api.post).toHaveBeenCalledWith("/tutor-groups", body);
    expect(api.put).toHaveBeenCalledWith("/tutor-groups/9", body);
    expect(api.delete).toHaveBeenCalledWith("/tutor-groups/9");
  });
});
