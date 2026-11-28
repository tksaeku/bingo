import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PASSKEY_DISMISSED_MESSAGE, PASSKEY_REJECTED_MESSAGE } from '../../constants';
import { adminApi, authApi, optionsApi } from '../../services/api';
import { setAdminSession } from '../../services/adminSessionStore';
import { PasskeyDismissedError } from '../../services/PasskeyDismissedError';
import {
  createPasskey,
  getSupportsPasskeys,
  unlockWithPasskey,
} from '../../services/passkeyCeremony';
import { createAxiosError } from '../../test/axiosErrors';
import { createOptions } from '../../test/factories';
import { renderWithProviders } from '../../test/renderWithProviders';
import CardsPage from './CardsPage';

vi.mock('../../services/api', () => ({
  optionsApi: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
  leaderboardApi: { getAll: vi.fn(), submitWin: vi.fn() },
  adminApi: { verify: vi.fn() },
  authApi: { signInWithKey: vi.fn(), signOut: vi.fn() },
}));
vi.mock('../../services/passkeyCeremony', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/passkeyCeremony')>()),
  getSupportsPasskeys: vi.fn(() => true),
  unlockWithPasskey: vi.fn(),
  createPasskey: vi.fn(),
}));

describe('CardsPage', () => {
  describe('checking the session', () => {
    it('shows a loading state, then the editor when the session is valid', async () => {
      vi.mocked(adminApi.verify).mockResolvedValue(undefined);
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      renderWithProviders(<CardsPage />);

      expect(screen.getByRole('status')).toHaveTextContent('Checking admin session...');
      expect(screen.queryByRole('button', { name: 'Unlock with passkey' })).not.toBeInTheDocument();
      expect(await screen.findByText('Option 0')).toBeInTheDocument();
    });

    it('shows the unlock screen when there is no session', async () => {
      vi.mocked(adminApi.verify).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<CardsPage />);

      expect(await screen.findByRole('button', { name: 'Unlock with passkey' })).toBeInTheDocument();
      expect(screen.getByText('Unlock to manage the bingo cards.')).toBeInTheDocument();
      expect(optionsApi.getAll).not.toHaveBeenCalled();
    });
  });

  describe('locked', () => {
    it('unlocks with a passkey and reveals the editor', async () => {
      setAdminSession('locked');
      vi.mocked(unlockWithPasskey).mockResolvedValue(undefined);
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      renderWithProviders(<CardsPage />);

      await userEvent.click(screen.getByRole('button', { name: 'Unlock with passkey' }));

      expect(await screen.findByText('Option 0')).toBeInTheDocument();
      expect(screen.queryByText('Add a passkey for this device')).not.toBeInTheDocument();
    });

    it('shows a calm message when the passkey prompt is dismissed', async () => {
      setAdminSession('locked');
      vi.mocked(unlockWithPasskey).mockRejectedValue(new PasskeyDismissedError());
      renderWithProviders(<CardsPage />);

      await userEvent.click(screen.getByRole('button', { name: 'Unlock with passkey' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(PASSKEY_DISMISSED_MESSAGE);
      expect(screen.getByRole('button', { name: 'Unlock with passkey' })).toBeEnabled();
    });

    it('shows the rejected message when the server refuses the passkey', async () => {
      setAdminSession('locked');
      vi.mocked(unlockWithPasskey).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<CardsPage />);

      await userEvent.click(screen.getByRole('button', { name: 'Unlock with passkey' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(PASSKEY_REJECTED_MESSAGE);
    });

    it('rejects a wrong key', async () => {
      setAdminSession('locked');
      vi.mocked(authApi.signInWithKey).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<CardsPage />);

      await userEvent.type(screen.getByLabelText('Admin key'), 'bad-key{Enter}');

      expect(await screen.findByRole('alert')).toHaveTextContent('That admin key was not accepted.');
      expect(screen.getByLabelText('Admin key')).toHaveValue('');
    });

    it('shows only the key form when passkeys are unsupported', () => {
      setAdminSession('locked');
      vi.mocked(getSupportsPasskeys).mockReturnValue(false);
      renderWithProviders(<CardsPage />);
      vi.mocked(getSupportsPasskeys).mockReturnValue(true);

      expect(screen.queryByRole('button', { name: 'Unlock with passkey' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Admin key')).toBeInTheDocument();
    });
  });

  describe('after a key sign-in', () => {
    const signInWithKey = async (): Promise<void> => {
      setAdminSession('locked');
      vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      renderWithProviders(<CardsPage />);
      await userEvent.type(screen.getByLabelText('Admin key'), ' good-key {Enter}');
    };

    it('offers to add a passkey and sends the trimmed key', async () => {
      await signInWithKey();

      expect(await screen.findByText('Add a passkey for this device')).toBeInTheDocument();
      expect(authApi.signInWithKey).toHaveBeenCalledWith('good-key');
    });

    it('keeps the page unlocked when the offer is dismissed', async () => {
      await signInWithKey();

      await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));

      expect(screen.queryByText('Add a passkey for this device')).not.toBeInTheDocument();
      expect(await screen.findByText('Option 0')).toBeInTheDocument();
    });

    it('closes the offer after adding a passkey', async () => {
      await signInWithKey();
      vi.mocked(createPasskey).mockResolvedValue(undefined);

      await userEvent.click(await screen.findByRole('button', { name: 'Add passkey' }));

      await waitFor(() => expect(screen.queryByText('Add a passkey for this device')).not.toBeInTheDocument());
      expect(createPasskey).toHaveBeenCalled();
    });

    it('has no Lock button or passkey list', async () => {
      await signInWithKey();

      await screen.findByText('Option 0');
      expect(screen.queryByRole('button', { name: 'Lock' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Passkeys' })).not.toBeInTheDocument();
    });
  });

  describe('unlocked', () => {
    it('returns to the unlock screen with the session-ended message after a 401', async () => {
      setAdminSession('unlocked');
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      vi.mocked(optionsApi.create).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<CardsPage />);
      await screen.findByText('Option 0');

      await userEvent.type(screen.getByLabelText('New card'), 'Thing');
      await userEvent.click(screen.getByRole('button', { name: 'Add Card' }));

      await waitFor(() => expect(screen.getByLabelText('Admin key')).toBeInTheDocument());
      expect(screen.getByRole('alert')).toHaveTextContent('Your admin session ended. Unlock again.');
    });

  });

  it('writes nothing to sessionStorage or localStorage when signing in with a key', async () => {
    setAdminSession('locked');
    vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
    vi.mocked(optionsApi.getAll).mockResolvedValue([]);
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderWithProviders(<CardsPage />);

    await userEvent.type(screen.getByLabelText('Admin key'), 'secret-key{Enter}');
    await screen.findByText('Add a passkey for this device');

    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});
