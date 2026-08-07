import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import { DECISION_559_SOURCE_SHA256, decision559UatApi } from "../decision-559-uat-api";

vi.mock("@/lib/api");

describe("559 UAT acceptance API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("27 band dalil-intake yo'riqnomasini yuklaydi", async () => {
    const requirements = [{ id: "UAT-559-08", band: 8, baselineStatus: "PARTIAL" }];
    vi.mocked(api.get).mockResolvedValue({ data: { success: true, data: requirements } });
    await expect(decision559UatApi.requirements()).resolves.toEqual(requirements);
    expect(api.get).toHaveBeenCalledWith("/compliance/559/uat/requirements");
  });

  it("run yaratishda tasdiqlangan PDF hashini yuboradi", async () => {
    const run = { id: 9, title: "Qabul", status: "DRAFT" };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: run } });
    await expect(decision559UatApi.create("Qabul")).resolves.toEqual(run);
    expect(api.post).toHaveBeenCalledWith("/compliance/559/uat/runs", {
      title: "Qabul",
      sourceSha256: DECISION_559_SOURCE_SHA256,
    });
  });

  it("band dalilini server kutgan multipart maydonlari bilan yuboradi", async () => {
    const evidence = { id: 4, band: 21 };
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: evidence } });
    await decision559UatApi.saveEvidence(9, {
      band: 21,
      outcome: "MANUAL_PASS",
      ownerName: "Komissiya",
      summary: "Xorijiy talaba istisnosi dalili",
      evidenceReference: "PROT-21",
      files: [
        new File(["%PDF-1.4"], "evidence.pdf", { type: "application/pdf" }),
        new File(["png"], "photo.png", { type: "image/png" }),
      ],
    });
    const [url, form, config] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/compliance/559/uat/runs/9/evidence");
    expect((form as FormData).get("requirementId")).toBe("UAT-559-21");
    expect((form as FormData).get("outcome")).toBe("MANUAL_PASS");
    expect((form as FormData).getAll("files")).toHaveLength(2);
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
  });

  it("mustaqil review va yakuniy approve endpointlarini chaqiradi", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { id: 1 } } });
    await decision559UatApi.reviewEvidence(4, "ACCEPTED", "Tekshirildi");
    await decision559UatApi.approve(9);
    expect(api.post).toHaveBeenNthCalledWith(1, "/compliance/559/uat/evidence/4/review", { status: "ACCEPTED", notes: "Tekshirildi" });
    expect(api.post).toHaveBeenNthCalledWith(2, "/compliance/559/uat/runs/9/approve");
  });

  it("protokolni joriy evidence-set SHA bilan multipart yuboradi", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { id: 9 } } });
    const evidenceSetSha256 = "d".repeat(64);
    await decision559UatApi.uploadProtocol(9, {
      protocolNumber: "UAT-559/1",
      signedDate: "2026-08-07",
      signatories: "Rais; metodist; xavfsizlik",
      evidenceSetSha256,
      file: new File(["%PDF-1.4"], "signed.pdf", { type: "application/pdf" }),
    });
    const [url, form, config] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/compliance/559/uat/runs/9/protocol");
    expect((form as FormData).get("evidenceSetSha256")).toBe(evidenceSetSha256);
    expect((form as FormData).get("file")).toBeInstanceOf(File);
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
  });

  it("runtime manifestni attachment nomi va SHA-256 bilan qaytaradi", async () => {
    const blob = new Blob(["{\"schemaVersion\":2}"], { type: "application/json" });
    vi.mocked(api.get).mockResolvedValue({
      data: blob,
      headers: {
        "content-disposition": "attachment; filename=decision-559-uat-run-9-manifest.json",
        "x-content-sha256": "a".repeat(64),
      },
    });
    const file = await decision559UatApi.manifestFile(9);
    expect(api.get).toHaveBeenCalledWith("/compliance/559/uat/runs/9/manifest", { responseType: "blob" });
    expect(file.originalName).toBe("decision-559-uat-run-9-manifest.json");
    expect(file.sha256).toBe("a".repeat(64));
  });

  it("imzolash uchun snapshotga bog'langan protokol loyihasini yuklaydi", async () => {
    const blob = new Blob(["<!doctype html>"], { type: "text/html" });
    vi.mocked(api.get).mockResolvedValue({
      data: blob,
      headers: {
        "content-disposition": "attachment; filename=decision-559-uat-run-9-protocol-draft.html",
        "x-content-sha256": "e".repeat(64),
      },
    });
    const file = await decision559UatApi.protocolDraft(9);
    expect(api.get).toHaveBeenCalledWith("/compliance/559/uat/runs/9/protocol/draft", { responseType: "blob" });
    expect(file.originalName).toBe("decision-559-uat-run-9-protocol-draft.html");
    expect(file.sha256).toBe("e".repeat(64));
  });

  it("yakuniy acceptance bundle ZIPni detached SHA-256 bilan qaytaradi", async () => {
    const blob = new Blob(["PK\u0003\u0004"], { type: "application/zip" });
    vi.mocked(api.get).mockResolvedValue({
      data: blob,
      headers: {
        "content-disposition": "attachment; filename=decision-559-uat-run-9-acceptance-bundle.zip",
        "x-content-sha256": "b".repeat(64),
      },
    });
    const file = await decision559UatApi.acceptanceBundle(9);
    expect(api.get).toHaveBeenCalledWith("/compliance/559/uat/runs/9/bundle", { responseType: "blob" });
    expect(file.originalName).toBe("decision-559-uat-run-9-acceptance-bundle.zip");
    expect(file.sha256).toBe("b".repeat(64));
  });

  it("alohida attachmentni yuklaydi va tahrirlanadigan dalildan olib tashlaydi", async () => {
    const blob = new Blob(["%PDF-1.4"], { type: "application/pdf" });
    vi.mocked(api.get).mockResolvedValue({
      data: blob,
      headers: {
        "content-disposition": "attachment; filename=evidence.pdf",
        "x-content-sha256": "c".repeat(64),
      },
    });
    vi.mocked(api.delete).mockResolvedValue({
      data: { success: true, data: { id: 4, files: [] } },
    });

    const file = await decision559UatApi.evidenceAttachmentFile(81);
    const evidence = await decision559UatApi.deleteEvidenceAttachment(81);

    expect(api.get).toHaveBeenCalledWith("/compliance/559/uat/evidence/files/81", { responseType: "blob" });
    expect(file.originalName).toBe("evidence.pdf");
    expect(file.sha256).toBe("c".repeat(64));
    expect(api.delete).toHaveBeenCalledWith("/compliance/559/uat/evidence/files/81");
    expect(evidence).toEqual({ id: 4, files: [] });
  });
});
