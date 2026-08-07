import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { integrationApi } from '../integration-api';

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe('integrationApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads metrics, queue and immutable attempt detail', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { success: true, data: { total: 0 } } } as never)
      .mockResolvedValueOnce({ data: { success: true, data: [] } } as never)
      .mockResolvedValueOnce({ data: { success: true, data: { event: { id: 7 }, attempts: [] } } } as never);

    await integrationApi.metrics();
    await integrationApi.events({ status: 'FAILED', errorOnly: true });
    await integrationApi.detail(7);

    expect(api.get).toHaveBeenNthCalledWith(1, '/integrations/metrics');
    expect(api.get).toHaveBeenNthCalledWith(2, '/integrations/events', { params: { status: 'FAILED', errorOnly: true } });
    expect(api.get).toHaveBeenNthCalledWith(3, '/integrations/events/7');
  });

  it('runs due worker and requeues a dead-letter event', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { success: true, data: { selected: 2 } } } as never)
      .mockResolvedValueOnce({ data: { success: true, data: { id: 9 } } } as never);

    await integrationApi.processDue(25);
    await integrationApi.retry(9);

    expect(api.post).toHaveBeenNthCalledWith(1, '/integrations/process-due', undefined, { params: { limit: 25 } });
    expect(api.post).toHaveBeenNthCalledWith(2, '/integrations/events/9/retry');
  });
});
