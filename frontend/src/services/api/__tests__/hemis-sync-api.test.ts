import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { hemisSyncApi } from '../hemis-sync-api';

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

describe('hemisSyncApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads overview and starts a scoped run', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { success: true, data: { openConflicts: 0 } } } as never);
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: { id: 12 } } } as never);
    await hemisSyncApi.overview();
    await hemisSyncApi.start(501);
    expect(api.get).toHaveBeenCalledWith('/hemis/sync/overview');
    expect(api.post).toHaveBeenCalledWith('/hemis/sync/runs', { groupId: 501 });
  });

  it('updates mappings and resolves conflicts with an audit note', async () => {
    vi.mocked(api.put).mockResolvedValueOnce({ data: { success: true, data: { hemisGroupId: 501 } } } as never);
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true, data: { id: 7 } } } as never);
    await hemisSyncApi.updateMapping(501, 44);
    await hemisSyncApi.resolveConflict(7, 'HEMISdagi PINFL tuzatildi');
    expect(api.put).toHaveBeenCalledWith('/hemis/sync/mappings/501', { localGroupId: 44, active: true });
    expect(api.post).toHaveBeenCalledWith('/hemis/sync/conflicts/7/resolve', { note: 'HEMISdagi PINFL tuzatildi' });
  });
});
