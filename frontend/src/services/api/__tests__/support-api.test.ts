import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { supportApi } from '../support-api';

vi.mock('@/lib/api');

describe('supportApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requester lifecycle endpointlarini chaqiradi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [] } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { ticket: { id: 7 } } } });
    const request = { subject: 'Kirish muammosi', description: "Tizimga kirishda yordam kerak", category: 'ACCESS' as const, impact: 'LIMITED' as const };
    await supportApi.mine();
    await supportApi.detail(7);
    await supportApi.create(request);
    await supportApi.comment(7, 'Izoh');
    await supportApi.cancel(7);
    await supportApi.reopen(7);
    expect(api.get).toHaveBeenNthCalledWith(1, '/support/tickets/my');
    expect(api.get).toHaveBeenNthCalledWith(2, '/support/tickets/7');
    expect(api.post).toHaveBeenNthCalledWith(1, '/support/tickets', request);
    expect(api.post).toHaveBeenNthCalledWith(2, '/support/tickets/7/comments', { body: 'Izoh', internal: false });
    expect(api.post).toHaveBeenNthCalledWith(3, '/support/tickets/7/cancel');
    expect(api.post).toHaveBeenNthCalledWith(4, '/support/tickets/7/reopen');
  });

  it('operator queue assignment status va SLA endpointlarini chaqiradi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [] } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { ticket: { id: 4 } } } });
    await supportApi.queue({ status: 'OPEN', breachedOnly: true });
    await supportApi.metrics();
    await supportApi.assignees();
    await supportApi.assign(4, 9);
    await supportApi.changeStatus(4, 'RESOLVED', 'Tuzatildi');
    expect(api.get).toHaveBeenNthCalledWith(1, '/support/queue', { params: { status: 'OPEN', breachedOnly: true } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/support/queue/metrics');
    expect(api.get).toHaveBeenNthCalledWith(3, '/support/assignees');
    expect(api.post).toHaveBeenNthCalledWith(1, '/support/tickets/4/assign', { assigneeId: 9 });
    expect(api.post).toHaveBeenNthCalledWith(2, '/support/tickets/4/status', { status: 'RESOLVED', resolutionSummary: 'Tuzatildi' });
  });
});
