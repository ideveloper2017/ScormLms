import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { StudentCourseLearning } from '../course-learning';
import { studyPlanApi } from '@/services/api/study-plan-api';
import { workspaceApi } from '@/services/api/workspace-api';

vi.mock('@/services/api/study-plan-api', () => ({ studyPlanApi: {
  getCourseContents: vi.fn(), getCourseProgress: vi.fn(), recordContentProgress: vi.fn(),
} }));
vi.mock('@/services/api/workspace-api', () => ({ workspaceApi: { viewed: vi.fn().mockResolvedValue(undefined) } }));
vi.mock('@/services/api/scorm-api', () => ({ scormApi: { listPackages: vi.fn().mockResolvedValue([]) } }));
vi.mock('@/components/course-forum', () => ({ CourseForum: () => null }));
vi.mock('@/components/editor/rich-text-content', () => ({ RichTextContent: ({ value }: { value: string }) => <p>{value}</p> }));

it('opens the linked lesson, changes one lesson at a time, and preserves completed state from the server', async () => {
  vi.mocked(studyPlanApi.getCourseContents).mockResolvedValue([
    { id: 9, title: 'First lesson', contentBody: 'First body' },
    { id: 10, title: 'Second lesson', contentBody: 'Second body' },
  ] as Awaited<ReturnType<typeof studyPlanApi.getCourseContents>>);
  vi.mocked(studyPlanApi.getCourseProgress).mockResolvedValue({ courseId: 3, progress: 50, completedContents: 1,
    totalContents: 2, completedContentIds: [9], completedScormPackages: 0, totalScormPackages: 0, status: 'active' });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { unmount } = render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/student/courses/3/learn?content=10']}>
    <Routes><Route path="/student/courses/:id/learn" element={<StudentCourseLearning />} /></Routes>
  </MemoryRouter></QueryClientProvider>);
  expect(await screen.findByText('Second body')).toBeInTheDocument();
  expect(screen.queryByText('First body')).not.toBeInTheDocument();
  await waitFor(() => expect(workspaceApi.viewed).toHaveBeenCalledWith(3, 10));
  expect(screen.getByRole('button', { name: /Keyingi dars/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Oldingi dars/ }));
  expect(await screen.findByText('First body')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Dars bajarilgan' })).toBeDisabled();
  await waitFor(() => expect(workspaceApi.viewed).toHaveBeenCalledWith(3, 9));
  unmount();
  client.clear();
});
