import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import type { TestSession } from '@/types/test.types';

export function useAnswerAutosave(session?: TestSession) {
  const [answers, setAnswers] = useState<Record<string, string>>(session?.answers ?? {});
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const current = useRef(answers);
  const pending = useRef(new Map<string, string>());
  const running = useRef<Promise<void> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const restored = useRef<string>();

  useEffect(() => {
    if (!session || restored.current === session.id) return;
    restored.current = session.id;
    current.current = session.answers ?? {};
    setAnswers(current.current);
    pending.current.clear();
    setStatus('saved');
  }, [session]);

  const flush = useCallback(async (): Promise<void> => {
    clearTimeout(timer.current);
    if (!session) return;
    if (running.current) {
      await running.current;
      if (pending.current.size) return flush();
      return;
    }
    const work = async () => {
      try {
        while (pending.current.size) {
          setStatus('saving');
          const [questionId, answer] = pending.current.entries().next().value!;
          await api.post(`/tests/${session.testId}/questions/${questionId}/answer`, {
            answer, attemptId: Number(session.id),
          });
          if (pending.current.get(questionId) === answer) pending.current.delete(questionId);
        }
        setStatus('saved');
      } catch (error) {
        setStatus('error');
        throw error;
      }
    };
    running.current = work();
    try { await running.current; } finally { running.current = null; }
  }, [session]);

  const update = (questionId: string, answer: string) => {
    current.current = { ...current.current, [questionId]: answer };
    setAnswers(current.current);
    pending.current.set(questionId, answer);
    setStatus('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { void flush().catch(() => undefined); }, 500);
  };

  useEffect(() => {
    const retry = () => { if (pending.current.size) void flush().catch(() => undefined); };
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current.size) { event.preventDefault(); event.returnValue = ''; }
    };
    const interval = setInterval(retry, 10_000);
    window.addEventListener('online', retry);
    window.addEventListener('beforeunload', warn);
    return () => {
      clearTimeout(timer.current);
      clearInterval(interval);
      window.removeEventListener('online', retry);
      window.removeEventListener('beforeunload', warn);
    };
  }, [flush]);

  return { answers, current, update, flush, status };
}
