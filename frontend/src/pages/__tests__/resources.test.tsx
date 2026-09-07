import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { Resources } from '../resources';
import { resourcesApi } from '@/services/api/resources-api';
import { teacherPortalApi } from '@/services/api/teacher-portal-api';
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { id: 1, role: { name: 'student' }, roles: [] } }) }));
vi.mock('@/services/api/resources-api', () => ({ resourcesApi: { getResources: vi.fn() } }));
vi.mock('@/services/api/teacher-portal-api', () => ({ teacherPortalApi: { downloadContentFile: vi.fn() } }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.resetAllMocks(); });
function mount() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><Resources /></MemoryRouter></QueryClientProvider>); }
it('filters real course resources, opens the precise lesson and downloads with authentication', async () => {
  vi.mocked(resourcesApi.getResources).mockResolvedValue([
    { id: '1', title: 'Lecture', type: 'text', course: 'Physics', courseId: '3', contentId: 9, url: '/student/courses/3/learn?content=9', uploadedAt: '2026-09-07' },
    { id: '2', title: 'Worksheet', type: 'document', course: 'Physics', courseId: '3', contentId: 10, fileName: 'worksheet.txt', url: '/student/courses/3/learn?content=10', uploadedAt: '2026-09-07' },
  ]);
  vi.mocked(teacherPortalApi.downloadContentFile).mockResolvedValue(new Blob(['worksheet']));
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() }));
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  mount();
  expect(await screen.findByText('Lecture')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Yangi Resurs/ })).not.toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'Darsni ochish' })[0]).toHaveAttribute('href', '/student/courses/3/learn?content=9');
  fireEvent.change(screen.getByLabelText('Resurs turi'), { target: { value: 'document' } });
  expect(screen.queryByText('Lecture')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Yuklab olish' }));
  await waitFor(() => expect(teacherPortalApi.downloadContentFile).toHaveBeenCalledWith('3', 10));
  await waitFor(() => expect(click).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText('Resurs qidirish'), { target: { value: 'missing' } });
  expect(screen.getByText("Bu filtr bo'yicha material topilmadi.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Filtrlarni tozalash' }));
  expect(screen.getByText('Lecture')).toBeInTheDocument();
});
it('does not disguise a failed resource request as an empty library', async () => {
  vi.mocked(resourcesApi.getResources).mockRejectedValue(new Error('Offline'));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent("Materiallarni yuklab bo'lmadi");
  expect(screen.queryByText("Hozircha sizga ochiq material yo'q.")).not.toBeInTheDocument();
});
