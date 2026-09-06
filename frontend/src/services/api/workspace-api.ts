import api from '@/lib/api';

export interface WorkspaceItem { id: string; title: string; detail: string; kind: string; url: string; dueAt?: string }
export interface SetupStep { title: string; done: boolean; url: string }
export const workspaceApi = {
  search: async (q: string) => (await api.get<{ data: WorkspaceItem[] }>('/workspace/search', { params: { q } })).data.data,
  tasks: async () => (await api.get<{ data: WorkspaceItem[] }>('/workspace/tasks')).data.data,
  resume: async () => (await api.get<{ data: WorkspaceItem | null }>('/workspace/resume')).data.data,
  viewed: async (courseId: number, contentId: number) => { await api.post(`/workspace/courses/${courseId}/contents/${contentId}/view`); },
  setup: async () => (await api.get<{ data: SetupStep[] }>('/workspace/setup')).data.data,
};
