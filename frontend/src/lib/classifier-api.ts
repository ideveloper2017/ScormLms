import api from '@/lib/api';

export interface ClassifierItem {
  id: number;
  code: string;
  name: string;
  active: boolean;
  sortOrder: number;
  managedSource?: string | null;
  sourceCode?: string | null;
  sourceVersion?: string | null;
}

export interface DistrictClassifierItem extends ClassifierItem {
  regionId: number;
}

export interface ClassifierUpsertRequest { code: string; name: string; active: boolean; sortOrder: number }
export interface DistrictClassifierUpsertRequest extends ClassifierUpsertRequest { regionId: number }

export interface ClassifierDatasetSource {
  authority: string;
  title: string;
  version: string;
  url: string;
  sha256?: string | null;
}

export interface ClassifierImportRun {
  id: number;
  datasetVersion: string;
  manifestSha256: string;
  status: 'RUNNING' | 'COMPLETED';
  countriesTotal: number;
  regionsTotal: number;
  districtsTotal: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  deactivatedCount: number;
  startedAt: string;
  finishedAt?: string | null;
}

export interface ClassifierDatasetStatus {
  datasetId: string;
  datasetVersion: string;
  manifestSha256: string;
  countriesTotal: number;
  regionsTotal: number;
  districtsTotal: number;
  sources: ClassifierDatasetSource[];
  current: boolean;
  lastRun?: ClassifierImportRun | null;
}

export async function listCountries(): Promise<ClassifierItem[]> {
  return (await api.get<ClassifierItem[]>('/classifiers/countries')).data;
}

export async function listRegions(): Promise<ClassifierItem[]> {
  return (await api.get<ClassifierItem[]>('/classifiers/regions')).data;
}

export async function listDistricts(regionId: number): Promise<DistrictClassifierItem[]> {
  return (await api.get<DistrictClassifierItem[]>(`/classifiers/regions/${regionId}/districts`)).data;
}

export async function listAdminCountries(): Promise<ClassifierItem[]> { return (await api.get<ClassifierItem[]>('/classifiers/admin/countries')).data; }
export async function listAdminRegions(): Promise<ClassifierItem[]> { return (await api.get<ClassifierItem[]>('/classifiers/admin/regions')).data; }
export async function listAdminDistricts(regionId: number): Promise<DistrictClassifierItem[]> { return (await api.get<DistrictClassifierItem[]>(`/classifiers/admin/regions/${regionId}/districts`)).data; }
export async function getClassifierImportStatus(): Promise<ClassifierDatasetStatus> { return (await api.get<ClassifierDatasetStatus>('/classifiers/admin/import/status')).data; }
export async function importBundledClassifiers(): Promise<ClassifierDatasetStatus> { return (await api.post<ClassifierDatasetStatus>('/classifiers/admin/import/bundled')).data; }
export async function saveCountry(id: number | null, req: ClassifierUpsertRequest): Promise<ClassifierItem> {
  return id == null ? (await api.post<ClassifierItem>('/classifiers/admin/countries', req)).data : (await api.put<ClassifierItem>(`/classifiers/admin/countries/${id}`, req)).data;
}
export async function saveRegion(id: number | null, req: ClassifierUpsertRequest): Promise<ClassifierItem> {
  return id == null ? (await api.post<ClassifierItem>('/classifiers/admin/regions', req)).data : (await api.put<ClassifierItem>(`/classifiers/admin/regions/${id}`, req)).data;
}
export async function saveDistrict(id: number | null, req: DistrictClassifierUpsertRequest): Promise<DistrictClassifierItem> {
  return id == null ? (await api.post<DistrictClassifierItem>('/classifiers/admin/districts', req)).data : (await api.put<DistrictClassifierItem>(`/classifiers/admin/districts/${id}`, req)).data;
}
