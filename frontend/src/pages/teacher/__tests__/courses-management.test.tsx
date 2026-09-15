import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeacherCourses } from '../courses';
import { teacherPortalApi, type TeacherCourse } from '@/services/api/teacher-portal-api';

vi.mock('@/services/api/teacher-portal-api', () => ({ teacherPortalApi: { getCourses: vi.fn(), updateCourseStatus: vi.fn(), deleteCourse: vi.fn(), copyCourse: vi.fn() } }));
const courses = [
  { id: '1', title: 'Algebra', status: 'draft', categoryName: 'Matematika', groupName: 'Guruh A' },
  { id: '2', title: 'Mexanika', status: 'published', categoryName: 'Fizika', groupName: 'Guruh B' },
  { id: '3', title: 'Optika', status: 'archived', categoryName: 'Fizika', groupName: 'Guruh C' },
] as TeacherCourse[];
beforeEach(() => { vi.resetAllMocks(); vi.mocked(teacherPortalApi.getCourses).mockResolvedValue(courses); });
function mount() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}><MemoryRouter><TeacherCourses /></MemoryRouter></QueryClientProvider>);
}
async function menu(title: string) {
  const button = await screen.findByRole('button', { name: `${title}: amallar` });
  fireEvent.keyDown(button, { key: 'Enter' });
  return screen.findByRole('menu');
}

describe('course management actions', () => {
  it('does not delete on opening or cancelling confirmation, then deletes only the chosen course', async () => {
    mount();
    fireEvent.click(within(await menu('Algebra')).getByRole('menuitem', { name: "Kursni o'chirish" }));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Algebra');
    expect(teacherPortalApi.deleteCourse).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }));
    expect(teacherPortalApi.deleteCourse).not.toHaveBeenCalled();
    fireEvent.click(within(await menu('Algebra')).getByRole('menuitem', { name: "Kursni o'chirish" }));
    fireEvent.click(screen.getByRole('button', { name: "O'chirish", exact: true }));
    await waitFor(() => expect(teacherPortalApi.deleteCourse).toHaveBeenCalledExactlyOnceWith('1'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('disables deletion of published courses and confirms archive before changing status', async () => {
    mount();
    const actions = await menu('Mexanika');
    expect(within(actions).getByRole('menuitem', { name: "Kursni o'chirish" })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(within(actions).getByRole('menuitem', { name: 'Arxivlash' }));
    expect(teacherPortalApi.updateCourseStatus).not.toHaveBeenCalled();
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Mexanika');
    fireEvent.click(screen.getByRole('button', { name: 'Arxivlash', exact: true }));
    await waitFor(() => expect(teacherPortalApi.updateCourseStatus).toHaveBeenCalledExactlyOnceWith('2', 'ARCHIVED'));
  });

  it('restores an archived course to draft without publishing it', async () => {
    mount();
    const actions = await menu('Optika');
    expect(within(actions).queryByRole('menuitem', { name: 'Nashr qilish' })).not.toBeInTheDocument();
    fireEvent.click(within(actions).getByRole('menuitem', { name: 'Qoralamaga qaytarish' }));
    await waitFor(() => expect(teacherPortalApi.updateCourseStatus).toHaveBeenCalledExactlyOnceWith('3', 'DRAFT'));
  });

  it('keeps a failed confirmation open and blocks duplicate requests while pending', async () => {
    let reject!: (error: Error) => void;
    vi.mocked(teacherPortalApi.deleteCourse).mockReturnValue(new Promise((_resolve, fail) => { reject = fail; }));
    mount();
    fireEvent.click(within(await menu('Algebra')).getByRole('menuitem', { name: "Kursni o'chirish" }));
    const confirm = screen.getByRole('button', { name: "O'chirish", exact: true });
    fireEvent.click(confirm); fireEvent.click(confirm);
    await waitFor(() => expect(teacherPortalApi.deleteCourse).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: 'Bajarilmoqda…' })).toBeDisabled();
    reject(new Error('Kurs band'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Kurs band');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: "O'chirish", exact: true })).toBeEnabled();
  });

  it('combines group search and category/status filters, and clears them', async () => {
    mount();
    await screen.findByRole('button', { name: 'Mexanika: amallar' });
    fireEvent.change(screen.getByLabelText('Kurs kategoriyasi'), { target: { value: 'Fizika' } });
    expect(screen.queryByRole('button', { name: 'Algebra: amallar' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Kurs qidirish'), { target: { value: 'Guruh B' } });
    expect(screen.getByRole('button', { name: 'Mexanika: amallar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Optika: amallar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Arxivdagi kurslar/ }));
    expect(screen.getByText('Tanlangan filtrlar bo‘yicha kurs topilmadi.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Filtrlarni tozalash' }));
    expect(screen.getByRole('button', { name: 'Algebra: amallar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Optika: amallar' })).toBeInTheDocument();
  });
});
