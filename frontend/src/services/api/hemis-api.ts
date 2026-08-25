import api from "@/lib/api";
import type { ApiResponse } from "@/lib/api";

// ── Tiplari ───────────────────────────────────────────────────────────────────

export interface HemisGroup {
  id: number;
  name: string;
  studentsCount: number | null;
}

export interface HemisStudentPreview {
  hemisId: number;
  studentNumber: string;
  fullName: string;
  birthDate: string | null;
  email: string | null;
  faculty: string;
  group: string;
  specialty: string;
  educationLang: string;
  alreadyExists: boolean;
}

export interface HemisImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// ── API ───────────────────────────────────────────────────────────────────────

export const hemisApi = {
  /**
   * HEMIS guruhlar ro'yxati (admin uchun)
   * GET /api/v1/hemis/groups
   */
  getGroups: async (): Promise<HemisGroup[]> => {
    const res = await api.get<ApiResponse<HemisGroup[]>>("/hemis/groups");
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Guruhlarni olishda xatolik");
    }
    return res.data.data;
  },

  /**
   * Guruh bo'yicha talabalar (preview)
   * GET /api/v1/hemis/students?groupId=XXX
   */
  previewStudents: async (groupId: number): Promise<HemisStudentPreview[]> => {
    const res = await api.get<ApiResponse<HemisStudentPreview[]>>("/hemis/students", {
      params: { groupId },
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Talabalarni olishda xatolik");
    }
    return res.data.data;
  },

  /**
   * Guruh talabalarini import qilish
   * POST /api/v1/hemis/import
   */
  importStudents: async (
    groupId: number,
    studentNumbers?: string[],
  ): Promise<HemisImportResult> => {
    const res = await api.post<ApiResponse<HemisImportResult>>("/hemis/import", {
      groupId,
      studentNumbers: studentNumbers ?? null,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Import qilishda xatolik");
    }
    return res.data.data;
  },
};
