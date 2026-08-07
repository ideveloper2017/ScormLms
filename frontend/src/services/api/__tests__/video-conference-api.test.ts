import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { teacherPortalApi } from "@/services/api/teacher-portal-api";

vi.mock("@/lib/api", () => ({ default: { post: vi.fn(), delete: vi.fn() } }));

describe("video conference api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("provisions or retries the provider meeting through one idempotent backend endpoint", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 5, status: "READY" } } as never);
    await expect(teacherPortalApi.provisionVideoConference("17")).resolves.toMatchObject({ status: "READY" });
    expect(api.post).toHaveBeenCalledWith("/teachers/me/sessions/17/videoconference");
  });

  it("cancels through the backend without exposing provider token to the browser", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { id: 5, status: "CANCELLED" } } as never);
    await expect(teacherPortalApi.cancelVideoConference("17")).resolves.toMatchObject({ status: "CANCELLED" });
    expect(api.delete).toHaveBeenCalledWith("/teachers/me/sessions/17/videoconference");
  });
});
