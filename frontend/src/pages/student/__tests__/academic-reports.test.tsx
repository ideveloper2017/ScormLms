import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { StudentReports, StudentTranscript } from '../academic-reports';
import { fetchTranscript, type Transcript } from '@/services/api/grade-api';
import { downloadStudentDocument, fetchStudentReport, type StudentReport } from '@/services/api/student-report-api';

vi.mock('@/services/api/grade-api', () => ({ fetchTranscript: vi.fn() }));
vi.mock('@/services/api/student-report-api', () => ({ fetchStudentReport: vi.fn(), downloadStudentDocument: vi.fn() }));
const transcript: Transcript = { studentId: '1', studentName: 'Test Student', academicYear: '2026-2027', cumulativeGPA: 0,
  totalCredits: 6, degreeProgress: 0, assessedCredits: 0, completedCredits: 0,
  semesters: [{ academicYear: '2026-2027', semester: '1', semesterGPA: 0, assessedCredits: 0, creditsEarned: 0,
    courses: [{ courseId: '3', courseCode: 'COURSE-3', courseName: 'Physics', credits: 6, gradeLetter: 'N/A', gradePoints: 0, instructor: 'Teacher', score: null }] }] };
const report: StudentReport = { from: '2026-09-01', to: '2026-09-30', gradeCount: 1, assessedCredits: 0,
  stats: { gpa: 0, totalCredits: 6, completedCredits: 0, coursesActive: 1, coursesCompleted: 0, avgScore: 0 },
  monthly: [{ month: '2026-09', avgScore: 0, gradeCount: 1, attendance: 0, attendanceCount: 0, completedCourses: 0 }],
  courses: [{ courseId: '3', courseTitle: 'Physics', completion: 67, avgScore: 0, gradeCount: 1 }] };
function mount(element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter>{element}</MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  vi.mocked(fetchTranscript).mockResolvedValue(transcript);
  vi.mocked(fetchStudentReport).mockResolvedValue(report);
  vi.mocked(downloadStudentDocument).mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it('shows unassessed course without an F and downloads the transcript', async () => {
  mount(<StudentTranscript />);
  expect(await screen.findByText('Baholanmagan')).toBeInTheDocument();
  expect(screen.queryByText('F')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Physics' })).toHaveAttribute('href', '/student/courses/3/learn');
  fireEvent.click(screen.getByRole('button', { name: 'PDF' }));
  await waitFor(() => expect(downloadStudentDocument).toHaveBeenCalledWith('transcript', 'PDF', undefined));
});
it('uses applied filters for both the report and export and keeps real zero scores', async () => {
  mount(<StudentReports />);
  expect(await screen.findByText('0.0 / 100')).toBeInTheDocument();
  await screen.findByRole('option', { name: 'Physics' });
  fireEvent.change(screen.getByLabelText('Boshlanish sanasi'), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText('Tugash sanasi'), { target: { value: '2026-09-30' } });
  fireEvent.change(screen.getByLabelText('Kurs'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: "Qo'llash" }));
  const filters = { from: '2026-09-01', to: '2026-09-30', courseId: '3' };
  await waitFor(() => expect(fetchStudentReport).toHaveBeenLastCalledWith(filters));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Excel' })).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Kurs'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Excel' }));
  await waitFor(() => expect(downloadStudentDocument).toHaveBeenCalledWith('reports', 'XLSX', filters));
  fireEvent.change(screen.getByLabelText('Boshlanish sanasi'), { target: { value: '2026-10-01' } });
  expect(screen.getByRole('button', { name: "Qo'llash" })).toBeDisabled();
});
it('shows a retry action and disables export when loading fails', async () => {
  vi.mocked(fetchStudentReport).mockRejectedValueOnce(new Error('Offline'));
  mount(<StudentReports />);
  expect(await screen.findByRole('alert')).toHaveTextContent("Ma'lumotni yuklab bo'lmadi");
  expect(screen.getByRole('button', { name: 'PDF' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));
  expect(await screen.findByText('0.0 / 100')).toBeInTheDocument();
});
