import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { admitStudent, bulkTransferStudents, changeStudentAccountAccess, createStudent, setupStudentCredentials, transitionStudent, updateStudentPersonalProfile, validateLifecycleEvidence } from '../student-api';

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const evidence = {
  orderNumber: 'BUY-12/2025-17',
  orderDate: '2025-09-01',
  effectiveDate: '2025-09-02',
  legalBasis: 'Talabalar harakati reglamentining 17-bandi',
  reason: "Talabaning yozma arizasi va komissiya qarori",
};

describe('decision 559 student lifecycle guards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires ordered dates and complete legal evidence', () => {
    expect(() => validateLifecycleEvidence(evidence)).not.toThrow();
    expect(() => validateLifecycleEvidence({ ...evidence, effectiveDate: '2025-08-31' })).toThrow("buyruq sanasidan oldin");
    expect(() => validateLifecycleEvidence({ ...evidence, legalBasis: 'yoq' })).toThrow('Huquqiy asos');
  });

  it('requires a target program only for transfer', async () => {
    await expect(transitionStudent(7, { ...evidence, eventType: 'TRANSFER' })).rejects.toThrow("yangi ta'lim dasturi");
    await expect(transitionStudent(7, { ...evidence, eventType: 'EXPULSION', targetProgramId: 4 })).rejects.toThrow('faqat TRANSFER');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('posts a complete immutable lifecycle command', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { student: { id: 7 }, event: { id: 11 } } } as never);
    await transitionStudent(7, { ...evidence, eventType: 'REINSTATEMENT' });
    expect(api.post).toHaveBeenCalledWith('/students/7/lifecycle', expect.objectContaining({
      eventType: 'REINSTATEMENT', orderNumber: 'BUY-12/2025-17',
    }));
  });

  it('creates a personal student card without academic admission data', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 8, studentStatus: 'REGISTERED' } } as never);
    await createStudent({
      pinfl: '12345678901234', lastName: 'Karimov', firstName: 'Ali', birthDate: '2000-01-01',
      gender: 'MALE', studentNumber: 'S-001',
    });
    expect(api.post).toHaveBeenCalledWith('/students', expect.objectContaining({ studentNumber: 'S-001' }));
    expect(api.post).not.toHaveBeenCalledWith('/students', expect.objectContaining({ orderNumber: expect.anything() }));
  });

  it('admits a registered student in a separate academic command', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { student: { id: 8 }, event: { id: 12 } } } as never);
    await admitStudent(8, {
      programId: 4, groupId: 9, degreeLevel: 'BACHELOR', educationForm: 'FULL_TIME',
      educationLanguage: 'uz', academicYear: '2025-2026', semesterNumber: 1, courseNumber: 1, ...evidence,
    });
    expect(api.post).toHaveBeenCalledWith('/students/8/admission', expect.objectContaining({
      programId: 4, groupId: 9, academicYear: '2025-2026', semesterNumber: 1, orderNumber: 'BUY-12/2025-17',
    }));
  });

  it('updates only the full personal profile endpoint', async () => {
    vi.mocked(api.put).mockResolvedValueOnce({ data: { id: 8, firstName: 'Alibek' } } as never);
    await updateStudentPersonalProfile(8, {
      firstName: 'Alibek', lastName: 'Karimov', middleName: null,
      phoneNumber: '+998901234567', passportType: 'ID_CARD', passportNumber: '1234567',
      currentRegion: 'Namangan', currentAddress: "Istiqlol ko'chasi",
    });
    expect(api.put).toHaveBeenCalledWith('/students/8/personal-profile', expect.objectContaining({
      firstName: 'Alibek', passportType: 'ID_CARD', currentRegion: 'Namangan',
    }));
  });

  it('changes account access through the separate audited command', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 8, accountStatus: 'BLOCKED' } } as never);
    await changeStudentAccountAccess(8, { enabled: false, reason: 'Axborot xavfsizligi murojaati' });
    expect(api.patch).toHaveBeenCalledWith('/students/8/account-access', {
      enabled: false, reason: 'Axborot xavfsizligi murojaati',
    });
    await expect(changeStudentAccountAccess(8, { enabled: true, reason: 'yoq' })).rejects.toThrow('5-500');
  });

  it('sets the first password only in the separate credential command', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { id: 8, credentialsInitialized: true } } as never);
    await setupStudentCredentials(8, { newPassword: 'Safe-Initial-2026!' });
    expect(api.patch).toHaveBeenCalledWith('/students/8/credentials', { newPassword: 'Safe-Initial-2026!' });
    await expect(setupStudentCredentials(8, { newPassword: 'short' })).rejects.toThrow('12 dan 128');
  });

  it('posts one atomic bulk transfer command for distinct students', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { processedCount: 2, items: [] } } as never);
    await bulkTransferStudents({
      studentIds: [8, 9], targetProgramId: 4, targetGroupId: 11, academicYear: '2025-2026', ...evidence,
    });
    expect(api.post).toHaveBeenCalledWith('/students/bulk-transfer', expect.objectContaining({
      studentIds: [8, 9], targetProgramId: 4, targetGroupId: 11, orderNumber: 'BUY-12/2025-17',
    }));
    await expect(bulkTransferStudents({ studentIds: [8], targetProgramId: 4, ...evidence })).rejects.toThrow('2-200');
    await expect(bulkTransferStudents({ studentIds: [8, 8], targetProgramId: 4, ...evidence })).rejects.toThrow('takroriy');
  });
});
