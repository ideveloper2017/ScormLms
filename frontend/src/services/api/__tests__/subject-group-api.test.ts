import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { subjectGroupApi } from "../subject-group-api";

vi.mock("@/lib/api");

describe("subjectGroupApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads subject groups by approved curriculum", async () => {
    const groups = [{ id: 7, code: "DAST-A", curriculumId: 3 }];
    vi.mocked(api.get).mockResolvedValue({ data: groups });
    await expect(subjectGroupApi.list({ curriculumId: 3, semester: 1 })).resolves.toEqual(groups);
    expect(api.get).toHaveBeenCalledWith("/subject-groups", { params: { curriculumId: 3, semester: 1 } });
  });

  it("assigns students separately from group creation", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 7, memberCount: 2 } });
    await subjectGroupApi.assign(7, [41, 42]);
    expect(api.post).toHaveBeenCalledWith("/subject-groups/7/students", { studentIds: [41, 42] });
  });

  it("removes only the selected subject-group membership", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { id: 7, memberCount: 1 } });
    await subjectGroupApi.removeStudent(7, 41);
    expect(api.delete).toHaveBeenCalledWith("/subject-groups/7/students/41");
  });

  it("loads only the current teacher teaching options", async () => {
    const groups = [{ id: 7, code: "DAST-A", subjectName: "Dasturlash" }];
    vi.mocked(api.get).mockResolvedValue({ data: groups });
    await expect(subjectGroupApi.teachingOptions()).resolves.toEqual(groups);
    expect(api.get).toHaveBeenCalledWith("/subject-groups/teaching-options");
  });

  it("assigns and removes a teacher in the operational subject group", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 7 } });
    vi.mocked(api.delete).mockResolvedValue({ data: { id: 7 } });

    await subjectGroupApi.assignTeacher(7, 15);
    await subjectGroupApi.removeTeacher(7, 15);

    expect(api.post).toHaveBeenCalledWith("/subject-groups/7/teachers", { teacherId: 15 });
    expect(api.delete).toHaveBeenCalledWith("/subject-groups/7/teachers/15");
  });
});
