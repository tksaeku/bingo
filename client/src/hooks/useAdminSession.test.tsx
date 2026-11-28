import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PASSKEY_DISMISSED_MESSAGE, PASSKEY_REJECTED_MESSAGE, SESSION_ENDED_MESSAGE } from '../constants';
import { adminApi, authApi } from '../services/api';
import { getAdminSessionSnapshot, setAdminSession } from '../services/adminSessionStore';
import { PasskeyDismissedError } from '../services/PasskeyDismissedError';
import {
  createPasskey,
  getSupportsPasskeys,
  unlockWithPasskey,
} from '../services/passkeyCeremony';
import { createAxiosError } from '../test/axiosErrors';
import { useAdminSession } from './useAdminSession';

vi.mock('../services/api', () => ({
  adminApi: { verify: vi.fn() },
  authApi: { signInWithKey: vi.fn(), signOut: vi.fn() },
}));
vi.mock('../services/passkeyCeremony', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/passkeyCeremony')>()),
  getSupportsPasskeys: vi.fn(() => true),
  unlockWithPasskey: vi.fn(),
  createPasskey: vi.fn(),
}));

describe('useAdminSession', () => {
  describe('initial check', () => {
    it('unlocks when the verify call succeeds', async () => {
      vi.mocked(adminApi.verify).mockResolvedValue(undefined);
      const { result } = renderHook(() => useAdminSession());

      expect(result.current.status).toBe('checking');
      await waitFor(() => expect(result.current.status).toBe('unlocked'));
    });

    it('locks when the verify call answers 401', async () => {
      vi.mocked(adminApi.verify).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      const { result } = renderHook(() => useAdminSession());

      await waitFor(() => expect(result.current.status).toBe('locked'));
    });

    it('does not verify again when the status is already known', () => {
      vi.mocked(adminApi.verify).mockClear();
      setAdminSession('locked');
      renderHook(() => useAdminSession());

      expect(adminApi.verify).not.toHaveBeenCalled();
    });
  });

  it('shares the status between two hook instances', async () => {
    setAdminSession('locked');
    vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
    const first = renderHook(() => useAdminSession());
    const second = renderHook(() => useAdminSession());

    await act(async () => {
      await first.result.current.unlockWithKey('key');
    });

    expect(second.result.current.status).toBe('unlocked');
  });

  describe('unlockWithKey', () => {
    it('trims the key, unlocks, and flags the passkey offer', async () => {
      setAdminSession('locked');
      vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
      const { result } = renderHook(() => useAdminSession());

      let isAccepted = false;
      await act(async () => {
        isAccepted = await result.current.unlockWithKey(' key ');
      });

      expect(isAccepted).toBe(true);
      expect(authApi.signInWithKey).toHaveBeenCalledWith('key');
      expect(result.current.justSignedInWithKey).toBe(true);
    });

    it('does not flag the offer when passkeys are unsupported', async () => {
      setAdminSession('locked');
      vi.mocked(getSupportsPasskeys).mockReturnValueOnce(false);
      vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.unlockWithKey('key');
      });

      expect(result.current.justSignedInWithKey).toBe(false);
    });

    it('reports a rejected key and stays locked', async () => {
      setAdminSession('locked');
      vi.mocked(authApi.signInWithKey).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.unlockWithKey('bad');
      });

      expect(result.current.error).toBe('That admin key was not accepted.');
      expect(result.current.status).toBe('locked');
    });

    it('rejects a blank key without calling the server', async () => {
      setAdminSession('locked');
      vi.mocked(authApi.signInWithKey).mockClear();
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.unlockWithKey('   ');
      });

      expect(result.current.error).toBe('Enter the admin key.');
      expect(authApi.signInWithKey).not.toHaveBeenCalled();
    });
  });

  describe('unlockWithPasskey', () => {
    it('unlocks on success', async () => {
      setAdminSession('locked');
      vi.mocked(unlockWithPasskey).mockResolvedValue(undefined);
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.unlockWithPasskey();
      });

      expect(result.current.status).toBe('unlocked');
      expect(result.current.justSignedInWithKey).toBe(false);
    });

    it('shows the dismissed message when the prompt is dismissed', async () => {
      setAdminSession('locked');
      vi.mocked(unlockWithPasskey).mockRejectedValue(new PasskeyDismissedError());
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.unlockWithPasskey();
      });

      expect(result.current.error).toBe(PASSKEY_DISMISSED_MESSAGE);
      expect(result.current.status).toBe('locked');
    });

    it('shows the rejected message when the server answers 401', async () => {
      setAdminSession('locked');
      vi.mocked(unlockWithPasskey).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.unlockWithPasskey();
      });

      expect(result.current.error).toBe(PASSKEY_REJECTED_MESSAGE);
    });
  });

  describe('addPasskey', () => {
    it('creates the passkey and ends the offer', async () => {
      setAdminSession('locked');
      vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
      vi.mocked(createPasskey).mockResolvedValue(undefined);
      const { result } = renderHook(() => useAdminSession());
      await act(async () => {
        await result.current.unlockWithKey('key');
      });

      let isCreated = false;
      await act(async () => {
        isCreated = await result.current.addPasskey('Laptop');
      });

      expect(isCreated).toBe(true);
      expect(createPasskey).toHaveBeenCalledWith('Laptop');
      expect(result.current.justSignedInWithKey).toBe(false);
    });

    it('keeps the session and reports a dismissed prompt', async () => {
      setAdminSession('unlocked');
      vi.mocked(createPasskey).mockRejectedValue(new PasskeyDismissedError());
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.addPasskey();
      });

      expect(result.current.error).toBe(PASSKEY_DISMISSED_MESSAGE);
      expect(result.current.status).toBe('unlocked');
    });
  });

  it('dismissAddPasskeyOffer clears the offer flag', async () => {
    setAdminSession('locked');
    vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminSession());
    await act(async () => {
      await result.current.unlockWithKey('key');
    });

    act(() => result.current.dismissAddPasskeyOffer());

    expect(result.current.justSignedInWithKey).toBe(false);
    expect(result.current.status).toBe('unlocked');
  });

  it('markSessionEnded locks with the session-ended message', () => {
    setAdminSession('unlocked');
    const { result } = renderHook(() => useAdminSession());

    act(() => result.current.markSessionEnded());

    expect(result.current.status).toBe('locked');
    expect(result.current.error).toBe(SESSION_ENDED_MESSAGE);
  });

  describe('lock', () => {
    it('signs out and locks', async () => {
      setAdminSession('unlocked');
      vi.mocked(authApi.signOut).mockResolvedValue(undefined);
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.lock();
      });

      expect(authApi.signOut).toHaveBeenCalled();
      expect(getAdminSessionSnapshot()).toEqual({ status: 'locked', message: null });
    });

    it('stays unlocked and reports the error when sign-out fails', async () => {
      setAdminSession('unlocked');
      vi.mocked(authApi.signOut).mockRejectedValue(createAxiosError(500, 'Boom'));
      const { result } = renderHook(() => useAdminSession());

      await act(async () => {
        await result.current.lock();
      });

      expect(result.current.status).toBe('unlocked');
      expect(result.current.error).toBe('Boom');
    });
  });
});
