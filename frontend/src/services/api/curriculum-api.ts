import api from "@/lib/api";

export type CurriculumCredentialType = "STATE_DIPLOMA" | "NON_STATE_CREDENTIAL";
export type CurriculumNormativeBasisType = "STATE_EDUCATION_STANDARD" | "PROFESSIONAL_STANDARD";
export type CurriculumPlanItemType = "REQUIRED" | "ELECTIVE";
export type CurriculumStatus = "DRAFT" | "APPROVED" | "ARCHIVED";
export type CurriculumStudentStatus = "ACTIVE" | "SUSPENDED" | "EXPELLED" | "GRADUATED";
export type CurriculumEducationForm = "FULL_TIME" | "PART_TIME" | "EVENING" | "DISTANCE";
/** Ishchi o'quv rejadagi "Kurs ishi (loyihasi)" ustuni: KI — kurs ishi, KL — kurs loyihasi */
export type CurriculumCourseWorkType = "COURSE_WORK" | "COURSE_PROJECT";
export const courseWorkLabels: Record<CurriculumCourseWorkType, string> = { COURSE_WORK: "Kurs ishi", COURSE_PROJECT: "Kurs loyihasi" };

/** Rejadagi fan bo'lmagan qismlar: malakaviy amaliyot va yakuniy davlat attestatsiyasi */
export type CurriculumComponentType = "PRACTICE" | "STATE_ATTESTATION";
export const componentLabels: Record<CurriculumComponentType, string> = {
  PRACTICE: "Malakaviy amaliyot", STATE_ATTESTATION: "Yakuniy davlat attestatsiyasi",
};
export interface CurriculumComponent {
  id: number;
  type: CurriculumComponentType;
  name: string;
  semester: number;
  credits: number;
  hours: number;
  weeks?: number | null;
}
export interface SaveCurriculumComponentInput {
  type: CurriculumComponentType;
  name?: string | null;
  semester: number;
  credits: number;
  hours: number;
  weeks?: number | null;
}
/** "I. O'quv jarayoni jadvali": kurs haftalari kodlari (FT, A, T, M, B, G; "" — nazariy ta'lim) */
export interface CurriculumScheduleRow {
  course: number;
  weeks: string[];
}

export interface CurriculumSubject {
  id: number;
  subjectId?: number | null;
  subjectCode: string;
  subjectName: string;
  credits: number;
  semester: number;
  planItemType: CurriculumPlanItemType;
  /** Ishchi o'quv rejadagi T/r (masalan "1.09") */
  planRowNumber?: string | null;
  lectureHours?: number;
  practicalHours?: number;
  laboratoryHours?: number;
  seminarHours?: number;
  courseWorkHours?: number;
  courseWorkType?: CurriculumCourseWorkType | null;
  /** Auditoriya jami (masofaviy shaklda turlarga bo'linmagan bo'lishi mumkin) */
  auditoryHours?: number;
  selfStudyHours?: number;
  /** Umumiy yuklama = auditoriya + mustaqil ta'lim (1 kredit = 30 soat) */
  totalHours?: number;
  /** Biriktirilgan o'quv dasturi (ko'p semestrli fanning barcha qatorlarida bir xil) */
  syllabusId?: number | null;
  syllabusName?: string | null;
  syllabusLanguage?: string | null;
  syllabusStatus?: "DRAFT" | "IN_REVIEW" | "APPROVED" | null;
  syllabusTopicCount?: number;
  /** Rejada soati bor har bir mashg'ulot turiga (har bir semestr qismida) mavzu kiritilganmi */
  syllabusComplete?: boolean | null;
}

export interface CreateCurriculumSyllabusInput {
  language: "UZ" | "EN" | "RU" | "KAA" | "UZ_CYRILLIC";
  shortDescription: string;
  requirements?: string | null;
  fullDescription: string;
}

/** Reja fanining shu semestrdagi soatlari; auditory faqat turlar kiritilmaganda hisobga olinadi */
export interface CurriculumSubjectHours {
  lecture: number;
  practical: number;
  laboratory: number;
  seminar: number;
  courseWork: number;
  auditory?: number | null;
  selfStudy: number;
}

export interface UpdateCurriculumSubjectInput {
  credits: number;
  planItemType: CurriculumPlanItemType;
  planRowNumber?: string | null;
  hours: CurriculumSubjectHours;
  courseWorkType?: CurriculumCourseWorkType | null;
}

export type CurriculumImportAction = "USE_EXISTING" | "CREATE" | "SKIP";

export interface CurriculumImportRow {
  rowNumber: string;
  code: string;
  name: string;
  planItemType: CurriculumPlanItemType;
  alternative: boolean;
  totalHours: number;
  auditoryHours: number;
  lectureHours: number;
  practicalHours: number;
  laboratoryHours: number;
  seminarHours: number;
  courseWorkHours: number;
  selfStudyHours: number;
  semesterCredits: { semester: number; credits: number }[];
  action: CurriculumImportAction;
  subjectId?: number | null;
  subjectCode?: string | null;
  subjectName?: string | null;
  createCode?: string | null;
  issues: string[];
  courseWorkType?: CurriculumCourseWorkType | null;
}

/** Fayl sarlavhasi: yo'nalish, akademik daraja, ta'lim shakli, o'qish muddati, kvalifikatsiya */
export interface CurriculumImportHeader {
  programCode?: string | null;
  programName?: string | null;
  degree?: string | null;
  educationForm?: CurriculumEducationForm | null;
  educationFormText?: string | null;
  durationYears?: number | null;
  qualification?: string | null;
}

/** Fayldagi malakaviy amaliyot / YaDA (semestr berilmasa — rejaning oxirgi semestri) */
export interface CurriculumImportComponent {
  type: CurriculumComponentType;
  name: string;
  semester?: number | null;
  credits: number;
  hours: number;
  weeks?: number | null;
}

export interface CurriculumImportPreview {
  sheets: { name: string; rowCount: number }[];
  sheet?: string | null;
  rows: CurriculumImportRow[];
  header?: CurriculumImportHeader | null;
  /** Fayl sarlavhasi rejaga mos kelmasa (yo'nalish, ta'lim shakli, o'qish muddati) */
  warnings?: string[];
  components?: CurriculumImportComponent[];
  schedule?: CurriculumScheduleRow[];
}

/** Yangi reja formasini fayldan to'ldirish: sarlavha, kodi bo'yicha topilgan yo'nalish, semestrlar soni */
export interface CurriculumImportDraft {
  sheet?: string | null;
  header?: CurriculumImportHeader | null;
  programId?: number | null;
  programName?: string | null;
  semesterCount?: number | null;
}

/** Importda fanlar bilan birga: amaliyot/YaDA, o'quv jarayoni jadvali, kvalifikatsiya */
export interface CurriculumImportExtras {
  components?: CurriculumImportComponent[];
  schedule?: CurriculumScheduleRow[];
  qualification?: string | null;
}

export interface CurriculumImportResult {
  subjectsCreated: number;
  itemsAdded: number;
  componentsAdded?: number;
  itemsSkipped: number;
  curriculum: CurriculumVersion;
}

export interface CurriculumVersion {
  id: number;
  programId: number;
  programName: string;
  facultyId?: number | null;
  facultyName?: string | null;
  versionCode: string;
  academicYear: string;
  startYear: number;
  name: string;
  active: boolean;
  educationLanguage: string;
  passingScore: number;
  baseCreditAmount: number;
  educationForm: CurriculumEducationForm;
  ratingSystemId: number;
  ratingSystemName: string;
  semesterCount: number;
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
  createdByUserId?: number | null;
  qualification?: string | null;
  components?: CurriculumComponent[];
  schedule?: CurriculumScheduleRow[];
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
  semesterNumber?: number;
  unassignedOnly?: boolean;
  search?: string;
  status?: CurriculumStudentStatus;
  page?: number;
  size?: number;
}

export interface CurriculumSemesterPeriod {
  id: number;
  curriculumId: number;
  academicYear: string;
  semesterNumber: number;
  startsOn: string;
  endsOn: string;
  active: boolean;
}

export interface CurriculumStudentAssignment {
  id: number;
  curriculumId: number;
  studentId: number;
  studentNumber: string;
  fullName: string;
  groupId?: number | null;
  academicYear: string;
  semesterNumber: number;
  startsOn: string;
  endsOn: string;
  active: boolean;
}

export interface SaveCurriculumSemesterPeriodInput {
  semesterNumber: number;
  startsOn: string;
  endsOn: string;
  active: boolean;
}

export interface SaveCurriculumVersionInput {
  programId: number;
  versionCode: string;
  academicYear: string;
  name: string;
  active: boolean;
  educationLanguage: string;
  passingScore: number;
  baseCreditAmount: number;
  educationForm: CurriculumEducationForm;
  ratingSystemId: number;
  semesterCount: number;
  credentialType: CurriculumCredentialType;
  normativeBasisType: CurriculumNormativeBasisType;
  standardReference: string;
  qualificationRequirementsReference: string;
  validFrom: string;
  validUntil: string;
  qualification?: string | null;
}

export interface AddCurriculumSubjectInput {
  subjectId: number;
  semester: number;
  planItemType: CurriculumPlanItemType;
  credits?: number;
  planRowNumber?: string | null;
  hours?: CurriculumSubjectHours;
}

export interface ApproveCurriculumInput {
  approvalOrderNumber: string;
  approvalOrderDate: string;
}

export const curriculumInputError = (input: SaveCurriculumVersionInput): string | null => {
  const yearMatch = /^(\d{4})-(\d{4})$/.exec(input.academicYear);
  if (input.name.trim().length < 2) return "O'quv reja nomi majburiy";
  if (!input.programId || !input.versionCode.trim()) return "Dastur va versiya kodi majburiy";
  if (!input.educationLanguage) return "O'quv reja tilini tanlang";
  if (!Number.isInteger(input.passingScore) || input.passingScore < 0 || input.passingScore > 100) return "O'tish bali 0-100 oralig'ida bo'lishi kerak";
  if (!Number.isInteger(input.baseCreditAmount) || input.baseCreditAmount < 0) return "Bazaviy kredit summasi manfiy bo'lmasligi kerak";
  if (!input.ratingSystemId) return "Kredit baholash tizimini tanlang";
  if (!Number.isInteger(input.semesterCount) || input.semesterCount < 1 || input.semesterCount > 15) return "Semestr soni 1-15 oralig'ida bo'lishi kerak";
  if (!yearMatch || Number(yearMatch[2]) !== Number(yearMatch[1]) + 1) return "O'quv yili YYYY-YYYY ketma-ket formatida bo'lishi kerak";
  const academicFrom = `${yearMatch[1]}-09-01`;
  const academicUntil = `${yearMatch[2]}-08-31`;
  if (!input.validFrom || !input.validUntil || input.validFrom > academicFrom || input.validUntil < academicUntil) return "Amal qilish davri butun o'quv yilini qoplashi kerak";
  if (input.credentialType === "STATE_DIPLOMA" && input.normativeBasisType !== "STATE_EDUCATION_STANDARD") return "Davlat diplomi davlat ta'lim standartiga asoslanadi";
  if (input.credentialType === "NON_STATE_CREDENTIAL" && input.normativeBasisType !== "PROFESSIONAL_STANDARD") return "Nodavlat hujjat kasbiy standartga asoslanadi";
  return null;
};

export const curriculumApprovalReason = (version: CurriculumVersion, actor?: import("@/types/auth.types").User | null) => {
  if (actor?.id != null && version.createdByUserId != null && version.createdByUserId === actor.id && actor.role?.name?.toLowerCase() !== "super_admin")
    return "O‘zingiz yaratgan rejani boshqa vakolatli xodim tasdiqlashi kerak.";
  return null;
};

export const canApproveCurriculum = (version: CurriculumVersion) =>
  version.status === "DRAFT" &&
  version.active &&
  version.subjectCount > 0 &&
  Boolean(version.standardReference.trim()) &&
  Boolean(version.qualificationRequirementsReference.trim());

export const curriculumApi = {
  list: async () => (await api.get<CurriculumVersion[]>("/curricula")).data,
  get: async (id: number) => (await api.get<CurriculumVersion>(`/curricula/${id}`)).data,
  listStudents: async (id: number, query: CurriculumStudentQuery = {}) => (
    await api.get<CurriculumStudentPage>(`/curricula/${id}/students`, { params: query })
  ).data,
  listSemesterPeriods: async (id: number) => (
    await api.get<CurriculumSemesterPeriod[]>(`/curricula/${id}/semesters`)
  ).data,
  saveSemesterPeriod: async (id: number, input: SaveCurriculumSemesterPeriodInput) => (
    await api.put<CurriculumSemesterPeriod>(`/curricula/${id}/semesters/${input.semesterNumber}`, input)
  ).data,
  listStudentAssignments: async (id: number) => (
    await api.get<CurriculumStudentAssignment[]>(`/curricula/${id}/student-assignments`)
  ).data,
  assignStudents: async (id: number, studentIds: number[], semesterNumber: number) => (
    await api.post<CurriculumStudentAssignment[]>(`/curricula/${id}/student-assignments`, { studentIds, semesterNumber })
  ).data,
  removeStudentAssignment: async (id: number, assignmentId: number) => {
    await api.delete(`/curricula/${id}/student-assignments/${assignmentId}`);
  },
  create: async (input: SaveCurriculumVersionInput) => (await api.post<CurriculumVersion>("/curricula", input)).data,
  update: async (id: number, input: SaveCurriculumVersionInput) => (await api.put<CurriculumVersion>(`/curricula/${id}`, input)).data,
  addSubject: async (id: number, input: AddCurriculumSubjectInput) => (await api.post<CurriculumVersion>(`/curricula/${id}/subjects`, input)).data,
  removeSubject: async (id: number, itemId: number) => (await api.delete<CurriculumVersion>(`/curricula/${id}/subjects/${itemId}`)).data,
  /** Reja faniga mavjud o'quv dasturini biriktirish (fanning barcha semestr qatorlariga) */
  attachSyllabus: async (id: number, itemId: number, syllabusId: number) =>
    (await api.put<CurriculumVersion>(`/curricula/${id}/subjects/${itemId}/syllabus/${syllabusId}`)).data,
  /** Fan nomi bilan yangi o'quv dasturi yaratib biriktirish */
  createSyllabus: async (id: number, itemId: number, input: CreateCurriculumSyllabusInput) =>
    (await api.post<CurriculumVersion>(`/curricula/${id}/subjects/${itemId}/syllabus`, input)).data,
  detachSyllabus: async (id: number, itemId: number) =>
    (await api.delete<CurriculumVersion>(`/curricula/${id}/subjects/${itemId}/syllabus`)).data,
  updateSubject: async (id: number, itemId: number, input: UpdateCurriculumSubjectInput) =>
    (await api.put<CurriculumVersion>(`/curricula/${id}/subjects/${itemId}`, input)).data,
  /** Ishchi o'quv reja Excel faylini o'qiydi (hech narsa saqlanmaydi) */
  importPreview: async (id: number, file: File, sheet?: string | null) => {
    const form = new FormData();
    form.append("file", file);
    if (sheet) form.append("sheet", sheet);
    return (await api.post<CurriculumImportPreview>(`/curricula/${id}/import/preview`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data;
  },
  importDraft: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<CurriculumImportDraft>("/curricula/import/draft", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })).data;
  },
  importApply: async (id: number, rows: CurriculumImportRow[], extras: CurriculumImportExtras = {}) =>
    (await api.post<CurriculumImportResult>(`/curricula/${id}/import`, { rows, ...extras })).data,
  /** Malakaviy amaliyot / YaDA (faqat qoralama rejada) */
  addComponent: async (id: number, input: SaveCurriculumComponentInput) =>
    (await api.post<CurriculumVersion>(`/curricula/${id}/components`, input)).data,
  updateComponent: async (id: number, componentId: number, input: SaveCurriculumComponentInput) =>
    (await api.put<CurriculumVersion>(`/curricula/${id}/components/${componentId}`, input)).data,
  removeComponent: async (id: number, componentId: number) =>
    (await api.delete<CurriculumVersion>(`/curricula/${id}/components/${componentId}`)).data,
  approve: async (id: number, input: ApproveCurriculumInput) => (await api.post<CurriculumVersion>(`/curricula/${id}/approve`, input)).data,
  archive: async (id: number) => (await api.post<CurriculumVersion>(`/curricula/${id}/archive`)).data,
};
