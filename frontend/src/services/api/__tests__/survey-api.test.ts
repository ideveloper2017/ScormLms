import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { closeSurvey, createSurvey, getSurveyResults, listAdminSurveys, listAvailableSurveys, publishSurvey, submitSurvey } from "../survey-api";

vi.mock("@/lib/api");

describe("survey api", () => {
  beforeEach(() => vi.clearAllMocks());

  it("participant faqat anonim javob payloadini yuboradi", async () => {
    const submission = { surveyId: 4, submittedAt: "2026-08-06T00:00:00Z", accepted: true };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [] } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: submission } });
    await expect(listAvailableSurveys()).resolves.toEqual([]);
    await expect(submitSurvey(4, [{ questionId: 8, ratingValue: 5 }])).resolves.toEqual(submission);
    expect(api.post).toHaveBeenCalledWith("/surveys/4/responses", { answers: [{ questionId: 8, ratingValue: 5 }] });
  });

  it("admin lifecycle va agregat endpointlardan foydalanadi", async () => {
    const survey = { id: 3, title: "Sifat", status: "DRAFT" };
    const results = { surveyId: 3, responseCount: 5, suppressed: false, questions: [] };
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { success: true, data: [survey] } })
      .mockResolvedValueOnce({ data: { success: true, data: results } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: survey } });
    await listAdminSurveys();
    await createSurvey({ title: "Sifat", description: "", audience: "BOTH", startsAt: "2026-08-06T00:00:00Z", endsAt: "2026-08-07T00:00:00Z", minAggregateSize: 5, questions: [{ prompt: "Baho", questionType: "RATING", options: [], required: true }] });
    await publishSurvey(3);
    await closeSurvey(3);
    await expect(getSurveyResults(3)).resolves.toEqual(results);
    expect(api.post).toHaveBeenCalledWith("/admin/surveys/3/publish");
    expect(api.post).toHaveBeenCalledWith("/admin/surveys/3/close");
  });
});
