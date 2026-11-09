import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { StudentSubject } from '../subject';
import { StudentSubjectLesson } from '../subject-lesson';
import { studyPlanApi, type StudentSyllabusLessons } from '@/services/api/study-plan-api';
import { courseApi } from '@/services/api/course-api';
import type { CurriculumVersion } from '@/services/api/curriculum-api';
import type { SubjectSyllabus } from '@/services/api/syllabus-api';

vi.mock('@/services/api/study-plan-api', () => ({
  studyPlanApi: {
    getMyCurriculum: vi.fn(), getCourseContents: vi.fn(), getCourseProgress: vi.fn(), getSyllabusLessons: vi.fn(), completeSyllabusMaterial: vi.fn(),
    syllabusMaterialFile: vi.fn(), syllabusMaterialPresentation: vi.fn(), syllabusMaterialLegacyWord: vi.fn(),
  },
}));
vi.mock('@/services/api/course-api', async (importOriginal) => ({ ...await importOriginal<object>(), courseApi: { fetchCourses: vi.fn() } }));
vi.mock('@/services/test-api', () => ({ fetchTests: vi.fn().mockResolvedValue([]) }));
vi.mock('@/services/api/grade-api', () => ({ fetchGrades: vi.fn().mockResolvedValue([]) }));

const topics = [
  { id: 1, type: 'THEORETICAL', sortOrder: 1, title: 'Kuch va massa', moduleId: 5, lessonOrder: 1, hours: 2 },
  { id: 2, type: 'LABORATORY', sortOrder: 1, title: 'Ishqalanish', moduleId: 5, lessonOrder: 2, hours: 4 },
];
const syllabus = {
  id: 40, subjectId: 10, subjectName: 'Mexanika', name: 'Mexanika dasturi', language: 'UZ', status: 'APPROVED',
  shortDescription: 'Harakat qonunlari', fullDescription: "<p>Kinematika va <strong>dinamika</strong></p>", introVideoUrl: 'https://youtu.be/dQw4w9WgXcQ', requirements: 'Vektorlar\nHosila',
  learningOutcomes: "Nyuton qonunlarini qo'llash", topics, modules: [{ id: 5, sortOrder: 1, name: 'Dinamika', lessons: topics }],
} as unknown as SubjectSyllabus;
const curriculum = { name: 'Reja', subjects: [{ id: 3, subjectId: 10, subjectCode: 'FIZ', subjectName: 'Mexanika', credits: 6, semester: 1,
  planItemType: 'REQUIRED', lectureHours: 30, laboratoryHours: 30, totalHours: 180, syllabusId: 40 }] } as unknown as CurriculumVersion;
const material = (id: number, topicId: number, title: string, contentBody: string) => ({ id, topicId, position: 1, title, contentType: 'text' as const,
  contentBody, authorName: 'Kafedra', languageCode: 'uz', sourceName: 'Fan', contentVersion: '1.0' });
const lessons: StudentSyllabusLessons = {
  syllabusId: 40,
  materials: [material(70, 1, "Ma'ruza matni", '<p>Nyutonning ikkinchi qonuni</p>'), material(71, 2, "Yo'riqnoma", '<p>Ishqalanish koeffitsienti</p>')],
  quizzes: [{ id: 8, topicId: 2, kind: 'TEST', title: 'Ishqalanish testi', questionCount: 5, durationMinutes: 10, allowedAttempts: 1, passingPercentage: 60 }],
  completedMaterialIds: [70],
};
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('Talaba fan sahifasi', () => {
  it("banner, kurssiz o'quv dasturi lentasi, ko'rinishlar va talablar; davom ettirish dars sahifasini ochadi", async () => {
    vi.mocked(studyPlanApi.getMyCurriculum).mockResolvedValue({ curriculum, currentSemester: 1, syllabi: [syllabus] });
    vi.mocked(courseApi.fetchCourses).mockResolvedValue([{ id: '9', title: 'Mexanika kursi', description: '', instructor: 'Aliyev Anvar', progress: 50, status: 'active', credits: 6, subjectId: 10 }]);
    vi.mocked(studyPlanApi.getSyllabusLessons).mockResolvedValue(lessons);
    render(<QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={['/student/subjects/3']}><Routes>
        <Route path="/student/subjects/:id" element={<StudentSubject />} />
        <Route path="/student/subjects/:id/lessons/:topicId" element={<StudentSubjectLesson />} />
      </Routes></MemoryRouter>
    </QueryClientProvider>);

    const banner = await screen.findByRole('region', { name: 'Fan' });
    expect(within(banner).getByRole('heading', { name: 'Mexanika' })).toBeInTheDocument();
    expect(within(banner).getByText('Aliyev Anvar')).toBeInTheDocument();
    expect(await within(banner).findByText('50%')).toBeInTheDocument();
    expect(screen.queryByText(/Kurs hali ochilmagan/)).not.toBeInTheDocument();
    const module = await screen.findByRole('region', { name: 'Dinamika' });
    expect(within(module).getByRole('button', { name: /Kuch va massa/ })).toHaveTextContent('· Nazariy');
    expect(within(module).getByText('1/2')).toBeInTheDocument();
    expect(within(module).getByRole('button', { name: /Ishqalanish/ })).toHaveTextContent('1 ta test');

    fireEvent.click(screen.getByRole('button', { name: /Jadval/ }));
    expect(screen.getByRole('columnheader', { name: 'Lab.' })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Talablar va natijalar' }));
    expect(await screen.findByText('Hosila')).toBeInTheDocument();
    expect(screen.getByText("Nyuton qonunlarini qo'llash")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Fan haqida' }));
    expect(await screen.findByTitle('Mexanika — tanishtiruv videosi')).toBeInTheDocument();
    expect(screen.getByText('dinamika').tagName).toBe('STRONG');

    fireEvent.click(within(banner).getByRole('button', { name: /Davom ettirish/ }));
    expect(await screen.findByRole('heading', { name: 'Ishqalanish' })).toBeInTheDocument();
    expect(await screen.findByText('Ishqalanish koeffitsienti')).toBeInTheDocument();
  });

  it('dars sahifasi: material, bajarildi belgisi, testlar va oldingi dars', async () => {
    vi.mocked(studyPlanApi.getMyCurriculum).mockResolvedValue({ curriculum, currentSemester: 1, syllabi: [syllabus] });
    vi.mocked(studyPlanApi.getSyllabusLessons).mockResolvedValue(lessons);
    vi.mocked(studyPlanApi.completeSyllabusMaterial).mockResolvedValue([70, 71]);
    render(<QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={['/student/subjects/3/lessons/2?material=71']}><Routes>
        <Route path="/student/subjects/:id/lessons/:topicId" element={<StudentSubjectLesson />} />
      </Routes></MemoryRouter>
    </QueryClientProvider>);

    expect(await screen.findByText('Ishqalanish koeffitsienti')).toBeInTheDocument();
    expect(screen.getByText('1/2 material bajarildi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Darsni yakunlash/ }));
    expect(await screen.findByRole('button', { name: /Dars bajarilgan/ })).toBeDisabled();
    expect(studyPlanApi.completeSyllabusMaterial).toHaveBeenCalledWith(40, 71);
    expect(screen.getByText('2/2 material bajarildi')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Test (1)' }));
    expect(await screen.findByText('Ishqalanish testi')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Oldingi/ }));
    expect(await screen.findByText('Nyutonning ikkinchi qonuni')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kuch va massa' })).toBeInTheDocument();
  });
});
