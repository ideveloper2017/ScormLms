import api from "@/lib/api";
import { extractApiError } from "@/lib/academic-api";

export type UniversityLanguage = "EN" | "UZ_LATIN" | "KAA" | "RU" | "UZ_CYRILLIC";

export interface UniversityRecord {
  id: number;
  name: string;
  rector: string;
  address: string;
  defaultLanguage: UniversityLanguage;
  phone: string;
  bankDetails: string;
  chiefAccountant: string;
  legalCounsel: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type SaveUniversityRequest = Omit<UniversityRecord, "id" | "createdAt" | "updatedAt">;

export async function listUniversities(): Promise<UniversityRecord[]> {
  try {
    return (await api.get<UniversityRecord[]>("/universities")).data;
  } catch (error) {
    throw extractApiError(error, "Universitetlarni yuklab bo'lmadi");
  }
}

export async function createUniversity(request: SaveUniversityRequest): Promise<UniversityRecord> {
  try {
    return (await api.post<UniversityRecord>("/universities", request)).data;
  } catch (error) {
    throw extractApiError(error, "Universitetni yaratib bo'lmadi");
  }
}

export async function updateUniversity(id: number, request: SaveUniversityRequest): Promise<UniversityRecord> {
  try {
    return (await api.put<UniversityRecord>(`/universities/${id}`, request)).data;
  } catch (error) {
    throw extractApiError(error, "Universitetni yangilab bo'lmadi");
  }
}

export async function deleteUniversity(id: number): Promise<void> {
  try {
    await api.delete(`/universities/${id}`);
  } catch (error) {
    throw extractApiError(error, "Universitetni o'chirib bo'lmadi");
  }
}
