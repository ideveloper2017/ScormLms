import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeacherCourseCreate } from '../course-create';
import { TeacherCourseDetail } from '../course-detail';
import { teacherPortalApi, type TeacherCourse, type CourseModule, type CourseContent } from '@/services/api/teacher-portal-api';
import { subjectGroupApi } from '@/services/api/subject-group-api';

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { id: 7, role: { name: 'teacher' } } }) }));
vi.mock('@/components/editor/lazy-rich-text-editor', () => ({ LazyRichTextEditor: ({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) =>
  <textarea aria-label="Matn muharriri" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /> }));
vi.mock('@/components/course-forum', () => ({ CourseForum: () => null }));
vi.mock('@/services/api/subject-group-api', () => ({ subjectGroupApi: { teachingOptions: vi.fn() } }));
vi.mock('@/services/api/teacher-portal-api', () => ({ teacherPortalApi: {
  getProfile: vi.fn(), getSubjectMaterialSubjects: vi.fn(), createCourse: vi.fn(), updateCourse: vi.fn(),
  uploadCourseThumbnail: vi.fn(), getCourse: vi.fn(), getEnrollments: vi.fn(), getModules: vi.fn(),
  getContents: vi.fn(), getSubjectMaterials: vi.fn(), deleteModule: vi.fn(), deleteContent: vi.fn(),
} }));

const course: TeacherCourse = { id: '9', title: 'Mexanika', subjectId: 3, subjectName: 'Fizika',
  description: '<p><strong>Kurs tavsifi</strong></p>', students: 0, progress: 0, status: 'draft',
  level: 'BEGINNER', language: 'uz', paid: true, price: 100, discountEnabled: true,
  discountedPrice: 50, expiryPeriodType: 'lifetime', dripContent: false, thumbnailAvailable: false };
const module = { id: 4, title: 'Kirish', position: 1, status: 'draft' } as CourseModule;
const content = { id: 5, moduleId: 4, title: 'Birinchi dars', contentType: 'text', contentBody: '<p>Matn</p>',
  languageCode: 'uz', authorName: 'Ustoz', sourceName: 'Muallif', contentVersion: '1.0', validFrom: '2026-09-01',
  position: 1, status: 'draft', reviewStatus: 'draft', compatibility: { compatible: true, issues: [] } } as CourseContent;

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.stubGlobal('confirm', vi.fn(() => false));
  vi.stubGlobal('PointerEvent', MouseEvent);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
  vi.mocked(teacherPortalApi.getProfile).mockResolvedValue({ id: '7', fullName: 'Ustoz', username: 'ustoz' });
  vi.mocked(subjectGroupApi.teachingOptions).mockResolvedValue([]);
  vi.mocked(teacherPortalApi.getSubjectMaterialSubjects).mockResolvedValue([{ id: 3, name: 'Fizika' }] as Awaited<ReturnType<typeof teacherPortalApi.getSubjectMaterialSubjects>>);
  vi.mocked(teacherPortalApi.createCourse).mockResolvedValue(course);
  vi.mocked(teacherPortalApi.updateCourse).mockResolvedValue(course);
  vi.mocked(teacherPortalApi.getCourse).mockResolvedValue(course);
  vi.mocked(teacherPortalApi.getEnrollments).mockResolvedValue([]);
  vi.mocked(teacherPortalApi.getModules).mockResolvedValue([module]);
  vi.mocked(teacherPortalApi.getContents).mockResolvedValue([content]);
  vi.mocked(teacherPortalApi.getSubjectMaterials).mockResolvedValue([]);
});

function mount(mode: 'create' | 'edit' | 'detail' = 'create') {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={['/teacher/courses/create']}><Routes>
      <Route path="/teacher/courses/create" element={mode === 'detail' ? <TeacherCourseDetail defaultTab="contents" /> : <TeacherCourseCreate course={mode === 'edit' ? course : undefined} />} />
      <Route path="/teacher/courses/:id/contents" element={<p>Kurs saqlandi</p>} />
      <Route path="/teacher/courses" element={<p>Kurslar ro'yxati</p>} />
    </Routes></MemoryRouter>
  </QueryClientProvider>);
}
async function selectSubject() {
  const select = await screen.findByRole('combobox', { name: 'Kategoriya / fan' });
  await waitFor(() => expect(select).toBeEnabled());
  fireEvent.keyDown(select, { key: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: 'Fizika' }));
}

describe('course authoring', () => {
  it('keeps a created course when its thumbnail upload fails and navigates away from create', async () => {
    vi.mocked(teacherPortalApi.uploadCourseThumbnail).mockRejectedValue(new Error('Upload failed'));
    mount();
    fireEvent.change(screen.getByRole('textbox', { name: 'Kurs nomi *' }), { target: { value: 'Yangi kurs' } });
    await selectSubject();
    fireEvent.click(screen.getByText(/Qo‘shimcha sozlamalar:/));
    fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [new File(['image'], 'cover.png', { type: 'image/png' })] } });
    fireEvent.click(screen.getByRole('button', { name: 'Kurs yaratish', exact: true }));
    expect(await screen.findByText('Kurs saqlandi')).toBeInTheDocument();
    expect(teacherPortalApi.createCourse).toHaveBeenCalledTimes(1);
    expect(teacherPortalApi.createCourse).toHaveBeenCalledWith(expect.objectContaining({ paid: false, discountEnabled: false }));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Kurs saqlandi, ammo rasm yuklanmadi' }));
    expect(sessionStorage.getItem('course-form:v1:7:new')).toBeNull();
  });

  it('restores form data after remount and keeps it when cancellation is declined', async () => {
    const view = mount();
    fireEvent.change(screen.getByRole('textbox', { name: 'Kurs nomi *' }), { target: { value: 'Saqlanmagan kurs' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }));
    expect(window.confirm).toHaveBeenCalled();
    view.unmount();
    mount();
    expect(screen.getByRole('textbox', { name: 'Kurs nomi *' })).toHaveValue('Saqlanmagan kurs');
  });

  it('reports loading errors separately from missing subject assignments and supports retry', async () => {
    vi.mocked(subjectGroupApi.teachingOptions).mockRejectedValueOnce(new Error('Offline')).mockResolvedValue([]);
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent("Fanlar ro'yxatini yuklab bo'lmadi");
    expect(screen.queryByText(/Administratorga murojaat/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('updates full settings, rich text and explicit date clearing without creating another course', async () => {
    mount('edit');
    expect(screen.queryByText(/Narxlash turi|Kurs chegirmasi/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Matn muharriri'), { target: { value: '<p><strong>Yangi tavsif</strong></p>' } });
    fireEvent.click(screen.getByRole('button', { name: 'O‘zgarishlarni saqlash' }));
    await waitFor(() => expect(teacherPortalApi.updateCourse).toHaveBeenCalledWith('9', expect.objectContaining({
      level: 'BEGINNER', language: 'uz', clearStartDate: true, clearEndDate: true,
      description: '<p><strong>Yangi tavsif</strong></p>',
    })));
    expect(teacherPortalApi.createCourse).not.toHaveBeenCalled();
    const payload = vi.mocked(teacherPortalApi.updateCourse).mock.calls[0][1];
    expect(payload).not.toHaveProperty('paid');
    expect(payload).not.toHaveProperty('price');
    expect(payload).not.toHaveProperty('discountEnabled');
    expect(payload).not.toHaveProperty('discountedPrice');
  });
});

function mountDetail() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={['/teacher/courses/9/contents']}><Routes>
      <Route path="/teacher/courses/:id/contents" element={<TeacherCourseDetail defaultTab="contents" />} />
    </Routes></MemoryRouter>
  </QueryClientProvider>);
}

describe('course contents protection', () => {
  it('opens the full course editor directly from the contents tab', async () => {
    mountDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'Tahrirlash', exact: true }));
    expect(screen.getByRole('heading', { name: 'Kursni tahrirlash' })).toBeInTheDocument();
    expect(screen.getByLabelText('Matn muharriri')).toHaveValue(course.description);
  });

  it('does not delete a module until the warning about its lessons is accepted', async () => {
    mountDetail();
    const remove = await screen.findByRole('button', { name: "Sectionni o'chirish" });
    fireEvent.click(remove);
    expect(teacherPortalApi.deleteModule).not.toHaveBeenCalled();
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('barcha darslar'));
    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(remove);
    await waitFor(() => expect(teacherPortalApi.deleteModule).toHaveBeenCalledWith('9', 4));
  });

  it('preserves a lesson on Escape and restores its draft after a page remount', async () => {
    const view = mountDetail();
    fireEvent.click(await screen.findByRole('button', { name: "Dars qo'shish" }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText('Dars mavzusi'), { target: { value: 'Yozilayotgan dars' } });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    view.unmount();
    mountDetail();
    expect(await screen.findByPlaceholderText('Dars mavzusi')).toHaveValue('Yozilayotgan dars');
    vi.mocked(window.confirm).mockReturnValue(true);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Bekor qilish' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('course-lesson:v1:7:9')).toBeNull();
  });
});
