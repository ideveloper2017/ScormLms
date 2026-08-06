import api, { type ApiResponse } from "@/lib/api";

export interface ReportMetric { code: string; label: string; value: number; unit: string }
export interface CourseReportRow {
  courseId: number; courseTitle: string; ownerName: string; status: string;
  enrolledStudents: number; completedStudents: number; completionRate: number;
  averageScore: number; attendanceRate: number; contentCount: number;
  scormPackageCount: number; activityEventCount: number;
}
export interface InstitutionReport {
  generatedAt: string; scope: "INSTITUTION" | "TEACHER"; from: string; to: string;
  metrics: ReportMetric[]; courses: CourseReportRow[];
}
export type ReportExportFormat = "CSV" | "XLSX";

export async function getInstitutionReport(from: string, to: string): Promise<InstitutionReport> {
  const response = await api.get<ApiResponse<InstitutionReport>>("/reports/institution", { params: { from, to } });
  if (!response.data.success || !response.data.data) throw new Error(response.data.message ?? "Hisobotni yuklab bo'lmadi");
  return response.data.data;
}

export async function downloadInstitutionReport(from: string, to: string, format: ReportExportFormat): Promise<void> {
  const response = await api.get<Blob>("/reports/institution/export", { params: { from, to, format }, responseType: "blob" });
  const disposition = String(response.headers?.["content-disposition"] ?? "");
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? `lms-report.${format.toLowerCase()}`;
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

export const reportsApi = { getInstitutionReport, downloadInstitutionReport };
