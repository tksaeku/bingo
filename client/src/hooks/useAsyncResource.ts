import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, getIsCanceled } from '../services/apiErrors';
import type { AsyncResource } from '../types';

interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  errorMessage: string | null;
}

/**
 * Fetches a resource on mount and whenever refetch() is called, optionally on an interval.
 * Only the initial load reports loading; later refreshes keep the previous data visible.
 * In-flight requests are aborted on unmount, and aborted results never touch state.
 * The fetchResource function must be referentially stable (declare it at module level).
 */
export function useAsyncResource<T>(
  fetchResource: (signal: AbortSignal) => Promise<T>,
  fallbackErrorMessage: string,
  refreshIntervalMs?: number,
): AsyncResource<T> {
  const [state, setState] = useState<ResourceState<T>>({ data: null, isLoading: true, errorMessage: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const load = async (): Promise<void> => {
      try {
        const data = await fetchResource(controller.signal);
        if (!controller.signal.aborted) {
          setState({ data, isLoading: false, errorMessage: null });
        }
      } catch (error) {
        if (controller.signal.aborted || getIsCanceled(error)) {
          return;
        }
        setState((previous) => ({
          data: previous.data,
          isLoading: false,
          errorMessage: getErrorMessage(error, fallbackErrorMessage),
        }));
      }
    };

    void load();
    const intervalId = refreshIntervalMs === undefined ? undefined : setInterval(() => void load(), refreshIntervalMs);

    return () => {
      controller.abort();
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [fetchResource, fallbackErrorMessage, refreshIntervalMs, reloadCount]);

  const refetch = useCallback((): void => {
    setReloadCount((count) => count + 1);
  }, []);

  return { data: state.data, loading: state.isLoading, error: state.errorMessage, refetch };
}
