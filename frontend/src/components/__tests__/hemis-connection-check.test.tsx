import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { HemisConnectionCheck } from '../admin/hemis-connection-check';
import { hemisSyncApi } from '@/services/api/hemis-sync-api';

vi.mock('@/services/api/hemis-sync-api', () => ({ hemisSyncApi: { connection: vi.fn(), checkConnection: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const configured = { status: 'NOT_CHECKED', host: 'https://student.hemis.uz', apiBasePath: '/rest/v1', missingFields: [], message: 'Sozlamalar mavjud. API bilan ulanish hali tekshirilmagan.' };
function mount(canManage = true) {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <HemisConnectionCheck canManage={canManage} />
  </QueryClientProvider>);
}

it('explains missing settings and does not automatically contact HEMIS', async () => {
  vi.mocked(hemisSyncApi.connection).mockResolvedValue({ ...configured, status: 'NOT_CONFIGURED', missingFields: ['HEMIS_API_TOKEN'] });
  mount();
  expect(await screen.findByRole('status')).toHaveTextContent('HEMIS API tokeni');
  expect(hemisSyncApi.checkConnection).not.toHaveBeenCalled();
});

it('checks explicitly and shows a denied request without pretending it connected', async () => {
  vi.mocked(hemisSyncApi.connection).mockResolvedValue(configured);
  vi.mocked(hemisSyncApi.checkConnection).mockResolvedValue({ ...configured, status: 'ACCESS_DENIED', message: 'HEMIS guruhlarini o‘qish uchun ruxsat yetarli emas.' });
  mount();
  await screen.findByText(configured.host);
  fireEvent.click(screen.getByRole('button', { name: 'Ulanishni tekshirish' }));
  expect(await screen.findByText('HEMIS guruhlarini o‘qish uchun ruxsat yetarli emas.')).toBeInTheDocument();
  expect(hemisSyncApi.checkConnection).toHaveBeenCalledTimes(1);
});

it('keeps checks disabled for readers', async () => {
  vi.mocked(hemisSyncApi.connection).mockResolvedValue(configured);
  mount(false);
  await screen.findByText(configured.host);
  expect(screen.getByRole('button', { name: 'Ulanishni tekshirish' })).toBeDisabled();
});

it('offers a retry when configuration fails to load', async () => {
  vi.mocked(hemisSyncApi.connection).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(configured);
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Sozlamalarni yuklab bo‘lmadi');
  fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));
  await waitFor(() => expect(screen.getByText(configured.host)).toBeInTheDocument());
});
