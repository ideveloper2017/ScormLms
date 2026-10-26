import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourseSyllabusPanel } from "@/components/course-syllabus-panel";
import { teacherPortalApi, type CourseSyllabusStatus } from "@/services/api/teacher-portal-api";

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/services/api/teacher-portal-api", () => ({ teacherPortalApi: {
  getCourseSyllabus: vi.fn(), syncCourseSyllabus: vi.fn(), createModule: vi.fn(),
} }));

const status: CourseSyllabusStatus = {
  syllabusId: 31, syllabusName: "Fizika dasturi", syllabusStatus: "APPROVED", syllabusRevision: 3, courseSyllabusRevision: 2,
  pendingCount: 2,
  topics: [
    { topicId: 1, type: "THEORETICAL", sortOrder: 1, title: "Kirish", hours: 2, moduleId: 101, moduleTitle: "Kirish", outdated: false },
    { topicId: 2, type: "THEORETICAL", sortOrder: 2, title: "Kinematika", hours: 4, moduleId: 102, moduleTitle: "Kinematika", outdated: true },
    { topicId: 3, type: "PRACTICAL", sortOrder: 1, title: "Tajriba", hours: 4, moduleId: null, outdated: false },
  ],
};
const mount = (onChanged = vi.fn()) => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}>
    <CourseSyllabusPanel courseId="9" onChanged={onChanged} />
  </QueryClientProvider>,
);

describe("CourseSyllabusPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(teacherPortalApi.getCourseSyllabus).mockResolvedValue(status);
  });

  it("dastur mavzularining kursdagi holatini ko'rsatadi", async () => {
    mount();
    expect(await screen.findByText("1. Kirish")).toBeInTheDocument();
    expect(screen.getByText("Dasturda o'zgargan")).toBeInTheDocument();
    expect(screen.getByText(/2-versiyasi asosida yaratilgan, hozirgi versiya — 3/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Dastur bilan sinxronlash \(2\)/ })).toBeEnabled();
  });

  it("qo'shilmagan mavzuni bo'lim sifatida qo'shadi", async () => {
    vi.mocked(teacherPortalApi.createModule).mockResolvedValue({} as never);
    const onChanged = vi.fn();
    mount(onChanged);
    fireEvent.click(await screen.findByRole("button", { name: /Tajriba — bo'lim qilib qo'shish/ }));
    await waitFor(() => expect(teacherPortalApi.createModule).toHaveBeenCalledWith("9", { title: "Tajriba", syllabusTopicId: 3 }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("dastur bilan sinxronlaydi", async () => {
    vi.mocked(teacherPortalApi.syncCourseSyllabus).mockResolvedValue({ added: 1, updated: 1, status: { ...status, pendingCount: 0 } });
    mount();
    fireEvent.click(await screen.findByRole("button", { name: /Dastur bilan sinxronlash/ }));
    await waitFor(() => expect(teacherPortalApi.syncCourseSyllabus).toHaveBeenCalledWith("9"));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      description: "1 ta yangi bo'lim qo'shildi, 1 ta bo'lim yangilandi" })));
  });

  it("tasdiqlanmagan yangi versiyada sinxronlashni bloklaydi", async () => {
    vi.mocked(teacherPortalApi.getCourseSyllabus).mockResolvedValue({ ...status, syllabusStatus: "DRAFT" });
    mount();
    expect(await screen.findByRole("button", { name: /Dastur bilan sinxronlash/ })).toBeDisabled();
    expect(screen.getByText(/tasdiqlangandan keyin sinxronlash mumkin/)).toBeInTheDocument();
  });
});
