import api from "@/lib/api";

export type CurriculumCredentialType = "STATE_DIPLOMA" | "NON_STATE_CREDENTIAL";
export type CurriculumNormativeBasisType = "STATE_EDUCATION_STANDARD" | "PROFESSIONAL_STANDARD";
export type CurriculumPlanItemType = "REQUIRED" | "ELECTIVE";
export type CurriculumStatus = "DRAFT" | "APPROVED" | "ARCHIVED";
export type CurriculumStudentStatus = "ACTIVE" | "SUSPENDED" | "EXPELLED" | "GRADUATED";

export interface CurriculumSubject {
  id: number;
  subjectId?: number | null;
  subjectCode: string;
  subjectName: string;
  credits: number;
  semester: number;
  planItemType: CurriculumPlanItemType;
}

export interface CurriculumVersion {
  id: number;
  programId: number;
  programName: string;
  versionCode: string;
  academicYear: string;
  credentialType: CurriculumCredentialType;
  normativeBasisType: CurriculumNormativeBasisType;
  standardReference: string;
  qualificationRequirementsReference: string;
  validFrom: string;
  validUntil: string;
  status: CurriculumStatus;
  subjects: CurriculumSubject[];
  subjectCount: number;
  totalCredits: number;
  approvalOrderNumber?: string | null;
  approvalOrderDate?: string | null;
  approvedAt?: string | null;
  approvedByName?: string | null;
  archivedAt?: string | null;
}

export interface CurriculumStudent {
  studentId: number;
  studentNumber: string;
  fullName: string;
  status: CurriculumStudentStatus;
  groupId?: number | null;
  groupName?: string | null;
  courseNumber: number;
  semesterNumber?: number | null;
  educationForm: "FULL_TIME" | "PART_TIME" | "EVENING" | "DISTANCE";
  educationLanguage: string;
}

export interface CurriculumStudentPage {
  items: CurriculumStudent[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CurriculumStudentQuery {
  search?: string;
  status?: CurriculumStudentStatus;
  page?: number;
  size?: number;
}

export interface SaveCurriculumVersionInput {
  programId: number;
  versionCode: string;
  academicYear: string;
  credentialType: CurriculumCredentialType;
  normativeBasisType: CurriculumNormativeBasisType;
  standardReference: string;
  qualificationRequirementsReference: string;
  validFrom: string;
  validUntil: string;
}

export interface AddCurriculumSubjectInput {
  subjectId: number;
  semester: number;
  planItemType: CurriculumPlanItemType;
}

export interface ApproveCurriculumInput {
  approvalOrderNumber: string;
  approvalOrderDate: string;
}

export const curriculumInputError = (input: SaveCurriculumVersionInput): string | null => {
  const yearMatch = /^(\d{4})-(\d{4})$/.exec(input.academicYear);
  if (!input.programId || !input.versionCode.trim()) return "Dastur va versiya kodi majburiy";
  if (!yearMatch || Number(yearMatch[2]) !== Number(yearMatch[1]) + 1) return "O'quv yili YYYY-YYYY ketma-ket formatida bo'lishi kerak";
  const academicFrom = `${yearMatch[1]}-09-01`;
  const academicUntil = `${yearMatch[2]}-08-31`;
  if (!input.validFrom || !input.validUntil || input.validFrom > academicFrom || input.validUntil < academicUntil) return "Amal qilish davri butun o'quv yilini qoplashi kerak";
  if (!input.standardReference.trim() || !input.qualificationRequirementsReference.trim()) return "Standart va malaka talablari rekviziti majburiy";
  if (input.credentialType === "STATE_DIPLOMA" && input.normativeBasisType !== "STATE_EDUCATION_STANDARD") return "Davlat diplomi davlat ta'lim standartiga asoslanadi";
  if (input.credentialType === "NON_STATE_CREDENTIAL" && input.normativeBasisType !== "PROFESSIONAL_STANDARD") return "Nodavlat hujjat kasbiy standartga asoslanadi";
  return null;
};

export const canApproveCurriculum = (version: CurriculumVersion) => version.status === "DRAFT" && version.subjectCount > 0;

export const curriculumApi = {
  list: async () => (await api.get<CurriculumVersion[]>("/curricula")).data,
  get: async (id: number) => (await api.get<CurriculumVersion>(`/curricula/${id}`)).data,
  listStudents: async (id: number, query: CurriculumStudentQuery = {}) => (
    await api.get<CurriculumStudentPage>(`/curricula/${id}/students`, { params: query })
  ).data,
  create: async (input: SaveCurriculumVersionInput) => (await api.post<CurriculumVersion>("/curricula", input)).data,
  update: async (id: number, input: SaveCurriculumVersionInput) => (await api.put<CurriculumVersion>(`/curricula/${id}`, input)).data,
  addSubject: async (id: number, input: AddCurriculumSubjectInput) => (await api.post<CurriculumVersion>(`/curricula/${id}/subjects`, input)).data,
  removeSubject: async (id: number, itemId: number) => (await api.delete<CurriculumVersion>(`/curricula/${id}/subjects/${itemId}`)).data,
  approve: async (id: number, input: ApproveCurriculumInput) => (await api.post<CurriculumVersion>(`/curricula/${id}/approve`, input)).data,
  archive: async (id: number) => (await api.post<CurriculumVersion>(`/curricula/${id}/archive`)).data,
};
