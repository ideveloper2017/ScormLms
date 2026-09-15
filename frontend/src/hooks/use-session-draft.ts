import { useEffect, useRef, useState, type SetStateAction } from 'react';

// Drafts are scoped to the signed-in user and this browser tab. Files are not serialized.
export function useSessionDraft<T extends object>(key: string, initial: T) {
  const read = () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (saved && typeof saved === 'object') {
        return Object.fromEntries(Object.entries(initial).map(([name, fallback]) => [
          name, name in saved && (fallback === null || typeof saved[name] === typeof fallback) ? saved[name] : fallback,
        ])) as T;
      }
    } catch { /* Storage may be unavailable. Keep the form usable. */ }
    return initial;
  };
  const [entry, setEntry] = useState(() => ({ key, value: read() }));
  const current = useRef(entry);
  if (entry.key !== key) {
    const next = { key, value: read() };
    current.current = next;
    setEntry(next);
  } else {
    current.current = entry;
  }
  const [storageFailed, setStorageFailed] = useState(false);
  const setValue = (action: SetStateAction<T>) => {
    const value = typeof action === 'function' ? action(current.current.value) : action;
    current.current = { key, value };
    setEntry(current.current);
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      setStorageFailed(false);
    } catch { setStorageFailed(true); }
  };
  const clear = () => {
    try { sessionStorage.removeItem(key); } catch { /* Best effort. */ }
  };
  return { value: current.current.value, setValue, clear, storageFailed };
}

export function useUnloadWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}
