import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LessonContentSheet } from "@/components/admin/syllabus-lesson-content";
import { syllabusApi } from "@/services/api/syllabus-api";
import type { SubjectMaterial } from "@/services/api/teacher-portal-api";

vi.mock("@/services/api/syllabus-api", async (importOriginal) => ({
  ...await importOriginal<object>(),
  syllabusApi: {
    lessonMaterials: vi.fn(), createLessonMaterial: vi.fn(), updateLessonMaterial: vi.fn(),
    reorderLessonMaterials: vi.fn(), deleteLessonMaterial: vi.fn(), uploadLessonAsset: vi.fn(),
    lessonQuizzes: vi.fn(),
  },
}));
const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

const material = (id: number, title: string, contentType: SubjectMaterial["contentType"], extra: Partial<SubjectMaterial> = {}): SubjectMaterial => ({
  id, subjectId: 7, subjectName: "Fizika", title, contentType, languageCode: "uz", authorName: "Kafedra",
  contentVersion: "1.0", sourceName: "Fizika", ...extra,
});
const lesson = { id: 11, title: "Kinematika", type: "THEORETICAL" as const, moduleName: "Mexanika" };
const mount = (editable = true, onChanged = vi.fn()) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <LessonContentSheet syllabusId={40} lesson={lesson} editable={editable} onClose={vi.fn()} onChanged={onChanged} />
  </QueryClientProvider>,
);

// Sheet (portal) va bir necha so'rov — to'liq yugurish yuklamasida 5 soniyadan oshishi mumkin
describe("LessonContentSheet", { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(syllabusApi.lessonQuizzes).mockResolvedValue([]);
  });

  it("darsga video qo'shadi va bog'langan qoralama kursga tushganini aytadi", async () => {
    vi.mocked(syllabusApi.lessonMaterials).mockResolvedValue([material(1, "Ma'ruza matni", "text", { contentBody: "<p>Tezlik</p>" })]);
    vi.mocked(syllabusApi.createLessonMaterial).mockResolvedValue({
      materials: [material(1, "Ma'ruza matni", "text"), material(2, "Ma'ruza videosi", "video", { contentUrl: "https://video.example/2" })],
      courses: [{ id: 77, title: "Fizika 2026", status: "draft", autoSync: true, added: 0, updated: 0, materials: 1 }],
    });
    const onChanged = vi.fn();
    mount(true, onChanged);
    expect(await screen.findByText("1. Ma'ruza matni", undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("Mexanika · Nazariy mashg'ulot · dars kontenti")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Kontent qo'shish/ }));
    fireEvent.change(screen.getByLabelText("Turi *"), { target: { value: "VIDEO" } });
    fireEvent.change(screen.getByLabelText("Nomi *"), { target: { value: " Ma'ruza videosi " } });
    expect(screen.getByRole("button", { name: "Saqlash" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Yoki tashqi URL"), { target: { value: "https://video.example/2" } });
    fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));

    await waitFor(() => expect(syllabusApi.createLessonMaterial).toHaveBeenCalledWith(40, 11, {
      title: "Ma'ruza videosi", description: null, contentType: "VIDEO", contentBody: null,
      contentUrl: "https://video.example/2", assetId: null,
    }));
    expect(await screen.findByText("2. Ma'ruza videosi")).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledWith(2);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Material qo'shildi", description: "Kursga ham tushdi: «Fizika 2026»" }));
  });

  it("materiallar tartibini o'zgartiradi va o'chiradi", async () => {
    vi.mocked(syllabusApi.lessonMaterials).mockResolvedValue([material(1, "Matn", "text"), material(2, "Taqdimot", "document")]);
    vi.mocked(syllabusApi.reorderLessonMaterials).mockResolvedValue({ materials: [material(2, "Taqdimot", "document"), material(1, "Matn", "text")], courses: [] });
    vi.mocked(syllabusApi.deleteLessonMaterial).mockResolvedValue({ materials: [material(2, "Taqdimot", "document")], courses: [] });
    mount();
    await screen.findByText("1. Matn", undefined, { timeout: 3000 });

    fireEvent.click(screen.getAllByRole("button", { name: "Materialni pastga" })[0]);
    await waitFor(() => expect(syllabusApi.reorderLessonMaterials).toHaveBeenCalledWith(40, 11, [2, 1]));
    expect(await screen.findByText("1. Taqdimot")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Matn — o'chirish" }));
    await waitFor(() => expect(syllabusApi.deleteLessonMaterial).toHaveBeenCalledWith(40, 11, 1));
    await waitFor(() => expect(screen.queryByText("2. Matn")).not.toBeInTheDocument());
  });

  it("tasdiqlangan dasturda kontent faqat ko'rinadi", async () => {
    vi.mocked(syllabusApi.lessonMaterials).mockResolvedValue([material(1, "Matn", "text")]);
    mount(false);
    await screen.findByText("1. Matn", undefined, { timeout: 3000 });
    expect(screen.queryByRole("button", { name: /Kontent qo'shish/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Matn — o'chirish" })).not.toBeInTheDocument();
    expect(screen.getByText(/faqat qoralama dasturda tahrirlanadi/)).toBeInTheDocument();
  });
});
