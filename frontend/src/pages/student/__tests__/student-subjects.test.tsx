import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { StudentCourses, assignCourses } from '../courses';
import { studyPlanApi } from '@/services/api/study-plan-api';
import { courseApi } from '@/services/api/course-api';
import type { CurriculumSubject, CurriculumVersion } from '@/services/api/curriculum-api';
import type { SubjectSyllabus } from '@/services/api/syllabus-api';
import type { Course } from '@/types/course.types';

vi.mock('@/services/api/study-plan-api', () => ({ studyPlanApi: { getMyCurriculum: vi.fn() } }));
vi.mock('@/services/api/course-api', async (importOriginal) => ({
  ...await importOriginal<object>(),
  courseApi: { fetchCourses: vi.fn() },
}));

const subject = (id: number, semester: number, name: string, extra: Partial<CurriculumSubject> = {}): CurriculumSubject => ({
  id, subjectId: id * 10, subjectCode: `F${id}`, subjectName: name, credits: 4, semester, planItemType: 'REQUIRED',
  lectureHours: 30, selfStudyHours: 90, ...extra,
});
const course = (id: string, title: string, extra: Partial<Course> = {}): Course => ({
  id, title, description: '', instructor: 'Aliyev A.', progress: 40, status: 'active', credits: 4, ...extra,
});
const subjects = [subject(1, 1, 'Matematika', { syllabusId: 40 }), subject(2, 1, 'Fizika'), subject(3, 2, 'Dasturlash')];
const syllabus = {
  id: 40, subjectId: 10, subjectName: 'Matematika', name: 'Matematika dasturi', shortDescription: 'Oliy matematika', status: 'APPROVED',
  topics: [], modules: [{ id: 5, sortOrder: 1, name: 'Chiziqli algebra', lessons: [{ id: 11, type: 'THEORETICAL', sortOrder: 1, title: 'Matritsalar', moduleId: 5 }] }],
} as unknown as SubjectSyllabus;

describe('Talaba "Fanlar"', () => {
  it('kurs fanga fan id, semestr yoki nomi bo\'yicha bog\'lanadi, qolgani boshqa kurslarga', () => {
    const rows = [subject(1, 1, 'Matematika'), subject(5, 2, 'Matematika', { subjectId: 10 })];
    const { bySubject, other } = assignCourses(rows, [
      course('1', 'Matematika 2', { subjectId: 10, semester: 2 }), course('2', 'Matematika'), course('3', 'Ingliz tili'),
    ]);
    expect(bySubject.get(5)?.map(c => c.id)).toEqual(['1']);
    expect(bySubject.get(1)?.map(c => c.id)).toEqual(['2']);
    expect(other.map(c => c.id)).toEqual(['3']);
  });

  it('joriy semestr fanlari kursi va dasturi bilan, rejadan tashqari kurslar pastda', async () => {
    vi.mocked(studyPlanApi.getMyCurriculum).mockResolvedValue({
      curriculum: { name: 'Reja', subjects } as unknown as CurriculumVersion, currentSemester: 1, syllabi: [syllabus],
    });
    vi.mocked(courseApi.fetchCourses).mockResolvedValue([course('7', 'Matematika kursi', { subjectId: 10 }), course('8', 'Ingliz tili')]);
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/student/courses']}><Routes>
        <Route path="/student/courses" element={<StudentCourses />} />
        <Route path="/student/courses/:id/learn" element={<p>Kurs ochildi</p>} />
      </Routes></MemoryRouter>
    </QueryClientProvider>);

    const math = await screen.findByRole('region', { name: 'Matematika' });
    expect(within(math).getByText('F1 · 4 kredit · Majburiy')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Fizika' })).getByText('Kurs hali ochilmagan')).toBeInTheDocument();
    // Joriy (1-) semestr tanlangan — 2-semestr fani ko'rinmaydi
    expect(screen.queryByRole('region', { name: 'Dasturlash' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Boshqa kurslar' })).getByText('Ingliz tili')).toBeInTheDocument();

    fireEvent.click(within(math).getByRole('button', { name: /O‘quv dasturi/ }));
    expect(await screen.findByText('Matritsalar')).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });

    fireEvent.click(within(math).getByRole('button', { name: /Kursni boshlash|Davom ettirish/ }));
    expect(await screen.findByText('Kurs ochildi')).toBeInTheDocument();
  });
});
