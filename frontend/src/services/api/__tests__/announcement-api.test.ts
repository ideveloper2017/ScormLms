import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { announcementApi } from '../announcement-api';

vi.mock('@/lib/api');

describe('announcementApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inbox va read endpointlarini chaqiradi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [] } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { id: 4 } } });
    await announcementApi.inbox();
    await announcementApi.markRead(4);
    expect(api.get).toHaveBeenCalledWith('/announcements/inbox');
    expect(api.post).toHaveBeenCalledWith('/announcements/4/read');
  });

  it('draft lifecycle va delivery report endpointlarini chaqiradi', async () => {
    const request = { title: 'Muhim e’lon', body: 'E’lon matni', audience: 'COURSE' as const, courseId: 2, category: 'INFORMATION' as const, priority: 'HIGH' as const, channels: ['IN_APP' as const] };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: [] } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { id: 8 } } });
    vi.mocked(api.put).mockResolvedValue({ data: { success: true, data: { id: 8 } } });
    await announcementApi.options();
    await announcementApi.manage();
    await announcementApi.create(request);
    await announcementApi.update(8, request);
    await announcementApi.publish(8);
    await announcementApi.archive(8);
    await announcementApi.deliveries(8);
    await announcementApi.retry(8);
    expect(api.get).toHaveBeenNthCalledWith(1, '/announcements/manage/options');
    expect(api.get).toHaveBeenNthCalledWith(2, '/announcements/manage');
    expect(api.post).toHaveBeenNthCalledWith(1, '/announcements', request);
    expect(api.put).toHaveBeenCalledWith('/announcements/8', request);
    expect(api.post).toHaveBeenNthCalledWith(2, '/announcements/8/publish');
    expect(api.post).toHaveBeenNthCalledWith(3, '/announcements/8/archive');
    expect(api.get).toHaveBeenNthCalledWith(3, '/announcements/8/deliveries');
    expect(api.post).toHaveBeenNthCalledWith(4, '/announcements/8/deliveries/retry');
  });
});
