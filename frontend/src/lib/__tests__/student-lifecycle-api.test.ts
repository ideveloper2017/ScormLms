import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { createStudent, transitionStudent, validateLifecycleEvidence } from '../student-api';

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

  it('posts admission data together with its legal evidence', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { student: { id: 8 }, event: { id: 12 } } } as never);
    await createStudent({
      student: {
        pinfl: '12345678901234', lastName: 'Karimov', firstName: 'Ali', birthDate: '2000-01-01',
        gender: 'MALE', studentNumber: 'S-001',
      },
      ...evidence,
    });
    expect(api.post).toHaveBeenCalledWith('/students', expect.objectContaining({
      student: expect.objectContaining({ studentNumber: 'S-001' }),
      orderNumber: 'BUY-12/2025-17',
    }));
  });
});
