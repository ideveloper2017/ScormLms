import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { HemisSyncPanel } from '../admin/hemis-sync-panel';
import { hemisSyncApi } from '@/services/api/hemis-sync-api';

vi.mock('@/services/api/hemis-sync-api', () => ({ hemisSyncApi: {
  overview: vi.fn(), runs: vi.fn(), mappings: vi.fn(), localGroups: vi.fn(), conflicts: vi.fn(),
  start: vi.fn(), connection: vi.fn(), checkConnection: vi.fn(),
} }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const state = { canManage: true, credentialsConfigured: true, periodicEnabled: false, asyncEnabled: true,
  pageSize: 100, cron: '', openConflicts: 0, mappingsReady: 1, mappingsTotal: 2, currentRun: null };
beforeEach(() => {
  vi.mocked(hemisSyncApi.overview).mockResolvedValue(state);
  vi.mocked(hemisSyncApi.runs).mockResolvedValue([]);
  vi.mocked(hemisSyncApi.conflicts).mockResolvedValue([]);
  vi.mocked(hemisSyncApi.localGroups).mockResolvedValue([]);
  vi.mocked(hemisSyncApi.connection).mockResolvedValue({ status: 'NOT_CHECKED', host: 'https://student.hemis.uz', missingFields: [], message: 'Tekshirilmagan' });
  vi.mocked(hemisSyncApi.mappings).mockResolvedValue([
    { hemisGroupId: 501, hemisGroupName: 'FIZ-101', localGroupId: 4, localGroupName: 'FIZ-101 LMS', active: true, lastSeenAt: '' },
    { hemisGroupId: 502, hemisGroupName: 'BOGLANMAGAN', localGroupId: null, active: true, lastSeenAt: '' },
  ]);
});
function mount() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><HemisSyncPanel /></QueryClientProvider>);
}
it('imports only the explicitly selected mapped group', async () => {
  vi.mocked(hemisSyncApi.start).mockResolvedValue({ id: 1 } as never);
  mount();
  expect(await screen.findByRole('button', { name: 'Tanlangan guruhni import qilish' })).toBeDisabled();
  expect(await screen.findByRole('option', { name: 'FIZ-101 → FIZ-101 LMS' })).toBeInTheDocument();
  expect(screen.queryByRole('option', { name: 'BOGLANMAGAN' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Import uchun HEMIS guruhi'), { target: { value: '501' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tanlangan guruhni import qilish' }));
  await waitFor(() => expect(hemisSyncApi.start).toHaveBeenCalledWith(501, expect.anything()));
});
it('disables remote loading and import when credentials are missing', async () => {
  vi.mocked(hemisSyncApi.overview).mockResolvedValue({ ...state, credentialsConfigured: false });
  mount();
  await screen.findByRole('option', { name: 'FIZ-101 → FIZ-101 LMS' });
  fireEvent.change(screen.getByLabelText('Import uchun HEMIS guruhi'), { target: { value: '501' } });
  expect(screen.getByRole('button', { name: 'Tanlangan guruhni import qilish' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Guruhlarni olish' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Sinxronlashni boshlash' })).toBeDisabled();
  expect(hemisSyncApi.start).not.toHaveBeenCalled();
});
