import api from "@/lib/api";
import { extractApiError } from "@/lib/academic-api";

export interface RatingSystemRecord {
  id: number;
  name: string;
  shortName: string;
  minScore: number;
  maxScore: number;
  passScore: number;
  active: boolean;
}
export type SaveRatingSystemRequest = Omit<RatingSystemRecord, "id">;

export interface AcademicStatementRow {
  id: number; topic: string; subjectId?: number | null; subject: string; group: string;
  academicYear: string; semester?: number | null; controlType: string; statement: string;
  status: string; finalStatement: boolean; addedDate: string; resultCount: number;
  passedCount: number; averageScore?: number | null;
}

export interface StudentAcademicResult {
  enrollmentId: number; studentId: number; fullName: string; studentNumber: string;
  group: string; program: string; courseNumber: number; academicYear: string; semester: number;
  courseId: number; subjectId?: number | null; subject: string; credits: number; assessed: boolean;
  interimScore?: number | null; finalScore?: number | null; totalScore?: number | null;
  mark?: number | null; letterGrade?: string | null; gpaPoint?: number | null; passed: boolean;
  hemisStatus: "SYNCED" | "PENDING" | "NOT_LINKED"; assessedAt?: string | null;
}

export interface StudentGpaRow {
  studentId: number; fullName: string; studentNumber: string; group: string; program: string;
  semester: number; totalCredits: number; assessedSubjects: number; gpa: number;
}

export interface TestResultRow {
  attemptId: number; studentId: number; fullName: string; group: string; academicYear: string;
  semester: number; subject: string; methodology: string; totalQuestions: number; correct: number;
  incorrect: number; attempts: number; percentage: number; mark: number; passed: boolean; testDate: string;
}

export interface SubjectReportRow {
  courseId: number; academicYears: string[]; program: string; semesters: number[]; subject: string;
  contentName: string; teacher: string; groups: string[]; studentCount: number; modules: number;
  totalContent: number; approvedContent: number; uncheckedContent: number; resources: number;
  assignments: number; videos: number; tests: number;
}

export interface StudentTaskReportRow {
  submissionId: number; status: string; academicYear: string; semester: number; statement: string;
  subject: string; assignment: string; student: string; group: string; submittedAt: string;
  gradedAt?: string | null; turnaroundDays: number; score?: number | null;
}

export interface ProgramAppropriationRow {
  program: string; studentCount: number; assessedCount: number; averageScore: number;
  mark5Count: number; mark4Count: number; mark3Count: number; mark2Count: number;
  mark5Percent: number; mark4Percent: number; mark3Percent: number; mark2Percent: number;
}

export interface SubjectGradeDistributionRow {
  subject: string; program: string; semester: number; mark2: number; mark3: number;
  mark4: number; mark5: number; students: number; averageScore: number;
}

export interface FailedStudentSummaryRow {
  courseNumber: number; semester: number; failedEnrollments: number; students: number;
}

export interface DegreeGenderStats {
  degree: string; male: number; female: number; total: number; byCourse: Record<string, number>;
}
export interface AcademicDashboard {
  students: DegreeGenderStats[]; totalStudents: number; totalTeachers: number; activeAcademicYears: string[];
}

async function load<T>(path: string, fallback: string, params?: Record<string, unknown>): Promise<T> {
  try {
    return (await api.get<T>(path, params ? { params } : undefined)).data;
  } catch (error) {
    throw extractApiError(error, fallback);
  }
}

async function create<T, B>(path: string, body: B, fallback: string): Promise<T> {
  try { return (await api.post<T>(path, body)).data; }
  catch (error) { throw extractApiError(error, fallback); }
}

async function update<T, B>(path: string, body: B, fallback: string): Promise<T> {
  try { return (await api.put<T>(path, body)).data; }
  catch (error) { throw extractApiError(error, fallback); }
}

async function remove(path: string, fallback: string): Promise<void> {
  try { await api.delete(path); }
  catch (error) { throw extractApiError(error, fallback); }
}

export const listRatingSystems = () => load<RatingSystemRecord[]>("/academic-results/rating-systems", "Baholash tizimlarini yuklab bo'lmadi");
export const createRatingSystem = (body: SaveRatingSystemRequest) => create<RatingSystemRecord, SaveRatingSystemRequest>("/academic-results/rating-systems", body, "Baholash tizimini yaratib bo'lmadi");
export const updateRatingSystem = (id: number, body: SaveRatingSystemRequest) => update<RatingSystemRecord, SaveRatingSystemRequest>(`/academic-results/rating-systems/${id}`, body, "Baholash tizimini yangilab bo'lmadi");
export const deleteRatingSystem = (id: number) => remove(`/academic-results/rating-systems/${id}`, "Baholash tizimini o'chirib bo'lmadi");

export const listAcademicStatements = (finalStatement: boolean) => load<AcademicStatementRow[]>("/academic-results/statements", "Qaydnomalarni yuklab bo'lmadi", { final: finalStatement });
export const listStudentAcademicResults = () => load<StudentAcademicResult[]>("/academic-results/student-results", "Akademik natijalarni yuklab bo'lmadi");
export const listStudentGpa = () => load<StudentGpaRow[]>("/academic-results/gpa", "GPA natijalarini yuklab bo'lmadi");
export const listAcademicTestResults = () => load<TestResultRow[]>("/academic-results/test-results", "Test natijalarini yuklab bo'lmadi");
export const listSubjectReports = () => load<SubjectReportRow[]>("/academic-results/subject-reports", "Fan hisobotini yuklab bo'lmadi");
export const listStudentTaskReports = () => load<StudentTaskReportRow[]>("/academic-results/student-tasks", "Topshiriq hisobotini yuklab bo'lmadi");
export const listProgramAppropriation = () => load<ProgramAppropriationRow[]>("/academic-results/appropriation", "O'zlashtirish statistikasini yuklab bo'lmadi");
export const listGradeDistribution = () => load<SubjectGradeDistributionRow[]>("/academic-results/grade-distribution", "Baho taqsimotini yuklab bo'lmadi");
export const listFailedStudentSummary = () => load<FailedStudentSummaryRow[]>("/academic-results/failed-summary", "Qarzdor talabalar statistikasini yuklab bo'lmadi");
export const getAcademicDashboard = () => load<AcademicDashboard>("/academic-results/dashboard", "Statistika dashbordini yuklab bo'lmadi");
