import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AdminSubjectsAndSyllabi } from '../admin/subjects-syllabi';
import { syllabusApi, type SubjectSyllabus } from '@/services/api/syllabus-api';
import { listPrograms, listSubjectCategories, listSubjects, type SubjectRecord } from '@/lib/academic-api';

vi.mock('@/services/api/syllabus-api', async importOriginal => ({
  ...await importOriginal<object>(),
  syllabusApi: { list: vi.fn(), history: vi.fn(), workflow: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/lib/academic-api', async importOriginal => ({
  ...await importOriginal<object>(), listSubjects: vi.fn(), listPrograms: vi.fn(), listSubjectCategories: vi.fn(),
}));
vi.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { id: 1, role: { name: 'admin' }, roles: [], permissions: ['ACADEMIC_WRITE'] } }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

function mount(ui: React.ReactNode, url = '/edu-process/subjects') {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter></QueryClientProvider>);
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  const subjects = [
    { id: 7, name: 'Fizika', code: 'FIZ101', credits: 6, active: true },
    { id: 8, name: 'Kimyo', code: 'KIM101', credits: 4, active: true },
  ] as SubjectRecord[];
  const syllabus = (id: number, subjectId: number, subjectName: string, status: SubjectSyllabus['status']): SubjectSyllabus => ({
    id, subjectId, subjectName, name: `${subjectName} dasturi ${id}`, language: 'UZ', shortDescription: 'Qisqa', fullDescription: "To'liq",
    active: true, status, revisionNumber: 1, topics: [{ type: 'THEORETICAL', sortOrder: 1, title: 'Kirish', hours: 2 }], theoreticalHours: 2, practicalHours: 0,
  });
  vi.mocked(listSubjects).mockResolvedValue(subjects);
  vi.mocked(listPrograms).mockResolvedValue([]);
  vi.mocked(listSubjectCategories).mockResolvedValue([]);
  vi.mocked(syllabusApi.list).mockResolvedValue([syllabus(1, 7, 'Fizika', 'APPROVED'), syllabus(2, 7, 'Fizika', 'DRAFT'), syllabus(3, 8, 'Kimyo', 'DRAFT')]);
});

it('fan qatoridan uning o‘quv dasturlariga o‘tadi', async () => {
  mount(<AdminSubjectsAndSyllabi />);
  fireEvent.click(await screen.findByRole('button', { name: /2 ta · 1 tasdiqlangan/ }));

  expect(await screen.findByText('Fizika dasturi 1')).toBeInTheDocument();
  expect(screen.getByText('Fizika dasturi 2')).toBeInTheDocument();
  expect(screen.queryByText('Kimyo dasturi 3')).not.toBeInTheDocument();
  expect(screen.getAllByText('Nazariy: 2 · Amaliy: 0').length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('button', { name: /Barcha fanlar/ }));
  expect(await screen.findByText('Kimyo dasturi 3')).toBeInTheDocument();
});

it('eski o‘quv dasturi manzili dasturlar tabini ochadi', async () => {
  mount(<AdminSubjectsAndSyllabi defaultTab="syllabi" />, '/edu-process/syllabus');
  expect(await screen.findByText('Kimyo dasturi 3')).toBeInTheDocument();
});
