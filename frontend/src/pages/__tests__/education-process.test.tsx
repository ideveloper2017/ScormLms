import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdminCurriculumStudents } from '../admin/curriculum-students';
import { AdminSubjectGroups } from '../admin/subject-groups';
import { TeacherSessions } from '../teacher/sessions';
import { curriculumApi, type CurriculumVersion } from '@/services/api/curriculum-api';
import { subjectGroupApi, type AcademicSubjectGroup } from '@/services/api/subject-group-api';
import { teacherPortalApi, type TeacherLearningSession } from '@/services/api/teacher-portal-api';

vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { id: 1 } }) }));
vi.mock('@/lib/rbac-api', () => ({ hasAuthority: () => true }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/services/api/curriculum-api', () => ({ curriculumApi: { list: vi.fn(), listSemesterPeriods: vi.fn(), listStudentAssignments: vi.fn(), listStudents: vi.fn(), saveSemesterPeriod: vi.fn(), assignStudents: vi.fn(), removeStudentAssignment: vi.fn() } }));
vi.mock('@/services/api/subject-group-api', () => ({ subjectGroupApi: { list: vi.fn(), members: vi.fn(), candidates: vi.fn(), teachers: vi.fn(), teacherCandidates: vi.fn(), assign: vi.fn() } }));
vi.mock('@/services/api/teacher-portal-api', () => ({ teacherPortalApi: { getLearningSessions: vi.fn(), getCourses: vi.fn(), createLearningSession: vi.fn() } }));

afterEach(() => { cleanup(); vi.resetAllMocks(); });
const plan = { id: 1, programName: 'Fizika', versionCode: 'V1', academicYear: '2026-2027', status: 'APPROVED', active: true, semesterCount: 4, subjects: [], validFrom: '2026-09-01', validUntil: '2027-08-31' } as unknown as CurriculumVersion;
const student = (id: number) => ({ studentId: id, fullName: `Talaba ${id}`, studentNumber: `S${id}`, semesterNumber: 1, status: 'ACTIVE' as const, courseNumber: 1, educationForm: 'FULL_TIME' as const, educationLanguage: 'uz' });
beforeEach(() => {
  vi.mocked(curriculumApi.list).mockResolvedValue([plan]);
  vi.mocked(curriculumApi.listSemesterPeriods).mockResolvedValue([{ id: 1, curriculumId: 1, academicYear: '2026-2027', semesterNumber: 1, startsOn: '2026-09-01', endsOn: '2027-01-01', active: true }]);
  vi.mocked(curriculumApi.listStudentAssignments).mockResolvedValue([]);
  vi.mocked(curriculumApi.listStudents).mockImplementation(async (_id, params) => ({ items: [student(params?.page ? 21 : 1)], page: params?.page ?? 0, size: 20, totalPages: 2, totalElements: 21 }));
});
function mount(component: React.ReactNode) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={['/edu-process/attached-students?curriculumId=1']}>{component}</MemoryRouter></QueryClientProvider>);
}

it('pages all eligible students and assigns a student from the second page', async () => {
  vi.mocked(curriculumApi.assignStudents).mockResolvedValue([]);
  mount(<AdminCurriculumStudents />);
  await screen.findByText('Talaba 1');
  fireEvent.click(screen.getByRole('button', { name: 'Keyingi' }));
  fireEvent.click(await screen.findByRole('checkbox', { name: /Talaba 21/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Tanlanganlarni biriktirish (1)' }));
  await waitFor(() => expect(curriculumApi.assignStudents).toHaveBeenCalledWith(1, [21], 1));
  expect(curriculumApi.listStudents).toHaveBeenCalledWith(1, expect.objectContaining({ page: 1, size: 20, semesterNumber: 1, unassignedOnly: true }));
});

it('queries by semester and search and does not offer semesters outside the plan', async () => {
  mount(<AdminCurriculumStudents />);
  await screen.findByText('Talaba 1');
  expect(screen.queryByRole('option', { name: '5-semestr' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Semestr'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Talaba qidirish'), { target: { value: 'Ali' } });
  await waitFor(() => expect(curriculumApi.listStudents).toHaveBeenLastCalledWith(1, expect.objectContaining({ semesterNumber: 3, search: 'Ali', page: 0 })));
  expect(screen.getByRole('button', { name: 'Tanlanganlarni biriktirish (0)' })).toBeDisabled();
  expect(screen.getByText('Avval tanlangan semestrning faol muddatini saqlang.')).toBeInTheDocument();
});

it('prevents invalid semester dates before sending a save', async () => {
  mount(<AdminCurriculumStudents />);
  await screen.findByText('Talaba 1');
  fireEvent.change(screen.getByLabelText('Tugash sanasi'), { target: { value: '2026-08-01' } });
  expect(screen.getByRole('button', { name: 'Semestr muddatini saqlash' })).toBeDisabled();
  expect(screen.getByText('Tugash sanasi boshlanishidan keyin bo‘lishi kerak.')).toBeInTheDocument();
  expect(curriculumApi.saveSemesterPeriod).not.toHaveBeenCalled();
});

it('shows curriculum load failure with retry instead of asking to create a new plan', async () => {
  vi.mocked(curriculumApi.list).mockRejectedValue(new Error('offline'));
  mount(<AdminCurriculumStudents />);
  expect(await screen.findByRole('alert')).toHaveTextContent("Rejalarni yuklab bo'lmadi");
  expect(screen.queryByRole('button', { name: "O'quv rejaga o'tish" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));
  await waitFor(() => expect(curriculumApi.list).toHaveBeenCalledTimes(2));
});

it('allows reaching and assigning candidates beyond the first subject group page', async () => {
  vi.mocked(subjectGroupApi.list).mockResolvedValue([{ id: 7, code: 'FIZ-A', name: 'Fizika oqimi', programName: 'Fizika', academicYear: '2026-2027', semester: 1, active: true, capacity: 30, memberCount: 0 } as AcademicSubjectGroup]);
  vi.mocked(subjectGroupApi.members).mockResolvedValue([]);
  vi.mocked(subjectGroupApi.teachers).mockResolvedValue([]);
  vi.mocked(subjectGroupApi.teacherCandidates).mockResolvedValue([]);
  vi.mocked(subjectGroupApi.candidates).mockImplementation(async (_id, params) => ({ items: [student(params?.page ? 21 : 1)], page: params?.page ?? 0, size: 20, totalPages: 2, totalElements: 21 }));
  vi.mocked(subjectGroupApi.assign).mockResolvedValue({ id: 7 } as AcademicSubjectGroup);
  mount(<AdminSubjectGroups />);
  fireEvent.click(await screen.findByRole('button', { name: /FIZ-A/ }));
  await screen.findByText('Talaba 1');
  fireEvent.click(screen.getByRole('button', { name: 'Keyingi' }));
  await screen.findByText('Talaba 21');
  fireEvent.click(screen.getByRole('button', { name: 'Biriktirish' }));
  await waitFor(() => expect(subjectGroupApi.assign).toHaveBeenCalledWith(7, [21]));
});

it('filters timetable by lesson name and state', async () => {
  vi.mocked(teacherPortalApi.getCourses).mockResolvedValue([]);
  vi.mocked(teacherPortalApi.getLearningSessions).mockResolvedValue([
    { id: '1', title: 'Mexanika', courseTitle: 'Fizika', status: 'published', startsAt: '2026-09-09T10:00:00Z', endsAt: '2026-09-09T11:00:00Z', accessCount: 0, format: 'synchronous' },
    { id: '2', title: 'Optika', courseTitle: 'Fizika', status: 'completed', startsAt: '2026-09-08T10:00:00Z', endsAt: '2026-09-08T11:00:00Z', accessCount: 0, format: 'synchronous' },
  ] as TeacherLearningSession[]);
  mount(<TeacherSessions managementMode />);
  await screen.findByText('Mexanika');
  fireEvent.change(screen.getByLabelText('Jadvaldan qidirish'), { target: { value: 'Optika' } });
  expect(screen.queryByText('Mexanika')).not.toBeInTheDocument();
  expect(screen.getByText('Optika')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Mashg‘ulot holati'), { target: { value: 'published' } });
  expect(screen.queryByText('Optika')).not.toBeInTheDocument();
  expect(screen.getByText('Tanlangan filtrlar bo‘yicha mashg‘ulot topilmadi.')).toBeInTheDocument();
});
