import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { PASSKEY_REJECTED_MESSAGE, SESSION_ENDED_MESSAGE } from '../constants';
import { adminApi, authApi } from '../services/api';
import { getAdminSessionSnapshot, setAdminSession, subscribeToAdminSession } from '../services/adminSessionStore';
import { getErrorMessage, getErrorStatus, getIsCanceled, getIsUnauthorized } from '../services/apiErrors';
import { PasskeyDismissedError } from '../services/PasskeyDismissedError';
import {
  createPasskey,
  getSupportsPasskeys,
  unlockWithPasskey as runPasskeyUnlock,
} from '../services/passkeyCeremony';
import type { AdminSessionStatus } from '../types';

/** Shown when the submitted admin key is blank. */
const EMPTY_KEY_MESSAGE = 'Enter the admin key.';

/** Shown when the server rejects the admin key. */
const KEY_REJECTED_MESSAGE = 'That admin key was not accepted.';

interface UseAdminSessionResult {
  status: AdminSessionStatus;
  /** True while a sign-in, passkey, or lock request is in flight. */
  isBusy: boolean;
  /** The latest action error, or the reason the session ended; null when there is none. */
  error: string | null;
  /** True after a key sign-in on a passkey-capable browser, until the offer is added or dismissed. */
  justSignedInWithKey: boolean;
  /** Signs in with a passkey (needs a user gesture). */
  unlockWithPasskey: () => Promise<void>;
  /** Signs in with the admin key. Resolves true when accepted. */
  unlockWithKey: (candidateKey: string) => Promise<boolean>;
  /** Registers a passkey for this device. Resolves true when created. */
  addPasskey: (name?: string) => Promise<boolean>;
  dismissAddPasskeyOffer: () => void;
  /** Ends the session on the server and returns to the unlock screen. */
  lock: () => Promise<void>;
  /** Returns to the unlock screen after an admin request answered 401. */
  markSessionEnded: () => void;
}

/**
 * The shared admin session. The first mount while the status is `checking` asks the server whether
 * the session cookie is valid; every instance reads the same store, so unlocking one page unlocks all.
 */
export function useAdminSession(): UseAdminSessionResult {
  const { status, message } = useSyncExternalStore(subscribeToAdminSession, getAdminSessionSnapshot);
  const [isBusy, setIsBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [justSignedInWithKey, setJustSignedInWithKey] = useState(false);

  useEffect(() => {
    if (getAdminSessionSnapshot().status !== 'checking') {
      return undefined;
    }
    const controller = new AbortController();
    const check = async (): Promise<void> => {
      try {
        await adminApi.verify(controller.signal);
        if (!controller.signal.aborted) {
          setAdminSession('unlocked');
        }
      } catch (error) {
        if (!controller.signal.aborted && !getIsCanceled(error)) {
          setAdminSession('locked');
        }
      }
    };
    void check();
    return () => {
      controller.abort();
    };
  }, []);

  /** Runs one busy-guarded action; the action returns its result or throws. */
  const runAction = useCallback(
    async <Result>(
      action: () => Promise<Result>,
      fallback: Result,
      getFailureMessage: (error: unknown) => string,
    ): Promise<Result> => {
      setIsBusy(true);
      setActionError(null);
      try {
        return await action();
      } catch (error) {
        if (getIsUnauthorized(error) && getAdminSessionSnapshot().status === 'unlocked') {
          setAdminSession('locked', SESSION_ENDED_MESSAGE);
          return fallback;
        }
        setActionError(getFailureMessage(error));
        return fallback;
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  const unlockWithPasskey = useCallback(async (): Promise<void> => {
    await runAction(
      async () => {
        await runPasskeyUnlock();
        setAdminSession('unlocked');
      },
      undefined,
      (error) => {
        if (error instanceof PasskeyDismissedError) {
          return error.message;
        }
        return getErrorStatus(error) === 401
          ? PASSKEY_REJECTED_MESSAGE
          : getErrorMessage(error, 'Could not unlock with a passkey.');
      },
    );
  }, [runAction]);

  const unlockWithKey = useCallback(
    async (candidateKey: string): Promise<boolean> => {
      const trimmedKey = candidateKey.trim();
      if (trimmedKey === '') {
        setActionError(EMPTY_KEY_MESSAGE);
        return false;
      }
      return runAction(
        async () => {
          await authApi.signInWithKey(trimmedKey);
          setJustSignedInWithKey(getSupportsPasskeys());
          setAdminSession('unlocked');
          return true;
        },
        false,
        (error) =>
          getErrorStatus(error) === 401
            ? KEY_REJECTED_MESSAGE
            : getErrorMessage(error, 'Could not verify the admin key.'),
      );
    },
    [runAction],
  );

  const addPasskey = useCallback(
    (name?: string): Promise<boolean> =>
      runAction(
        async () => {
          await createPasskey(name);
          setJustSignedInWithKey(false);
          return true;
        },
        false,
        (error) =>
          error instanceof PasskeyDismissedError ? error.message : getErrorMessage(error, 'Could not add the passkey.'),
      ),
    [runAction],
  );

  const dismissAddPasskeyOffer = useCallback((): void => {
    setJustSignedInWithKey(false);
  }, []);

  const lock = useCallback(async (): Promise<void> => {
    await runAction(
      async () => {
        await authApi.signOut();
        setJustSignedInWithKey(false);
        setAdminSession('locked');
      },
      undefined,
      (error) => getErrorMessage(error, 'Could not lock the session.'),
    );
  }, [runAction]);

  const markSessionEnded = useCallback((): void => {
    setActionError(null);
    setJustSignedInWithKey(false);
    setAdminSession('locked', SESSION_ENDED_MESSAGE);
  }, []);

  return {
    status,
    isBusy,
    error: actionError ?? message,
    justSignedInWithKey,
    unlockWithPasskey,
    unlockWithKey,
    addPasskey,
    dismissAddPasskeyOffer,
    lock,
    markSessionEnded,
  };
}
