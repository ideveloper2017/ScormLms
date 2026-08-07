import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { createProgram, validateFullTimeCounterpartInput, validateProgramDurationInput } from '../academic-api';

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

describe('program duration compliance', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a distance duration shorter than the full-time norm', () => {
    expect(validateProgramDurationInput(true, 48, 36)).toContain("kam bo'lmasligi");
    expect(validateProgramDurationInput(true, 48, 48)).toBeNull();
    expect(validateProgramDurationInput(false, null, null)).toBeNull();
  });

  it('sends both normative durations when creating a distance program', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 7, name: 'Test' } } as never);
    await createProgram({
      name: 'Test', degreeLevel: 'BACHELOR', distanceEnabled: true,
      licenseReference: 'L-17', fullTimeDurationMonths: 48, distanceDurationMonths: 54,
      fullTimeAvailable: true, fullTimeBasisReference: 'BUYRUQ-3/2026',
    });
    expect(api.post).toHaveBeenCalledWith('/programs', expect.objectContaining({
      fullTimeDurationMonths: 48, distanceDurationMonths: 54,
      fullTimeAvailable: true, fullTimeBasisReference: 'BUYRUQ-3/2026',
    }));
  });

  it('requires a documented full-time counterpart for a non-ICT distance program', () => {
    expect(validateFullTimeCounterpartInput(true, false, false, null)).toContain('3-band');
    expect(validateFullTimeCounterpartInput(true, false, true, ' ')).toContain('rekviziti');
    expect(validateFullTimeCounterpartInput(true, false, true, 'BUYRUQ-3/2026')).toBeNull();
    expect(validateFullTimeCounterpartInput(true, true, false, null)).toBeNull();
  });
});
