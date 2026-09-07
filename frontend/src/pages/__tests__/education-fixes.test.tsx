import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AcademicStatements } from '../admin/academic-results';
import { TeacherSessions } from '../teacher/sessions';
import { AdminSyllabi } from '../admin/syllabi';
import { StatementDetails } from '@/components/admin/statement-detail';
import { SyllabusWorkflow } from '@/components/admin/syllabus-workflow';
import * as results from '@/services/api/academic-results-api';
import { teacherPortalApi, type TeacherLearningSession } from '@/services/api/teacher-portal-api';
import { syllabusApi, type SubjectSyllabus } from '@/services/api/syllabus-api';
import { listSubjects } from '@/lib/academic-api';
import { downloadCsv } from '@/utils/csv-export';
import { curriculumApprovalReason, type CurriculumVersion } from '@/services/api/curriculum-api';
import type { User } from '@/types/auth.types';

vi.mock('@/services/api/academic-results-api');
vi.mock('@/services/api/teacher-portal-api');
vi.mock('@/services/api/syllabus-api');
vi.mock('@/utils/csv-export');
vi.mock('@/lib/academic-api', async importOriginal => ({ ...await importOriginal<object>(), listSubjects: vi.fn() }));
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { id: 1, role: { name: 'admin' }, roles: [], permissions: ['ACADEMIC_WRITE', 'REPORT_READ'] } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
function mount(ui: React.ReactNode) { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>); }
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); HTMLElement.prototype.scrollIntoView = vi.fn(); });

it('exports exactly the searched statement rows and opens their student results', async () => {
  const row = { id: 1, topic: 'Fizika nazorati', subject: 'Fizika', group: '101', academicYear: '2026-2027', semester: 1, controlType: 'ORALIQ', statement: 'Vedomost', status: 'ONGOING', finalStatement: false, addedDate: '2026-09-07', resultCount: 1, passedCount: 1, averageScore: 80 };
  vi.mocked(results.listAcademicStatements).mockResolvedValue([row, { ...row, id: 2, topic: 'Kimyo nazorati', subject: 'Kimyo' }]);
  vi.mocked(results.getStatement).mockResolvedValue({ id: 1, title: row.topic, status: 'ONGOING', students: [], completionProblems: ['Talabalar ro‘yxati bo‘sh'] });
  mount(<AcademicStatements finalStatement={false} />);
  await screen.findByText('Kimyo nazorati');
  fireEvent.change(screen.getByPlaceholderText("Mavzu yoki fan bo'yicha qidirish..."), { target: { value: 'Fizika' } });
  expect(screen.queryByText('Kimyo nazorati')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Excel uchun CSV' }));
  expect(vi.mocked(downloadCsv).mock.calls[0][2]).toHaveLength(1);
  expect(vi.mocked(downloadCsv).mock.calls[0][2][0][0]).toBe('Fizika nazorati');
  fireEvent.click(screen.getByRole('button', { name: 'Ochish' }));
  await screen.findByRole('dialog');
  await waitFor(() => expect(results.getStatement).toHaveBeenCalledWith(1));
});

it('requires review before closing a complete statement and displays server errors', async () => {
  vi.mocked(results.getStatement).mockResolvedValue({ id: 4, title: 'Yakuniy nazorat', status: 'ONGOING', students: [], completionProblems: [] });
  vi.mocked(results.completeStatement).mockRejectedValue(new Error('Baho yetishmaydi'));
  mount(<StatementDetails id={4} canWrite close={vi.fn()} />);
  const button = await screen.findByRole('button', { name: 'Tasdiqlab yakunlash' });
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Baho yetishmaydi');
  expect(results.completeStatement).toHaveBeenCalledWith(4);
});

it('does not offer finalization to a read-only viewer', async () => {
  vi.mocked(results.getStatement).mockResolvedValue({ id: 4, title: 'Yakuniy nazorat', status: 'ONGOING', students: [], completionProblems: [] });
  mount(<StatementDetails id={4} canWrite={false} close={vi.fn()} />);
  await screen.findByText('Yakuniy nazorat');
  expect(screen.queryByRole('button', { name: 'Tasdiqlab yakunlash' })).not.toBeInTheDocument();
});

it('edits the existing session instead of creating a duplicate and preserves local time', async () => {
  const session: TeacherLearningSession = { id: '9', courseId: '3', courseTitle: 'Fizika', title: 'Eski dars', description: 'Tavsif', format: 'synchronous', sessionType: 'lecture', startsAt: '2027-01-15T09:00:00Z', endsAt: '2027-01-15T10:00:00Z', room: '101', status: 'published', accessCount: 0 };
  vi.mocked(teacherPortalApi.getLearningSessions).mockResolvedValue([session]);
  vi.mocked(teacherPortalApi.getCourses).mockResolvedValue([{ id: '3', title: 'Fizika', status: 'published' } as never]);
  vi.mocked(teacherPortalApi.updateLearningSession).mockResolvedValue({ ...session, title: 'Yangi dars', room: '202' });
  mount(<TeacherSessions />);
  fireEvent.click(await screen.findByRole('button', { name: 'Tahrirlash' }));
  fireEvent.change(screen.getByPlaceholderText("Mashg'ulot nomi"), { target: { value: 'Yangi dars' } });
  fireEvent.change(screen.getByPlaceholderText('Xona'), { target: { value: '202' } });
  fireEvent.click(screen.getByRole('button', { name: 'O‘zgarishlarni saqlash' }));
  await waitFor(() => expect(teacherPortalApi.updateLearningSession).toHaveBeenCalledWith('9', expect.objectContaining({ title: 'Yangi dars', room: '202', startsAt: session.startsAt.replace('Z', '.000Z'), status: 'PUBLISHED' })));
  expect(teacherPortalApi.createLearningSession).not.toHaveBeenCalled();
});

it('explains missing syllabus subjects and provides retry', async () => {
  vi.mocked(syllabusApi.list).mockResolvedValue([]);
  vi.mocked(listSubjects).mockRejectedValue(new Error('offline'));
  mount(<AdminSyllabi />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Fanlar yuklanmadi');
  fireEvent.click(screen.getByRole('button', { name: 'Fanlarni qayta yuklash' }));
  await waitFor(() => expect(listSubjects).toHaveBeenCalledTimes(2));
});

it('shows approved history and opens a new draft through the workflow', async () => {
  const item: SubjectSyllabus = { id: 3, subjectId: 7, subjectName: 'Fizika', name: 'Fan dasturi', language: 'UZ', shortDescription: 'Mazmun', fullDescription: 'Tasdiqlangan mazmun', active: true, status: 'APPROVED', revisionNumber: 1 };
  vi.mocked(syllabusApi.history).mockResolvedValue([{ revisionNumber: 1, content: item, approvedByName: 'Metodist', approvedAt: '2026-09-07T10:00:00Z' }]);
  vi.mocked(syllabusApi.workflow).mockResolvedValue({ ...item, status: 'DRAFT', revisionNumber: 2 });
  mount(<SyllabusWorkflow item={item} canWrite reload={vi.fn()} close={vi.fn()} />);
  await screen.findByText(/1-versiya · Metodist/);
  fireEvent.click(screen.getByRole('button', { name: 'Yangi versiya ochish' }));
  await waitFor(() => expect(syllabusApi.workflow).toHaveBeenCalledWith(3, 'NEW_VERSION'));
});

it('explains self-approval restriction while retaining the super-admin exception', () => {
  const plan = { createdByUserId: 1 } as CurriculumVersion;
  const actor = { id: 1, role: { name: 'admin' } } as User;
  expect(curriculumApprovalReason(plan, actor)).toContain('boshqa vakolatli xodim');
  expect(curriculumApprovalReason(plan, { ...actor, id: 2 })).toBeNull();
  expect(curriculumApprovalReason(plan, { ...actor, role: { name: 'super_admin' } } as User)).toBeNull();
});
