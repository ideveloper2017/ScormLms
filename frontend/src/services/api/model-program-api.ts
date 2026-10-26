import api from "@/lib/api";
import type { SyllabusLanguage } from "@/services/api/syllabus-api";

/** O'quv dasturi (namunaviy) — fan bo'yicha umumiy; undan o'quv yili va semestr uchun fan dasturlari yaratiladi. */
export interface ModelProgram {
  id: number;
  subjectId: number;
  subjectCode?: string | null;
  subjectName: string;
  subjectCredits?: number | null;
  language: SyllabusLanguage;
  name: string;
  shortDescription: string;
  requirements?: string | null;
  fullDescription: string;
  active: boolean;
  workProgramCount: number;
}

export interface ModelProgramInput {
  subjectId: number;
  language: SyllabusLanguage;
  shortDescription: string;
  requirements?: string | null;
  fullDescription: string;
  active: boolean;
}

export const modelProgramApi = {
  list: async () => (await api.get<ModelProgram[]>("/model-programs")).data,
  create: async (input: ModelProgramInput) => (await api.post<ModelProgram>("/model-programs", input)).data,
  update: async (id: number, input: ModelProgramInput) => (await api.put<ModelProgram>(`/model-programs/${id}`, input)).data,
  delete: async (id: number) => { await api.delete(`/model-programs/${id}`); },
};
