import api from "@/lib/api";
import { extractApiError } from "@/lib/academic-api";

export interface LocalizedValues {
  uzLatin: string;
  uzCyrillic: string;
  kaa: string;
  ru: string;
  en: string;
}

export interface ReferenceLabelRecord {
  id: number;
  key: string;
  label: string;
  moduleName: string;
  active: boolean;
  translations: LocalizedValues;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type SaveReferenceLabelRequest = Omit<ReferenceLabelRecord, "id" | "createdAt" | "updatedAt">;

export interface NationalityRecord {
  id: number;
  name: string;
  active: boolean;
  translations: LocalizedValues;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type SaveNationalityRequest = Omit<NationalityRecord, "id" | "createdAt" | "updatedAt">;

export interface SystemLanguageRecord {
  id: number;
  code: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

export interface SystemSettingRecord {
  id: number;
  key: string;
  value: string;
  active: boolean;
  updatedAt?: string | null;
}

export interface UpdateSystemSettingRequest {
  value: string;
  active: boolean;
}

export type TranslationCategory = "CRM" | "CABINET";

export interface TranslationMessageRecord {
  id: number;
  key: string;
  category: TranslationCategory;
  message: string;
  active: boolean;
  translations: LocalizedValues;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type SaveTranslationMessageRequest = Omit<TranslationMessageRecord, "id" | "message" | "createdAt" | "updatedAt">;

async function loadList<T>(path: string, fallback: string): Promise<T[]> {
  try {
    return (await api.get<T[]>(path)).data;
  } catch (error) {
    throw extractApiError(error, fallback);
  }
}

async function create<T, B>(path: string, body: B, fallback: string): Promise<T> {
  try {
    return (await api.post<T>(path, body)).data;
  } catch (error) {
    throw extractApiError(error, fallback);
  }
}

async function update<T, B>(path: string, body: B, fallback: string): Promise<T> {
  try {
    return (await api.put<T>(path, body)).data;
  } catch (error) {
    throw extractApiError(error, fallback);
  }
}

async function remove(path: string, fallback: string): Promise<void> {
  try {
    await api.delete(path);
  } catch (error) {
    throw extractApiError(error, fallback);
  }
}

export const listReferenceLabels = () => loadList<ReferenceLabelRecord>("/reference-data/labels", "Yorliqlarni yuklab bo'lmadi");
export const createReferenceLabel = (body: SaveReferenceLabelRequest) => create<ReferenceLabelRecord, SaveReferenceLabelRequest>("/reference-data/labels", body, "Yorliqni yaratib bo'lmadi");
export const updateReferenceLabel = (id: number, body: SaveReferenceLabelRequest) => update<ReferenceLabelRecord, SaveReferenceLabelRequest>(`/reference-data/labels/${id}`, body, "Yorliqni yangilab bo'lmadi");
export const deleteReferenceLabel = (id: number) => remove(`/reference-data/labels/${id}`, "Yorliqni o'chirib bo'lmadi");

export const listNationalities = () => loadList<NationalityRecord>("/reference-data/nationalities", "Millatlarni yuklab bo'lmadi");
export const createNationality = (body: SaveNationalityRequest) => create<NationalityRecord, SaveNationalityRequest>("/reference-data/nationalities", body, "Millatni yaratib bo'lmadi");
export const updateNationality = (id: number, body: SaveNationalityRequest) => update<NationalityRecord, SaveNationalityRequest>(`/reference-data/nationalities/${id}`, body, "Millatni yangilab bo'lmadi");
export const deleteNationality = (id: number) => remove(`/reference-data/nationalities/${id}`, "Millatni o'chirib bo'lmadi");

export const listSystemSettings = () => loadList<SystemSettingRecord>("/system-settings/configs", "Sozlamalarni yuklab bo'lmadi");
export const updateSystemSetting = (id: number, body: UpdateSystemSettingRequest) => update<SystemSettingRecord, UpdateSystemSettingRequest>(`/system-settings/configs/${id}`, body, "Sozlamani yangilab bo'lmadi");
export const listSystemLanguages = () => loadList<SystemLanguageRecord>("/system-settings/languages", "Tillarni yuklab bo'lmadi");

export const listTranslationMessages = () => loadList<TranslationMessageRecord>("/system-settings/translations", "Tarjimalarni yuklab bo'lmadi");
export const createTranslationMessage = (body: SaveTranslationMessageRequest) => create<TranslationMessageRecord, SaveTranslationMessageRequest>("/system-settings/translations", body, "Tarjimani yaratib bo'lmadi");
export const updateTranslationMessage = (id: number, body: SaveTranslationMessageRequest) => update<TranslationMessageRecord, SaveTranslationMessageRequest>(`/system-settings/translations/${id}`, body, "Tarjimani yangilab bo'lmadi");
export const deleteTranslationMessage = (id: number) => remove(`/system-settings/translations/${id}`, "Tarjimani o'chirib bo'lmadi");
