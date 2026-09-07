import api from '@/lib/api';

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'link' | 'document' | 'image' | 'archive' | 'text';
  course?: string;
  courseId?: string;
  size?: number;
  url: string;
  uploadedAt: string;
  downloadCount?: number;
  tags?: string[];
  contentId?: number;
  fileName?: string | null;
  externalUrl?: string | null;
}

export interface ResourceCategory {
  id: string;
  name: string;
  count: number;
}

export const resourcesApi = {
  getResources: async (courseId?: string, student = true): Promise<Resource[]> => {
    const res = await api.get<Resource[]>(student ? '/students/me/resources' : '/resources', {
      params: courseId ? { courseId } : undefined,
    });
    return res.data;
  },
  getCategories: async (): Promise<ResourceCategory[]> => {
    const res = await api.get<ResourceCategory[]>('/students/me/resources/categories');
    return res.data;
  },
};
