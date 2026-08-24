import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { listTeachers } from "../teacher-api";

vi.mock("@/lib/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe("teacher API normalization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes a missing subjects field to an empty array", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ id: 1, fullName: "Ali Valiyev", active: true }],
    } as never);

    await expect(listTeachers()).resolves.toEqual([
      { id: 1, fullName: "Ali Valiyev", active: true, subjects: [] },
    ]);
  });

  it("keeps subjects returned by the backend", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: [{ id: 2, fullName: "Vali Aliyev", active: true, subjects: [{ id: 7, name: "Matematika" }] }],
    } as never);

    const teachers = await listTeachers();
    expect(teachers[0].subjects).toEqual([{ id: 7, name: "Matematika" }]);
  });
});
