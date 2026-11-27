import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { adminApi } from '../services/api';
import {
  clearStoredAdminKey,
  getStoredAdminKey,
  storeAdminKey,
  subscribeToAdminKey,
} from '../services/adminKeyStorage';
import { getErrorMessage, getErrorStatus, getIsCanceled } from '../services/apiErrors';

interface UseAdminKeyResult {
  /** The verified key, or null when none is held. */
  adminKey: string | null;
  isVerifying: boolean;
  error: string | null;
  /** Verifies the candidate with the server and stores it on success. Resolves true when accepted. */
  verifyAndStore: (candidateKey: string) => Promise<boolean>;
  /** Removes the stored key, optionally recording why. */
  clearAdminKey: (reason?: string) => void;
}

/**
 * Tracks the admin key held in sessionStorage. A key is only stored after the server
 * accepts it, so a present key means a verified key. All hook instances stay in sync.
 */
export function useAdminKey(): UseAdminKeyResult {
  const adminKey = useSyncExternalStore(subscribeToAdminKey, getStoredAdminKey);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const verifyAndStore = useCallback(async (candidateKey: string): Promise<boolean> => {
    const trimmedKey = candidateKey.trim();
    if (trimmedKey === '') {
      setError('Enter the admin key.');
      return false;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsVerifying(true);
    setError(null);

    try {
      await adminApi.verify(trimmedKey, controller.signal);
      if (controller.signal.aborted) {
        return false;
      }
      storeAdminKey(trimmedKey);
      return true;
    } catch (verifyError) {
      if (controller.signal.aborted || getIsCanceled(verifyError)) {
        return false;
      }
      setError(
        getErrorStatus(verifyError) === 401
          ? 'That admin key was not accepted.'
          : getErrorMessage(verifyError, 'Could not verify the admin key.'),
      );
      return false;
    } finally {
      if (!controller.signal.aborted) {
        setIsVerifying(false);
      }
    }
  }, []);

  const clearAdminKey = useCallback((reason?: string): void => {
    setError(reason ?? null);
    clearStoredAdminKey();
  }, []);

  return { adminKey, isVerifying, error, verifyAndStore, clearAdminKey };
}
