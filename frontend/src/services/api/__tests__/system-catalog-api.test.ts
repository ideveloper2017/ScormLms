import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "@/lib/api";
import {
  createNationality,
  createReferenceLabel,
  createTranslationMessage,
  deleteNationality,
  deleteReferenceLabel,
  deleteTranslationMessage,
  listNationalities,
  listReferenceLabels,
  listSystemLanguages,
  listSystemSettings,
  listTranslationMessages,
  updateNationality,
  updateReferenceLabel,
  updateSystemSetting,
  updateTranslationMessage,
  type LocalizedValues,
} from "../system-catalog-api";

vi.mock("@/lib/api");

const translations: LocalizedValues = { uzLatin: "Nomi", uzCyrillic: "Номи", kaa: "Atı", ru: "Название", en: "Name" };

describe("systemCatalogApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("beshta katalog ro'yxatini to'g'ri endpointlardan yuklaydi", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await Promise.all([listReferenceLabels(), listNationalities(), listSystemSettings(), listSystemLanguages(), listTranslationMessages()]);

    expect(api.get).toHaveBeenCalledWith("/reference-data/labels");
    expect(api.get).toHaveBeenCalledWith("/reference-data/nationalities");
    expect(api.get).toHaveBeenCalledWith("/system-settings/configs");
    expect(api.get).toHaveBeenCalledWith("/system-settings/languages");
    expect(api.get).toHaveBeenCalledWith("/system-settings/translations");
  });

  it("yorliq yaratish, yangilash va o'chirishni APIga uzatadi", async () => {
    const body = { key: "name", label: "Nomi", moduleName: "crm", active: true, translations };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1, ...body } });
    vi.mocked(api.put).mockResolvedValue({ data: { id: 1, ...body } });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await createReferenceLabel(body);
    await updateReferenceLabel(1, body);
    await deleteReferenceLabel(1);

    expect(api.post).toHaveBeenCalledWith("/reference-data/labels", body);
    expect(api.put).toHaveBeenCalledWith("/reference-data/labels/1", body);
    expect(api.delete).toHaveBeenCalledWith("/reference-data/labels/1");
  });

  it("millat CRUD endpointlarini ishlatadi", async () => {
    const body = { name: "O'zbek", active: true, translations };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 2, ...body } });
    vi.mocked(api.put).mockResolvedValue({ data: { id: 2, ...body } });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await createNationality(body);
    await updateNationality(2, body);
    await deleteNationality(2);

    expect(api.post).toHaveBeenCalledWith("/reference-data/nationalities", body);
    expect(api.put).toHaveBeenCalledWith("/reference-data/nationalities/2", body);
    expect(api.delete).toHaveBeenCalledWith("/reference-data/nationalities/2");
  });

  it("sozlama faqat qiymat va holat bilan yangilanadi", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { id: 3, key: "grid-pagination-limit", value: "60", active: true } });

    await updateSystemSetting(3, { value: "60", active: true });

    expect(api.put).toHaveBeenCalledWith("/system-settings/configs/3", { value: "60", active: true });
  });

  it("tarjima CRUD endpointlarini ishlatadi", async () => {
    const body = { key: "Name", category: "CRM" as const, active: true, translations };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 4, message: "Nomi", ...body } });
    vi.mocked(api.put).mockResolvedValue({ data: { id: 4, message: "Nomi", ...body } });
    vi.mocked(api.delete).mockResolvedValue({ data: undefined });

    await createTranslationMessage(body);
    await updateTranslationMessage(4, body);
    await deleteTranslationMessage(4);

    expect(api.post).toHaveBeenCalledWith("/system-settings/translations", body);
    expect(api.put).toHaveBeenCalledWith("/system-settings/translations/4", body);
    expect(api.delete).toHaveBeenCalledWith("/system-settings/translations/4");
  });
});
