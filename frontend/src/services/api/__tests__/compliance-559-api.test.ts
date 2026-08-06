import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import {
  changeComplianceIssueStatus,
  createComplianceIssue,
  getComplianceIssues,
  getComplianceOwners,
  getDecision559Compliance,
  updateComplianceIssue,
} from '../compliance-559-api';

vi.mock('@/lib/api');

describe('559 compliance API', () => {
  beforeEach(() => vi.clearAllMocks());
  it('real evidence bilan summaryni qaytaradi', async () => {
    const summary = { decisionNumber: '559', decisionDate: '2022-10-03', generatedAt: '2026-08-06T00:00:00Z', overallStatus: 'WARNING', metrics: [], programs: [], requirements: [], evidence: [{ code: 'COURSES', label: 'Kurslar', recordCount: 3, unit: 'kurs', source: 'courses', status: 'COMPLIANT', measuredAt: '2026-08-06T00:00:00Z' }], violations: [] };
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: summary } });
    await expect(getDecision559Compliance()).resolves.toEqual(summary);
    expect(api.get).toHaveBeenCalledWith('/compliance/559/summary');
  });

  it('tuzatish vazifasi API oqimini yuboradi', async () => {
    const issue = { id: 7, violationCode: 'NO_DISTANCE_PROGRAM', status: 'OPEN' };
    const owner = { id: 2, name: "Mas'ul", username: 'owner' };
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { success: true, data: [issue] } })
      .mockResolvedValueOnce({ data: { success: true, data: [owner] } });
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: issue } });
    vi.mocked(api.put).mockResolvedValue({ data: { success: true, data: issue } });

    await expect(getComplianceIssues()).resolves.toEqual([issue]);
    await expect(getComplianceOwners()).resolves.toEqual([owner]);
    await createComplianceIssue({ violationCode: 'NO_DISTANCE_PROGRAM', ownerId: 2, dueDate: '2026-08-10', remediationPlan: 'Reja' });
    await updateComplianceIssue(7, { ownerId: 2, dueDate: '2026-08-11', remediationPlan: 'Yangi reja' });
    await changeComplianceIssueStatus(7, 'RESOLVED', 'Dalil');

    expect(api.post).toHaveBeenNthCalledWith(1, '/compliance/559/issues', expect.objectContaining({ ownerId: 2 }));
    expect(api.put).toHaveBeenCalledWith('/compliance/559/issues/7', expect.objectContaining({ remediationPlan: 'Yangi reja' }));
    expect(api.post).toHaveBeenNthCalledWith(2, '/compliance/559/issues/7/status', { status: 'RESOLVED', resolutionEvidence: 'Dalil' });
  });
});
