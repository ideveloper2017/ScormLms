// API response wrapper type definitions

// Yagona manba: lib/api.ts dagi CommonApiResponse ({ success, message?, data?, error? }).
export type { ApiResponse } from "@/lib/api";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}
