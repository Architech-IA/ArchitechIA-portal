'use client';

import { useState, useCallback } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useAsyncAction<T = void>(fn: () => Promise<T>, successDuration = 2000) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      await fn();
      setStatus('success');
      setTimeout(() => setStatus('idle'), successDuration);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [fn, successDuration]);

  return {
    run,
    loading:  status === 'loading',
    success:  status === 'success',
    hasError: status === 'error',
    error,
    status,
  };
}
