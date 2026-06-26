import api from '@/lib/api';

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  uptime: number;
  avgResponseTime: number;
  dbConnections: number;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const monitorApi = {
  getSystemStats: async (): Promise<SystemStats> => {
    const res = await api.get<SystemStats>('/monitoring/stats');
    return res.data;
  },
  getAlerts: async (): Promise<SystemAlert[]> => {
    const res = await api.get<SystemAlert[]>('/monitoring/alerts');
    return res.data;
  },
};
