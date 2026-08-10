import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/api';
import { getClassifierImportStatus, importBundledClassifiers, listCountries, listDistricts, listRegions } from '../classifier-api';

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

describe('student geography classifier api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads citizenship countries and regions from managed catalogs', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [{ id: 1, code: 'UZ', name: "O'zbekiston", active: true, sortOrder: 1 }] } as never)
      .mockResolvedValueOnce({ data: [{ id: 7, code: 'UZ-NG', name: 'Namangan viloyati', active: true, sortOrder: 7 }] } as never);

    expect((await listCountries())[0].code).toBe('UZ');
    expect((await listRegions())[0].code).toBe('UZ-NG');
    expect(api.get).toHaveBeenNthCalledWith(1, '/classifiers/countries');
    expect(api.get).toHaveBeenNthCalledWith(2, '/classifiers/regions');
  });

  it('loads districts only inside the selected region', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: [{ id: 70, regionId: 7, code: 'UZ-NG-NAM', name: 'Namangan shahri' }] } as never);
    const result = await listDistricts(7);
    expect(result[0].regionId).toBe(7);
    expect(api.get).toHaveBeenCalledWith('/classifiers/regions/7/districts');
  });

  it('loads status and starts only the bundled classifier import', async () => {
    const status = { datasetId: 'GEOGRAPHY_UZ_V64', current: false, countriesTotal: 249, regionsTotal: 14, districtsTotal: 206 };
    vi.mocked(api.get).mockResolvedValueOnce({ data: status } as never);
    vi.mocked(api.post).mockResolvedValueOnce({ data: { ...status, current: true } } as never);

    expect((await getClassifierImportStatus()).countriesTotal).toBe(249);
    expect((await importBundledClassifiers()).current).toBe(true);
    expect(api.get).toHaveBeenCalledWith('/classifiers/admin/import/status');
    expect(api.post).toHaveBeenCalledWith('/classifiers/admin/import/bundled');
  });
});
