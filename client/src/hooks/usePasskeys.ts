import { useCallback, useEffect, useRef } from 'react';
import { passkeysApi } from '../services/api';
import { getIsUnauthorized } from '../services/apiErrors';
import type { AdminPasskey, AsyncResource } from '../types';
import { useAsyncResource } from './useAsyncResource';

/** Shown when the passkey list request fails without a server message. */
const FALLBACK_ERROR_MESSAGE = 'Failed to load passkeys.';

interface UsePasskeysResult extends AsyncResource<AdminPasskey[]> {
  /** Deletes a passkey and reloads the list; rejects when the request fails. */
  remove: (id: string) => Promise<void>;
}

/** The admin passkeys as `{ data, loading, error, refetch }` plus `remove`; a 401 on load calls `onUnauthorized`. */
export function usePasskeys(onUnauthorized: () => void): UsePasskeysResult {
  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const fetchPasskeys = useCallback(async (signal: AbortSignal): Promise<AdminPasskey[]> => {
    try {
      return await passkeysApi.list(signal);
    } catch (error) {
      if (getIsUnauthorized(error)) {
        onUnauthorizedRef.current();
      }
      throw error;
    }
  }, []);

  const resource = useAsyncResource(fetchPasskeys, FALLBACK_ERROR_MESSAGE);
  const { refetch } = resource;

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await passkeysApi.remove(id);
      refetch();
    },
    [refetch],
  );

  return { ...resource, remove };
}
