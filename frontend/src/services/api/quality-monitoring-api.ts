import api from "@/lib/api";

export type QualityMonitoringMethod = "FOCUS_GROUP" | "INTERVIEW" | "OBSERVATION" | "DOCUMENT_ANALYSIS";
export type QualityMonitoringStatus = "DRAFT" | "COMPLETED" | "APPROVED" | "CANCELLED";

export interface QualityMonitoringStudy {
  id: number;
  method: QualityMonitoringMethod;
  title: string;
  objective: string;
  academicYear: string;
  startsAt: string;
  endsAt: string;
  locationDescription: string;
  populationScope: string;
  relatedSurveyId?: number | null;
  facilitatorUserId: number;
  facilitatorName: string;
  status: QualityMonitoringStatus;
  participantCount?: number | null;
  summary?: string | null;
  findings?: string | null;
  recommendations?: string | null;
  evidenceReference?: string | null;
  participantIdentitiesStored: false;
  completedAt?: string | null;
  approvedAt?: string | null;
  approvedByName?: string | null;
  cancelledAt?: string | null;
}

export interface QualityMonitoringStudyInput {
  method: QualityMonitoringMethod;
  title: string;
  objective: string;
  academicYear: string;
  startsAt: string;
  endsAt: string;
  locationDescription: string;
  populationScope: string;
  relatedSurveyId?: number;
}

export interface CompleteQualityMonitoringStudyInput {
  participantCount: number;
  summary: string;
  findings: string;
  recommendations: string;
  evidenceReference: string;
}

export const qualityMonitoringParticipantRange = (method: QualityMonitoringMethod): [number, number] => {
  if (method === "FOCUS_GROUP") return [3, 50];
  if (method === "INTERVIEW") return [1, 100];
  return [0, 1000];
};

export const canCompleteQualityMonitoringStudy = (study: QualityMonitoringStudy, now = new Date()) =>
  study.status === "DRAFT" && new Date(study.startsAt).getTime() <= now.getTime();

export const qualityMonitoringApi = {
  list: async () => (await api.get<QualityMonitoringStudy[]>("/quality-monitoring/studies")).data,
  get: async (id: number) => (await api.get<QualityMonitoringStudy>(`/quality-monitoring/studies/${id}`)).data,
  create: async (input: QualityMonitoringStudyInput) => (await api.post<QualityMonitoringStudy>("/quality-monitoring/studies", input)).data,
  update: async (id: number, input: QualityMonitoringStudyInput) => (await api.put<QualityMonitoringStudy>(`/quality-monitoring/studies/${id}`, input)).data,
  complete: async (id: number, input: CompleteQualityMonitoringStudyInput) => (await api.post<QualityMonitoringStudy>(`/quality-monitoring/studies/${id}/complete`, input)).data,
  approve: async (id: number) => (await api.post<QualityMonitoringStudy>(`/quality-monitoring/studies/${id}/approve`)).data,
  cancel: async (id: number) => (await api.post<QualityMonitoringStudy>(`/quality-monitoring/studies/${id}/cancel`)).data,
};

