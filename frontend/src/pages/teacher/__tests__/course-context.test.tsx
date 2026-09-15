import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeacherAssignments } from '../assignments';
import { TeacherSessions } from '../sessions';
import { teacherPortalApi, type TeacherAssignment, type TeacherCourse, type TeacherLearningSession } from '@/services/api/teacher-portal-api';

vi.mock('@/services/api/teacher-portal-api', () => ({ teacherPortalApi: { getCourses: vi.fn(), getAssignments: vi.fn(), createAssignment: vi.fn(), getLearningSessions: vi.fn(), createLearningSession: vi.fn() } }));
const courses = [{ id: '1', title: 'Mexanika', status: 'published' }, { id: '2', title: 'Optika', status: 'archived' }] as TeacherCourse[];
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(teacherPortalApi.getCourses).mockResolvedValue(courses);
  vi.mocked(teacherPortalApi.getAssignments).mockResolvedValue([
    { id: '10', courseId: '1', title: 'Kuch masalasi', courseTitle: 'Mexanika', status: 'active', dueDate: '2026-10-01', totalSubmissions: 0, pendingGrade: 0 },
    { id: '20', courseId: '2', title: 'Nur masalasi', courseTitle: 'Optika', status: 'draft', dueDate: '2026-10-01', totalSubmissions: 0, pendingGrade: 0 },
  ] as TeacherAssignment[]);
  vi.mocked(teacherPortalApi.getLearningSessions).mockResolvedValue([
    { id: '11', courseId: '1', title: 'Kuchlar darsi', courseTitle: 'Mexanika', status: 'completed', format: 'synchronous', startsAt: '2026-09-01T10:00:00Z', endsAt: '2026-09-01T11:00:00Z', accessCount: 0 },
    { id: '22', courseId: '2', title: 'Nurlar darsi', courseTitle: 'Optika', status: 'completed', format: 'synchronous', startsAt: '2026-09-01T10:00:00Z', endsAt: '2026-09-01T11:00:00Z', accessCount: 0 },
  ] as TeacherLearningSession[]);
});
function mount(page: 'assignments' | 'sessions', id: string, openCreate = false) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[`/teacher/${page}?courseId=${id}`]}>{page === 'assignments' ? <TeacherAssignments openCreate={openCreate} /> : <TeacherSessions />}</MemoryRouter></QueryClientProvider>);
}

describe('course context in teacher workflows', () => {
  it('filters assignments and preselects the same course when creating', async () => {
    mount('assignments', '1', true);
    expect(await screen.findByRole('combobox', { name: 'Topshiriq kursi' })).toHaveTextContent('Mexanika');
    expect(screen.getByRole('combobox', { name: 'Topshiriq kursi' })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Topshiriq nomi'), { target: { value: 'Yangi masala' } });
    fireEvent.change(screen.getByLabelText('Topshiriq muddati'), { target: { value: '2026-10-01T10:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish', exact: true }));
    await waitFor(() => expect(teacherPortalApi.createAssignment).toHaveBeenCalledWith(expect.objectContaining({ courseId: 1, title: 'Yangi masala' })));
    expect(await screen.findByText('Kuch masalasi')).toBeInTheDocument();
    expect(screen.queryByText('Nur masalasi')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Barcha topshiriqlar' }));
    expect(await screen.findByText('Nur masalasi')).toBeInTheDocument();
  });

  it('rejects an archived or unknown course context instead of creating under another course', async () => {
    mount('assignments', '2', true);
    expect(await screen.findByRole('alert')).toHaveTextContent(/arxivlangan/);
    expect(screen.getByRole('button', { name: 'Yaratish', exact: true })).toBeDisabled();
    expect(teacherPortalApi.createAssignment).not.toHaveBeenCalled();
  });

  it('filters the schedule, preserves course selection and can return to all sessions', async () => {
    mount('sessions', '1');
    expect(await screen.findByText('Kuchlar darsi')).toBeInTheDocument();
    expect(screen.queryByText('Nurlar darsi')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: "Mashg'ulot kursi" })).toHaveTextContent('Mexanika');
    expect(screen.getByRole('combobox', { name: "Mashg'ulot kursi" })).toBeDisabled();
    fireEvent.click(screen.getByRole('link', { name: "Barcha mashg'ulotlar" }));
    expect(await screen.findByText('Nurlar darsi')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: "Mashg'ulot kursi" })).toBeEnabled();
  });

  it('does not allow sessions for an unknown course from the URL', async () => {
    mount('sessions', '999');
    expect(await screen.findByText("Kurs mavjud emas yoki arxivlangan. Yangi mashg'ulot yaratish yopiq.")).toHaveAttribute('role', 'alert');
    fireEvent.change(screen.getByPlaceholderText("Mashg'ulot nomi"), { target: { value: 'Dars' } });
    fireEvent.change(screen.getByPlaceholderText('Xona'), { target: { value: '101' } });
    expect(screen.getByRole('button', { name: 'Saqlash', exact: true })).toBeDisabled();
    expect(teacherPortalApi.createLearningSession).not.toHaveBeenCalled();
  });
});
