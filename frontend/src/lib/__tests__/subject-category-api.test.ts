import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import {
  createSubjectCategory,
  listSubjectCategories,
  listSubjects,
  updateSubject,
} from "../academic-api";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

describe("subject category academic API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads the fan guruhlari catalog", async () => {
    const categories = [{ id: 1, name: "Oliy matematika", code: "MATH", active: true }];
    vi.mocked(api.get).mockResolvedValueOnce({ data: categories } as never);

    await expect(listSubjectCategories()).resolves.toEqual(categories);
    expect(api.get).toHaveBeenCalledWith("/subject-categories");
  });

  it("creates a fan guruhi independently from an operational teaching flow", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 1 } } as never);

    await createSubjectCategory({ name: "Fizika", code: "PHYS" });
    expect(api.post).toHaveBeenCalledWith("/subject-categories", { name: "Fizika", code: "PHYS" });
  });

  it("filters subjects by program and fan guruhi", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [] } as never);

    await listSubjects(4, 2);
    expect(api.get).toHaveBeenCalledWith("/subjects", { params: { programId: 4, subjectCategoryId: 2 } });
  });

  it("can explicitly remove a fan from its fan guruhi", async () => {
    vi.mocked(api.put).mockResolvedValueOnce({ data: { id: 8 } } as never);

    await updateSubject(8, { subjectCategoryId: null, clearSubjectCategory: true });
    expect(api.put).toHaveBeenCalledWith("/subjects/8", { subjectCategoryId: null, clearSubjectCategory: true });
  });
});
