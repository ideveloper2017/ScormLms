import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { attestationApi } from '../attestation-api';

vi.mock('@/lib/api');

describe('state attestation API', () => {
  beforeEach(() => vi.clearAllMocks());
  it('sessiyani yaratadi', async () => {
    const payload = { courseId: 2, title: 'DAK', examDate: '2026-08-06', examTime: '09:00', location: 'Zal', commissionChairId: 4, defenseType: 'BACHELOR' as const, minCommissionMembers: 3, minPassScore: 60 };
    vi.mocked(api.post).mockResolvedValue({ data: { id: '7' } });
    await attestationApi.create(payload);
    expect(api.post).toHaveBeenCalledWith('/attestation-sessions', payload);
  });
  it('komissiya bahosini serverga yuboradi', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    await attestationApi.grade('9', 82, 'Himoya yaxshi');
    expect(api.post).toHaveBeenCalledWith('/defenses/9/grade', { score: 82, comments: 'Himoya yaxshi' });
  });
  it('shaxsan himoya tasdigini serverga yuboradi', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    await attestationApi.recordDefense({ id: '9', onsiteAttendanceConfirmed: true });
    expect(api.post).toHaveBeenCalledWith('/defenses/9/record', {
      defenseStatus: 'DEFENDED', onsiteAttendanceConfirmed: true,
    });
  });
  it('rasmiy protokol yaratadi', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: '12', protocolNumber: 'DAK-2026-X' } });
    await attestationApi.generateProtocol('7');
    expect(api.post).toHaveBeenCalledWith('/attestation-sessions/7/protocol');
  });
  it('talaba attestatsiya va sertifikatlarini me endpointdan oladi', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await attestationApi.studentList();
    await attestationApi.studentCertificates();
    expect(api.get).toHaveBeenNthCalledWith(1, '/students/me/attestations');
    expect(api.get).toHaveBeenNthCalledWith(2, '/students/me/attestations/certificates');
  });
});
