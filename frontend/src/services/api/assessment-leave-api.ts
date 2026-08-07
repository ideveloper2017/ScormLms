import api from "@/lib/api";

export type AssessmentLeavePurpose = "SEMESTER_FINAL_ASSESSMENT" | "STATE_ATTESTATION" | "BACHELOR_THESIS_DEFENSE" | "MASTER_THESIS_DEFENSE";
export type AssessmentLeaveStatus = "DRAFT" | "VERIFIED" | "REJECTED";

export interface AssessmentLeaveEvidence {
  id: number; studentId: number; studentNumber: string; studentName: string; academicYear: string;
  leavePurpose: AssessmentLeavePurpose; assessmentReference: string; employerName: string; jobTitle: string;
  employmentDocumentReference: string; leaveOrderNumber: string; leaveOrderDate: string;
  leaveStartDate: string; leaveEndDate: string; calendarDays: number; salaryRetentionConfirmed: boolean;
  evidenceReference: string; status: AssessmentLeaveStatus; createdByName: string;
  verifiedAt?: string | null; verifiedByName?: string | null; verificationNote?: string | null;
  rejectedAt?: string | null; rejectedByName?: string | null; rejectionReason?: string | null;
}

export interface SaveAssessmentLeaveEvidenceInput {
  studentId: number; academicYear: string; leavePurpose: AssessmentLeavePurpose; assessmentReference: string;
  employerName: string; jobTitle: string; employmentDocumentReference: string; leaveOrderNumber: string;
  leaveOrderDate: string; leaveStartDate: string; leaveEndDate: string; salaryRetentionConfirmed: boolean;
  evidenceReference: string;
}

export interface AssessmentLeaveStudentOption { id: number; studentNumber: string; fullName: string; academicYear?: string | null }

export const assessmentLeaveDays = (start: string, end: string) => {
  if (!start || !end || end < start) return 0;
  return Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
};

export const assessmentLeaveInputError = (input: SaveAssessmentLeaveEvidenceInput): string | null => {
  const match = /^(\d{4})-(\d{4})$/.exec(input.academicYear);
  if (!input.studentId) return "Faol masofaviy talaba majburiy";
  if (!match || Number(match[2]) !== Number(match[1]) + 1) return "O'quv yili YYYY-YYYY ketma-ket formatida bo'lishi kerak";
  if (!input.assessmentReference.trim()) return "Yakuniy baholash yoki himoya rekviziti majburiy";
  if (!input.employerName.trim() || !input.jobTitle.trim() || !input.employmentDocumentReference.trim()) return "Ish beruvchi, lavozim va mehnat faoliyati dalili majburiy";
  if (!input.leaveOrderNumber.trim() || !input.leaveOrderDate || !input.leaveStartDate || !input.leaveEndDate) return "Ta'til buyrug'i va davr sanalari majburiy";
  if (input.leaveOrderDate > input.leaveStartDate) return "Ta'til buyrug'i boshlanish sanasidan kech bo'lmaydi";
  if (assessmentLeaveDays(input.leaveStartDate, input.leaveEndDate) < 15) return "22-band bo'yicha kamida 15 kalendar kun talab qilinadi";
  const from = `${match[1]}-09-01`; const to = `${match[2]}-08-31`;
  if (input.leaveStartDate < from || input.leaveEndDate > to) return "Ta'til davri o'quv yili doirasida bo'lishi kerak";
  if (!input.evidenceReference.trim()) return "Ta'til hujjati dalil rekviziti majburiy";
  return null;
};

export const assessmentLeaveApi = {
  list: async () => (await api.get<AssessmentLeaveEvidence[]>("/assessment-leaves")).data,
  mine: async () => (await api.get<AssessmentLeaveEvidence[]>("/assessment-leaves/mine")).data,
  eligibleStudents: async () => (await api.get<AssessmentLeaveStudentOption[]>("/assessment-leaves/eligible-students")).data,
  create: async (input: SaveAssessmentLeaveEvidenceInput) => (await api.post<AssessmentLeaveEvidence>("/assessment-leaves", input)).data,
  update: async (id: number, input: SaveAssessmentLeaveEvidenceInput) => (await api.put<AssessmentLeaveEvidence>(`/assessment-leaves/${id}`, input)).data,
  verify: async (id: number, verificationNote: string) => (await api.post<AssessmentLeaveEvidence>(`/assessment-leaves/${id}/verify`, { verificationNote })).data,
  reject: async (id: number, reason: string) => (await api.post<AssessmentLeaveEvidence>(`/assessment-leaves/${id}/reject`, { reason })).data,
};
