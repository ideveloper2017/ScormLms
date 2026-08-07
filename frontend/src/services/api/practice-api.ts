import api from "@/lib/api";

export type PracticePlacementBasis = "CURRENT_WORKPLACE" | "PARTNER_ORGANIZATION";
export type StudentPracticeStatus = "DRAFT" | "APPROVED" | "COMPLETED" | "CANCELLED";

export interface StudentPractice {
  id: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  academicYear: string;
  planReference: string;
  startsOn: string;
  endsOn: string;
  placementBasis: PracticePlacementBasis;
  organizationName: string;
  organizationAddress: string;
  jobTitle?: string | null;
  specialtyMatchConfirmed: boolean;
  agreementNumber?: string | null;
  agreementDate?: string | null;
  basisEvidenceReference: string;
  ruleCompliant: boolean;
  status: StudentPracticeStatus;
  approvedAt?: string | null;
  approvedByName?: string | null;
  completionSummary?: string | null;
  completionEvidenceReference?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

export interface SaveStudentPracticeInput {
  studentId: number;
  academicYear: string;
  planReference: string;
  startsOn: string;
  endsOn: string;
  placementBasis: PracticePlacementBasis;
  organizationName: string;
  organizationAddress: string;
  jobTitle?: string;
  specialtyMatchConfirmed: boolean;
  agreementNumber?: string;
  agreementDate?: string;
  basisEvidenceReference: string;
}

export interface CompleteStudentPracticeInput {
  summary: string;
  evidenceReference: string;
}

export interface PracticeStudentOption {
  id: number;
  studentNumber: string;
  fullName: string;
  academicYear?: string | null;
}

export const practicePlacementInputValid = (input: SaveStudentPracticeInput) => {
  const common = input.studentId > 0 && /^\d{4}-\d{4}$/.test(input.academicYear) && !!input.planReference.trim()
    && !!input.startsOn && !!input.endsOn && input.endsOn >= input.startsOn
    && !!input.organizationName.trim() && !!input.organizationAddress.trim() && !!input.basisEvidenceReference.trim();
  if (!common) return false;
  return input.placementBasis === "CURRENT_WORKPLACE"
    ? input.specialtyMatchConfirmed && !!input.jobTitle?.trim()
    : !!input.agreementNumber?.trim() && !!input.agreementDate && input.agreementDate <= input.startsOn;
};

export const canApprovePractice = (practice: StudentPractice) => practice.status === "DRAFT" && practice.ruleCompliant;
export const canCompletePractice = (practice: StudentPractice, today = new Date()) =>
  practice.status === "APPROVED" && practice.endsOn <= today.toISOString().slice(0, 10);

export const practiceApi = {
  list: async () => (await api.get<StudentPractice[]>("/practices")).data,
  eligibleStudents: async () => (await api.get<PracticeStudentOption[]>("/practices/eligible-students")).data,
  mine: async () => (await api.get<StudentPractice[]>("/practices/mine")).data,
  create: async (input: SaveStudentPracticeInput) => (await api.post<StudentPractice>("/practices", input)).data,
  update: async (id: number, input: SaveStudentPracticeInput) => (await api.put<StudentPractice>(`/practices/${id}`, input)).data,
  approve: async (id: number) => (await api.post<StudentPractice>(`/practices/${id}/approve`)).data,
  complete: async (id: number, input: CompleteStudentPracticeInput) => (await api.post<StudentPractice>(`/practices/${id}/complete`, input)).data,
  cancel: async (id: number) => (await api.post<StudentPractice>(`/practices/${id}/cancel`)).data,
};
