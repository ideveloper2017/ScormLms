import api, { type ApiResponse } from '@/lib/api';

export type HemisRunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';

export interface HemisSyncRun {
  id: number; trigger: 'MANUAL' | 'SCHEDULED'; status: HemisRunStatus; scopeGroupId?: number | null;
  recordsSeen: number; created: number; updated: number; unchanged: number; conflicts: number; errors: number;
  groupsTotal: number; groupsProcessed: number; checkpointGroupId?: number | null; checkpointOffset: number;
  startedAt?: string | null; finishedAt?: string | null; lastErrorCode?: string | null; canResume: boolean;
}

export interface HemisSyncOverview {
  periodicEnabled: boolean; asyncEnabled: boolean; pageSize: number; cron: string;
  currentRun?: HemisSyncRun | null; lastRun?: HemisSyncRun | null; openConflicts: number;
  mappingsTotal: number; mappingsReady: number; credentialsConfigured: boolean; canManage: boolean;
}

export interface HemisGroupMapping {
  hemisGroupId: number; hemisGroupName: string; localGroupId?: number | null; localGroupName?: string | null;
  active: boolean; lastSeenAt: string; mappedAt?: string | null;
}

export interface HemisLocalGroup { id: number; name: string; programName?: string | null }

export interface HemisConflict {
  id: number; runId: number; studentNumberMasked: string; code: string; fieldName?: string | null;
  localValueMasked?: string | null; sourceValueMasked?: string | null; status: 'OPEN' | 'RESOLVED';
  resolutionNote?: string | null; createdAt?: string | null; canResolve: boolean;
}

function dataOf<T>(response: { data: ApiResponse<T> }, fallback: string): T {
  if (!response.data.success || response.data.data == null) throw new Error(response.data.message ?? fallback);
  return response.data.data;
}

export const hemisSyncApi = {
  overview: async () => dataOf(await api.get<ApiResponse<HemisSyncOverview>>('/hemis/sync/overview'), "HEMIS holatini yuklab bo'lmadi"),
  runs: async () => dataOf(await api.get<ApiResponse<HemisSyncRun[]>>('/hemis/sync/runs'), "HEMIS runlarini yuklab bo'lmadi"),
  start: async (groupId?: number) => dataOf(await api.post<ApiResponse<HemisSyncRun>>('/hemis/sync/runs', groupId ? { groupId } : {}), "HEMIS syncni boshlashning iloji bo'lmadi"),
  resume: async (id: number) => dataOf(await api.post<ApiResponse<HemisSyncRun>>(`/hemis/sync/runs/${id}/resume`), "HEMIS syncni davom ettirib bo'lmadi"),
  mappings: async () => dataOf(await api.get<ApiResponse<HemisGroupMapping[]>>('/hemis/sync/mappings'), "HEMIS mappinglarini yuklab bo'lmadi"),
  refreshMappings: async () => dataOf(await api.post<ApiResponse<HemisGroupMapping[]>>('/hemis/sync/mappings/refresh'), "HEMIS guruhlarini yangilab bo'lmadi"),
  localGroups: async () => dataOf(await api.get<ApiResponse<HemisLocalGroup[]>>('/hemis/sync/local-groups'), "Lokal guruhlarni yuklab bo'lmadi"),
  updateMapping: async (hemisGroupId: number, localGroupId: number | null, active = true) => dataOf(
    await api.put<ApiResponse<HemisGroupMapping>>(`/hemis/sync/mappings/${hemisGroupId}`, { localGroupId, active }),
    "Guruh mappingini saqlab bo'lmadi",
  ),
  conflicts: async () => dataOf(await api.get<ApiResponse<HemisConflict[]>>('/hemis/sync/conflicts'), "HEMIS konfliktlarini yuklab bo'lmadi"),
  resolveConflict: async (id: number, note: string) => dataOf(await api.post<ApiResponse<HemisConflict>>(`/hemis/sync/conflicts/${id}/resolve`, { note }), "Konfliktni yopib bo'lmadi"),
};
