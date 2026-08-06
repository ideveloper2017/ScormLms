import api, { type ApiResponse } from "@/lib/api";

export type SurveyAudience = "STUDENT" | "TEACHER" | "BOTH";
export type SurveyStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type SurveyQuestionType = "RATING" | "SINGLE_CHOICE";

export interface SurveyQuestion {
  id: number;
  prompt: string;
  questionType: SurveyQuestionType;
  options: string[];
  required: boolean;
  position: number;
}

export interface Survey {
  id: number;
  title: string;
  description: string;
  audience: SurveyAudience;
  status: SurveyStatus;
  startsAt: string;
  endsAt: string;
  minAggregateSize: number;
  questions: SurveyQuestion[];
  submitted?: boolean | null;
  responseCount?: number | null;
}

export interface CreateSurveyInput {
  title: string;
  description: string;
  audience: SurveyAudience;
  startsAt: string;
  endsAt: string;
  minAggregateSize: number;
  questions: Array<{ prompt: string; questionType: SurveyQuestionType; options: string[]; required: boolean }>;
}

export interface SurveyAnswerInput { questionId: number; ratingValue?: number; optionValue?: string }
export interface SurveySubmission { surveyId: number; submittedAt: string; accepted: boolean }
export interface SurveyOptionAggregate { option: string; count: number; percentage: number }
export interface SurveyQuestionAggregate { questionId: number; prompt: string; questionType: SurveyQuestionType; answerCount: number; averageRating?: number | null; ratingDistribution: Record<string, number>; options: SurveyOptionAggregate[] }
export interface SurveyResults { surveyId: number; title: string; responseCount: number; minAggregateSize: number; suppressed: boolean; questions: SurveyQuestionAggregate[] }

function unwrap<T>(response: ApiResponse<T>, fallback: string): T {
  if (!response.success || response.data == null) throw new Error(response.message ?? fallback);
  return response.data;
}

export async function listAvailableSurveys(): Promise<Survey[]> {
  const response = await api.get<ApiResponse<Survey[]>>("/surveys");
  return unwrap(response.data, "So'rovlarni yuklab bo'lmadi");
}

export async function submitSurvey(id: number, answers: SurveyAnswerInput[]): Promise<SurveySubmission> {
  const response = await api.post<ApiResponse<SurveySubmission>>(`/surveys/${id}/responses`, { answers });
  return unwrap(response.data, "Javoblarni yuborib bo'lmadi");
}

export async function listAdminSurveys(): Promise<Survey[]> {
  const response = await api.get<ApiResponse<Survey[]>>("/admin/surveys");
  return unwrap(response.data, "So'rovlarni yuklab bo'lmadi");
}

export async function createSurvey(input: CreateSurveyInput): Promise<Survey> {
  const response = await api.post<ApiResponse<Survey>>("/admin/surveys", input);
  return unwrap(response.data, "So'rovni yaratib bo'lmadi");
}

export async function publishSurvey(id: number): Promise<Survey> {
  const response = await api.post<ApiResponse<Survey>>(`/admin/surveys/${id}/publish`);
  return unwrap(response.data, "So'rovni e'lon qilib bo'lmadi");
}

export async function closeSurvey(id: number): Promise<Survey> {
  const response = await api.post<ApiResponse<Survey>>(`/admin/surveys/${id}/close`);
  return unwrap(response.data, "So'rovni yopib bo'lmadi");
}

export async function getSurveyResults(id: number): Promise<SurveyResults> {
  const response = await api.get<ApiResponse<SurveyResults>>(`/admin/surveys/${id}/results`);
  return unwrap(response.data, "Natijalarni yuklab bo'lmadi");
}
