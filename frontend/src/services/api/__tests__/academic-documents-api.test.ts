import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import {
  confirmCallLetter, createCallLetter, createTranscript, deleteCallLetter, deleteTranscript,
  generateCallLetterPdf, generateTranscriptPdf, listCallLetters, listDocumentStudents, listTranscripts,
  updateCallLetter, updateTranscript,
} from "../academic-documents-api";

vi.mock("@/lib/api");

describe("academicDocumentsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("chaqiruv qog'ozi CRUD, tasdiq va PDF endpointlarini ishlatadi", async () => {
    const body = { studentId: 5, semester: 4, orderNumber: "17-A", orderDate: "2026-08-01", startDate: "2026-08-20", endDate: "2026-08-30" };
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({ data: new Blob(["pdf"]) });
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });
    await listDocumentStudents(); await listCallLetters(); await createCallLetter(body); await updateCallLetter(8, body);
    await confirmCallLetter(8); await generateCallLetterPdf(8); await deleteCallLetter(8);
    expect(api.get).toHaveBeenCalledWith("/academic-documents/students");
    expect(api.get).toHaveBeenCalledWith("/academic-documents/call-letters");
    expect(api.post).toHaveBeenCalledWith("/academic-documents/call-letters", body);
    expect(api.put).toHaveBeenCalledWith("/academic-documents/call-letters/8", body);
    expect(api.post).toHaveBeenCalledWith("/academic-documents/call-letters/8/confirm", undefined);
    expect(api.post).toHaveBeenCalledWith("/academic-documents/call-letters/8/generate", undefined, { responseType: "blob", timeout: 30_000 });
    expect(api.delete).toHaveBeenCalledWith("/academic-documents/call-letters/8");
  });

  it("transkript CRUD va PDF endpointlarini ishlatadi", async () => {
    const body = { studentId: 5, documentNumber: null, academicYear: "2025-2026", semester: 6 };
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockResolvedValue({ data: new Blob(["pdf"]) });
    vi.mocked(api.put).mockResolvedValue({ data: {} });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });
    await listTranscripts(); await createTranscript(body); await updateTranscript(3, body); await generateTranscriptPdf(3); await deleteTranscript(3);
    expect(api.get).toHaveBeenCalledWith("/academic-documents/transcripts");
    expect(api.post).toHaveBeenCalledWith("/academic-documents/transcripts", body);
    expect(api.put).toHaveBeenCalledWith("/academic-documents/transcripts/3", body);
    expect(api.post).toHaveBeenCalledWith("/academic-documents/transcripts/3/generate", undefined, { responseType: "blob", timeout: 30_000 });
    expect(api.delete).toHaveBeenCalledWith("/academic-documents/transcripts/3");
  });
});
