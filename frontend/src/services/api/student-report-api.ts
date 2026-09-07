import api from '@/lib/api';

export interface StudentReportFilters { from: string; to: string; courseId?: string }
export interface StudentReport {
  from: string; to: string; gradeCount: number; assessedCredits: number;
  stats: { gpa: number; totalCredits: number; completedCredits: number; coursesCompleted: number; coursesActive: number; avgScore: number };
  monthly: { month: string; avgScore: number; attendance: number; completedCourses: number; gradeCount: number; attendanceCount: number }[];
  courses: { courseId: string; courseTitle: string; completion: number; avgScore: number; gradeCount: number }[];
}
export async function fetchStudentReport(filters: StudentReportFilters): Promise<StudentReport> {
  return (await api.get<StudentReport>('/students/me/reports/overview', { params: filters })).data;
}
export async function downloadStudentDocument(document: 'transcript' | 'reports', format: 'PDF' | 'XLSX', filters?: StudentReportFilters): Promise<void> {
  const response = await api.get<Blob>(`/students/me/${document}/export`, { params: { ...filters, format }, responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `${document}.${format.toLowerCase()}`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
