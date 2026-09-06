import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnswerAutosave } from '../useAnswerAutosave';
import api from '@/lib/api';
import type { TestSession } from '@/types/test.types';

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }));
const session: TestSession = { id: '8', testId: '3', startedAt: new Date(), expiresAt: new Date(Date.now() + 600_000), questions: [], answers: { '1': 'saved answer' } };

describe('answer autosave', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.mocked(api.post).mockReset(); vi.mocked(api.post).mockResolvedValue({ data: {} }); });
  afterEach(() => vi.useRealTimers());
  it('restores the server snapshot and saves text after typing stops', async () => {
    const { result, unmount } = renderHook(() => useAnswerAutosave(session));
    expect(result.current.answers['1']).toBe('saved answer');
    act(() => { result.current.update('2', 'a'); result.current.update('2', 'ab'); });
    await act(async () => { await vi.advanceTimersByTimeAsync(501); });
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/tests/3/questions/2/answer', { answer: 'ab', attemptId: 8 });
    expect(result.current.status).toBe('saved');
    unmount();
  });
  it('serializes saves so an old response cannot overwrite a newer answer', async () => {
    let release!: () => void;
    vi.mocked(api.post).mockImplementationOnce(() => new Promise(resolve => { release = () => resolve({ data: {} }); }));
    const { result, unmount } = renderHook(() => useAnswerAutosave(session));
    act(() => result.current.update('1', 'old'));
    await act(async () => { await vi.advanceTimersByTimeAsync(501); });
    act(() => result.current.update('1', 'new'));
    await act(async () => { release(); await result.current.flush(); });
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(vi.mocked(api.post).mock.calls[1][1]).toEqual({ answer: 'new', attemptId: 8 });
    expect(result.current.current.current['1']).toBe('new');
    unmount();
  });
  it('keeps unsaved answers after a network error and retries on reconnect', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('offline'));
    const { result, unmount } = renderHook(() => useAnswerAutosave(session));
    act(() => result.current.update('2', 'retain me'));
    await act(async () => { await vi.advanceTimersByTimeAsync(501); });
    expect(result.current.status).toBe('error');
    expect(result.current.answers['2']).toBe('retain me');
    await act(async () => { window.dispatchEvent(new Event('online')); await result.current.flush(); });
    expect(result.current.status).toBe('saved');
    expect(api.post).toHaveBeenCalledTimes(2);
    unmount();
  });
});
