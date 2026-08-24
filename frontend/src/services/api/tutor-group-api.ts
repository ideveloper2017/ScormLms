import api from "@/lib/api";
import { extractApiError } from "@/lib/academic-api";

export interface TutorGroupRecord {
  id: number; name: string; code: string; facultyId?: number | null; facultyName?: string | null;
  tutorId?: number | null; tutorName?: string | null; nameUz?: string | null; nameRu?: string | null;
  nameEn?: string | null; active: boolean;
}
export type SaveTutorGroupRequest = Omit<TutorGroupRecord, "id" | "facultyName" | "tutorName">;
export interface IdNameOption { id: number; name: string }
export interface TutorGroupOptions { faculties: IdNameOption[]; tutors: IdNameOption[] }

async function fail(error: unknown, fallback: string): Promise<never> { throw extractApiError(error, fallback); }
export async function listTutorGroups(): Promise<TutorGroupRecord[]> { try { return (await api.get<TutorGroupRecord[]>("/tutor-groups")).data; } catch (error) { return fail(error, "Tutor guruhlarini yuklab bo'lmadi"); } }
export async function getTutorGroupOptions(): Promise<TutorGroupOptions> { try { return (await api.get<TutorGroupOptions>("/tutor-groups/options")).data; } catch (error) { return fail(error, "Tutor guruhi parametrlarini yuklab bo'lmadi"); } }
export async function createTutorGroup(body: SaveTutorGroupRequest): Promise<TutorGroupRecord> { try { return (await api.post<TutorGroupRecord>("/tutor-groups", body)).data; } catch (error) { return fail(error, "Tutor guruhini yaratib bo'lmadi"); } }
export async function updateTutorGroup(id: number, body: SaveTutorGroupRequest): Promise<TutorGroupRecord> { try { return (await api.put<TutorGroupRecord>(`/tutor-groups/${id}`, body)).data; } catch (error) { return fail(error, "Tutor guruhini yangilab bo'lmadi"); } }
export async function deleteTutorGroup(id: number): Promise<void> { try { await api.delete(`/tutor-groups/${id}`); } catch (error) { return fail(error, "Tutor guruhini o'chirib bo'lmadi"); } }
