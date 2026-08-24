import api from "@/lib/api";
import { extractApiError } from "@/lib/academic-api";

export interface DocumentStudent {
  id: number;
  fullName: string;
  studentNumber: string;
  educationForm: string;
  program: string;
  group: string;
  academicYear?: string | null;
  semester?: number | null;
}

export type CallLetterStatus = "DRAFT" | "GENERATED" | "CONFIRMED";

export interface CallLetterRecord {
  id: number;
  studentId: number;
  fullName: string;
  studentNumber: string;
  semester: number;
  documentNumber: string;
  orderNumber: string;
  orderDate: string;
  startDate: string;
  endDate: string;
  status: CallLetterStatus;
  generatedAt?: string | null;
  createdAt?: string | null;
}

export interface SaveCallLetterRequest {
  studentId: number;
  semester: number;
  orderNumber: string;
  orderDate: string;
  startDate: string;
  endDate: string;
}

export interface TranscriptRecord {
  id: number;
  studentId: number;
  fullName: string;
  studentNumber: string;
  educationForm: string;
  program: string;
  group: string;
  documentNumber: string;
  academicYear: string;
  semester: number;
  generatedAt?: string | null;
  createdAt?: string | null;
}

export interface SaveTranscriptRequest {
  studentId: number;
  documentNumber?: string | null;
  academicYear: string;
  semester: number;
}

async function get<T>(path: string, fallback: string): Promise<T> {
  try { return (await api.get<T>(path)).data; }
  catch (error) { throw extractApiError(error, fallback); }
}

async function post<T, B>(path: string, body: B, fallback: string): Promise<T> {
  try { return (await api.post<T>(path, body)).data; }
  catch (error) { throw extractApiError(error, fallback); }
}

async function put<T, B>(path: string, body: B, fallback: string): Promise<T> {
  try { return (await api.put<T>(path, body)).data; }
  catch (error) { throw extractApiError(error, fallback); }
}

async function remove(path: string, fallback: string): Promise<void> {
  try { await api.delete(path); }
  catch (error) { throw extractApiError(error, fallback); }
}

async function pdf(path: string, fallback: string): Promise<Blob> {
  try { return (await api.post<Blob>(path, undefined, { responseType: "blob", timeout: 30_000 })).data; }
  catch (error) { throw extractApiError(error, fallback); }
}

export const listDocumentStudents = () => get<DocumentStudent[]>("/academic-documents/students", "Talabalarni yuklab bo'lmadi");

export const listCallLetters = () => get<CallLetterRecord[]>("/academic-documents/call-letters", "Chaqiruv qog'ozlarini yuklab bo'lmadi");
export const createCallLetter = (body: SaveCallLetterRequest) => post<CallLetterRecord, SaveCallLetterRequest>("/academic-documents/call-letters", body, "Chaqiruv qog'ozini yaratib bo'lmadi");
export const updateCallLetter = (id: number, body: SaveCallLetterRequest) => put<CallLetterRecord, SaveCallLetterRequest>(`/academic-documents/call-letters/${id}`, body, "Chaqiruv qog'ozini yangilab bo'lmadi");
export const deleteCallLetter = (id: number) => remove(`/academic-documents/call-letters/${id}`, "Chaqiruv qog'ozini o'chirib bo'lmadi");
export const confirmCallLetter = (id: number) => post<CallLetterRecord, undefined>(`/academic-documents/call-letters/${id}/confirm`, undefined, "Chaqiruv qog'ozini tasdiqlab bo'lmadi");
export const generateCallLetterPdf = (id: number) => pdf(`/academic-documents/call-letters/${id}/generate`, "Chaqiruv PDF faylini yaratib bo'lmadi");

export const listTranscripts = () => get<TranscriptRecord[]>("/academic-documents/transcripts", "Transkriptlarni yuklab bo'lmadi");
export const createTranscript = (body: SaveTranscriptRequest) => post<TranscriptRecord, SaveTranscriptRequest>("/academic-documents/transcripts", body, "Transkriptni yaratib bo'lmadi");
export const updateTranscript = (id: number, body: SaveTranscriptRequest) => put<TranscriptRecord, SaveTranscriptRequest>(`/academic-documents/transcripts/${id}`, body, "Transkriptni yangilab bo'lmadi");
export const deleteTranscript = (id: number) => remove(`/academic-documents/transcripts/${id}`, "Transkriptni o'chirib bo'lmadi");
export const generateTranscriptPdf = (id: number) => pdf(`/academic-documents/transcripts/${id}/generate`, "Transkript PDF faylini yaratib bo'lmadi");
