import { useState } from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { CourseEnrollmentPicker } from '../course-enrollment-picker';
import { teacherPortalApi } from '@/services/api/teacher-portal-api';
vi.mock('@/services/api/teacher-portal-api', () => ({ teacherPortalApi: { getEnrollmentCandidates: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function mount() {
  function Harness() { const [selected, onChange] = useState<number[]>([]); return <CourseEnrollmentPicker courseId="3" actorId={1} selected={selected} onChange={onChange} />; }
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Harness /></QueryClientProvider>);
}
it('selects eligible names, keeps selections across searches and lets the user review and remove them', async () => {
  vi.mocked(teacherPortalApi.getEnrollmentCandidates).mockImplementation(async (_course, search) => ({
    items: search ? [] : [{ id: 10, fullName: 'Aziz Test', studentNumber: 'S10', groupName: 'UZ-26', eligible: true, reason: null },
      { id: 11, fullName: 'Nodir Test', studentNumber: 'S11', groupName: 'UZ-26', eligible: false, reason: 'LMS orientatsiyasi yakunlanmagan' }],
    groups: [{ id: 2, name: 'UZ-26' }], page: 0, total: search ? 0 : 2, hasNext: false,
  }));
  mount();
  expect(await screen.findByRole('checkbox', { name: 'Nodir Testni tanlash' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Sahifadagilarni tanlash' }));
  expect(await screen.findByText('1 talaba tanlandi')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Talaba qidirish'), { target: { value: 'Nobody' } });
  await waitFor(() => expect(teacherPortalApi.getEnrollmentCandidates).toHaveBeenLastCalledWith('3', 'Nobody', '', 0));
  expect(screen.getByRole('button', { name: 'Aziz Test tanlovini bekor qilish' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Aziz Test tanlovini bekor qilish' }));
  expect(screen.getByText('0 talaba tanlandi')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Talaba guruhi'), { target: { value: '2' } });
  await waitFor(() => expect(teacherPortalApi.getEnrollmentCandidates).toHaveBeenLastCalledWith('3', 'Nobody', '2', 0));
});
it('shows a retry when candidates cannot be loaded', async () => {
  vi.mocked(teacherPortalApi.getEnrollmentCandidates).mockRejectedValue(new Error('Offline'));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent("Talabalarni yuklab bo'lmadi");
  fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));
  await waitFor(() => expect(teacherPortalApi.getEnrollmentCandidates).toHaveBeenCalledTimes(2));
});
