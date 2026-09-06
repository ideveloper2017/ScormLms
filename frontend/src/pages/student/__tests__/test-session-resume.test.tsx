import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TestSession } from '../test-session';

const mocks = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock('@/hooks/tests/useTests', () => ({
  useTest: () => ({ data: { id: '3', title: 'Resume test', courseName: 'Course', duration: 10, proctoring: false }, isLoading: false }),
  useStartTest: () => ({ mutateAsync: mocks.start, isPending: false, isError: false }),
  useSubmitTest: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/hooks/tests/useProctoringMonitor', () => ({ useProctoringMonitor: () => ({ flush: vi.fn() }) }));
vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }));

describe('test refresh', () => {
  it('restores current answers from the server even when browser history has a stale session', async () => {
    const session = { id: '8', testId: '3', startedAt: new Date(), expiresAt: new Date(Date.now() + 600_000),
      questions: [{ id: '1', type: 'multiple-choice', text: 'Choose an answer', points: 1, options: ['A', 'B'] }] };
    mocks.start.mockResolvedValue({ ...session, answers: { '1': 'B' } });
    const { unmount } = render(<MemoryRouter initialEntries={[{ pathname: '/student/tests/3/session', state: { session: { ...session, answers: { '1': 'A' } } } }]}>
      <Routes><Route path="/student/tests/:testId/session" element={<TestSession />} /></Routes>
    </MemoryRouter>);
    await waitFor(() => expect(mocks.start).toHaveBeenCalledWith('3'));
    expect(await screen.findByRole('radio', { name: /B/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /A/ })).not.toBeChecked();
    unmount();
  });
});
