import api from "@/lib/api";

export type ChecklistStatus = "DRAFT" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export type AssessmentStatus = "DRAFT" | "PASSED" | "FAILED";
export type AssessmentDecision = "PASSED" | "FAILED";

export interface SaveCriterionInput {
  criterionCode: string;
  title: string;
  description: string;
  required: boolean;
  evidenceHint?: string | null;
  position: number;
}

export interface SaveChecklistInput {
  standardCode: "O'ZDST 36.2030";
  versionCode: string;
  title: string;
  issuingAuthority: string;
  sourceDocumentNumber: string;
  sourceDocumentDate: string;
  sourceReference: string;
  validFrom: string;
  validUntil?: string | null;
  criteria: SaveCriterionInput[];
}

export interface StandardCriterion extends SaveCriterionInput { id: number }
export interface StandardChecklist extends Omit<SaveChecklistInput, "criteria"> {
  id: number;
  status: ChecklistStatus;
  currentlyEffective: boolean;
  criteria: StandardCriterion[];
  createdByName: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  reviewNote?: string | null;
  archivedAt?: string | null;
}

export interface RevisionCandidate {
  contentRevisionId: number;
  contentId: number;
  revisionNumber: number;
  contentVersion: string;
  contentTitle: string;
  moduleTitle: string;
  courseTitle: string;
  checklistId?: number | null;
  assessmentExists: boolean;
}

export interface SaveAssessmentResponseInput {
  criterionId: number;
  met: boolean;
  evidenceReference?: string | null;
  note?: string | null;
}

export interface SaveAssessmentInput {
  contentRevisionId: number;
  checklistId: number;
  responses: SaveAssessmentResponseInput[];
}

export interface AssessmentResponse {
  criterionId: number;
  criterionCode: string;
  criterionTitle: string;
  required: boolean;
  met: boolean;
  evidenceReference?: string | null;
  note?: string | null;
}

export interface StandardAssessment {
  id: number;
  checklistId: number;
  checklistVersion: string;
  contentRevisionId: number;
  contentId: number;
  revisionNumber: number;
  contentVersion: string;
  contentTitle: string;
  courseTitle: string;
  status: AssessmentStatus;
  responses: AssessmentResponse[];
  createdByName: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  reviewNote?: string | null;
}

export const checklistInputError = (input: SaveChecklistInput): string | null => {
  if (input.standardCode !== "O'ZDST 36.2030") return "Faqat O'zDSt 36.2030 checklisti qabul qilinadi";
  if (!input.versionCode.trim() || input.versionCode.length > 100) return "Versiya kodi majburiy";
  if (input.title.trim().length < 5 || input.title.length > 500) return "Checklist nomi 5..500 belgidan iborat bo'lishi kerak";
  if (input.issuingAuthority.trim().length < 3 || !input.sourceDocumentNumber.trim() || input.sourceReference.trim().length < 5) return "Rasmiy manba rekvizitlari to'liq kiritilishi kerak";
  if (!input.sourceDocumentDate || !input.validFrom) return "Manba va amal boshlanish sanalari majburiy";
  if (input.validUntil && input.validUntil < input.validFrom) return "Amal tugash sanasi boshlanishidan oldin bo'lmasligi kerak";
  if (!input.criteria.length || input.criteria.length > 500) return "Rasmiy checklistda 1..500 mezon bo'lishi kerak";
  const codes = input.criteria.map((item) => item.criterionCode.trim().toUpperCase());
  const positions = input.criteria.map((item) => item.position);
  if (new Set(codes).size !== codes.length || new Set(positions).size !== positions.length) return "Mezon kodi va tartib raqami takrorlanmasligi kerak";
  if (input.criteria.some((item) => !item.criterionCode.trim() || item.title.trim().length < 5 || item.description.trim().length < 10 || item.position < 1 || item.position > 500)) return "Har bir mezon kodi, nomi, tavsifi va tartibi to'g'ri kiritilishi kerak";
  return null;
};

export const assessmentInputError = (input: SaveAssessmentInput, criteria: StandardCriterion[]): string | null => {
  if (!input.contentRevisionId || !input.checklistId) return "Checklist va kontent revisionini tanlang";
  if (input.responses.length !== criteria.length || new Set(input.responses.map((item) => item.criterionId)).size !== criteria.length) return "Har bir mezonga aynan bitta javob kiriting";
  for (const response of input.responses) {
    if (response.met && (response.evidenceReference?.trim().length ?? 0) < 5) return "Bajarilgan mezon uchun kamida 5 belgili dalil kiriting";
    if (!response.met && (response.note?.trim().length ?? 0) < 10) return "Bajarilmagan mezon uchun kamida 10 belgili izoh kiriting";
  }
  return null;
};

export const contentStandardApi = {
  listChecklists: async () => (await api.get<StandardChecklist[]>("/content-standard/checklists")).data,
  currentChecklist: async () => (await api.get<StandardChecklist | null>("/content-standard/checklists/current")).data,
  createChecklist: async (input: SaveChecklistInput) => (await api.post<StandardChecklist>("/content-standard/checklists", input)).data,
  updateChecklist: async (id: number, input: SaveChecklistInput) => (await api.put<StandardChecklist>(`/content-standard/checklists/${id}`, input)).data,
  publishChecklist: async (id: number, note: string) => (await api.post<StandardChecklist>(`/content-standard/checklists/${id}/publish`, { note })).data,
  rejectChecklist: async (id: number, note: string) => (await api.post<StandardChecklist>(`/content-standard/checklists/${id}/reject`, { note })).data,
  archiveChecklist: async (id: number) => (await api.post<StandardChecklist>(`/content-standard/checklists/${id}/archive`)).data,
  revisions: async () => (await api.get<RevisionCandidate[]>("/content-standard/revisions")).data,
  assessments: async () => (await api.get<StandardAssessment[]>("/content-standard/assessments")).data,
  createAssessment: async (input: SaveAssessmentInput) => (await api.post<StandardAssessment>("/content-standard/assessments", input)).data,
  reviewAssessment: async (id: number, decision: AssessmentDecision, note: string) => (await api.post<StandardAssessment>(`/content-standard/assessments/${id}/review`, { decision, note })).data,
};
