import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTestResults } from '@/hooks/tests/useTests';
import { proctoringAppealApi } from '@/services/api/proctoring-appeal-api';
import { TestResults } from '../test-results';

vi.mock('@/hooks/tests/useTests');
vi.mock('@/services/api/proctoring-appeal-api');

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/student/tests/7/results']}>
        <Routes><Route path="/student/tests/:testId/results" element={<TestResults />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('proctoring result appeal UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTestResults).mockReturnValue({
      data: {
        id: '91', testId: '7', score: 8, totalPoints: 10, percentage: 80,
        passed: true, submittedAt: new Date('2026-08-06T08:30:00Z'), proctoring: true,
      },
      isLoading: false,
    } as ReturnType<typeof useTestResults>);
    vi.mocked(proctoringAppealApi.getContext).mockResolvedValue({
      attemptId: '91', quizId: '7', eligible: true, deadline: '2026-08-16T08:30:00Z',
      riskEvents: [{ id: '12', type: 'tab_hidden', severity: 'high', occurredAt: '2026-08-06T08:20:00Z' }],
    });
  });

  it('risk eventini tanlab izoh bilan appeal yuboradi', async () => {
    vi.mocked(proctoringAppealApi.create).mockResolvedValue({
      id: '4', attemptId: '91', quizId: '7', examTitle: 'Oraliq nazorat', course: 'Algoritmlar',
      studentName: 'Talaba', reason: 'Internet uzildi', requestedAt: '2026-08-06T08:31:00Z',
      status: 'pending', disputedEvents: [],
    });
    renderPage();

    expect(await screen.findByText('Proktoring apellyatsiyasi')).toBeInTheDocument();
    expect(await screen.findByText('Test tabi yashirildi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByPlaceholderText(/Texnik yoki boshqa uzrli holatni/), {
      target: { value: 'Internet uzilishi sababli tab yashirildi' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apellyatsiya yuborish' }));

    await waitFor(() => expect(proctoringAppealApi.create).toHaveBeenCalledWith(
      '7', '91', 'Internet uzilishi sababli tab yashirildi', ['12'],
    ));
  });
});
