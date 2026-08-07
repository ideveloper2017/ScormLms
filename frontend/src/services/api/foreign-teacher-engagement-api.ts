import api from "@/lib/api";

export type ForeignTeacherEngagementStatus = "DRAFT" | "VERIFIED" | "REJECTED";

export interface ForeignTeacherOption { id: number; fullName: string; academicDegree?: string | null; position?: string | null }
export interface ForeignTeacherCourseOption { id: number; title: string; subjectName: string; programName: string }
export interface ForeignTeacherEngagementCourse { id: number; title: string; subjectName: string; programName: string }

export interface ForeignTeacherEngagement {
  id: number; teacherId: number; teacherName: string; academicYear: string; citizenshipCountryCode: string;
  citizenshipEvidenceReference: string; qualificationReference: string; contractNumber: string; contractDate: string;
  engagementOrderNumber: string; engagementOrderDate: string; engagementStartDate: string; engagementEndDate: string;
  remoteTeachingConfirmed: boolean; evidenceReference: string; courses: ForeignTeacherEngagementCourse[];
  status: ForeignTeacherEngagementStatus; createdBy: string; verifiedAt?: string | null; verifiedBy?: string | null;
  verificationNote?: string | null; rejectedAt?: string | null; rejectedBy?: string | null; rejectionReason?: string | null;
}

export interface SaveForeignTeacherEngagementInput {
  teacherId: number; academicYear: string; citizenshipCountryCode: string; citizenshipEvidenceReference: string;
  qualificationReference: string; contractNumber: string; contractDate: string; engagementOrderNumber: string;
  engagementOrderDate: string; engagementStartDate: string; engagementEndDate: string;
  remoteTeachingConfirmed: boolean; evidenceReference: string; courseIds: number[];
}

export const foreignTeacherEngagementInputError = (input: SaveForeignTeacherEngagementInput, today: string): string | null => {
  const match = /^(\d{4})-(\d{4})$/.exec(input.academicYear);
  const country = input.citizenshipCountryCode.trim().toUpperCase();
  if (!input.teacherId) return "Faol pedagog majburiy";
  if (!match || Number(match[2]) !== Number(match[1]) + 1) return "O'quv yili YYYY-YYYY ketma-ket formatida bo'lishi kerak";
  if (!/^[A-Z]{2}$/.test(country) || country === "UZ") return "UZdan boshqa ISO alpha-2 davlat kodi kerak";
  if (!input.citizenshipEvidenceReference.trim() || !input.qualificationReference.trim()) return "Fuqarolik va malaka dalillari majburiy";
  if (!input.contractNumber.trim() || !input.contractDate || !input.engagementOrderNumber.trim() || !input.engagementOrderDate) return "Shartnoma va jalb qilish buyrug'i rekvizitlari majburiy";
  if (!input.engagementStartDate || !input.engagementEndDate || input.engagementEndDate < input.engagementStartDate) return "To'g'ri engagement davri majburiy";
  if (input.contractDate > today || input.engagementOrderDate > today) return "Shartnoma va buyruq sanasi kelajakda bo'lmaydi";
  if (input.contractDate > input.engagementStartDate || input.engagementOrderDate > input.engagementStartDate) return "Shartnoma va buyruq engagement boshlanishidan kech bo'lmaydi";
  const from = `${match[1]}-09-01`; const to = `${match[2]}-08-31`;
  if (input.engagementStartDate < from || input.engagementEndDate > to) return "Engagement davri o'quv yili doirasida bo'lishi kerak";
  if (!input.courseIds.length) return "Kamida bitta masofaviy kurs tanlanishi kerak";
  if (!input.evidenceReference.trim()) return "Engagement dalili rekviziti majburiy";
  return null;
};

export const foreignTeacherEngagementApi = {
  list: async () => (await api.get<ForeignTeacherEngagement[]>("/foreign-teacher-engagements")).data,
  get: async (id: number) => (await api.get<ForeignTeacherEngagement>(`/foreign-teacher-engagements/${id}`)).data,
  eligibleTeachers: async () => (await api.get<ForeignTeacherOption[]>("/foreign-teacher-engagements/eligible-teachers")).data,
  eligibleCourses: async () => (await api.get<ForeignTeacherCourseOption[]>("/foreign-teacher-engagements/eligible-courses")).data,
  create: async (input: SaveForeignTeacherEngagementInput) => (await api.post<ForeignTeacherEngagement>("/foreign-teacher-engagements", input)).data,
  update: async (id: number, input: SaveForeignTeacherEngagementInput) => (await api.put<ForeignTeacherEngagement>(`/foreign-teacher-engagements/${id}`, input)).data,
  verify: async (id: number, verificationNote: string) => (await api.post<ForeignTeacherEngagement>(`/foreign-teacher-engagements/${id}/verify`, { verificationNote })).data,
  reject: async (id: number, reason: string) => (await api.post<ForeignTeacherEngagement>(`/foreign-teacher-engagements/${id}/reject`, { reason })).data,
};
