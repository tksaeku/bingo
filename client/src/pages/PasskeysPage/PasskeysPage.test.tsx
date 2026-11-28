import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi, authApi, passkeysApi } from '../../services/api';
import { setAdminSession } from '../../services/adminSessionStore';
import { createPasskey } from '../../services/passkeyCeremony';
import { createAxiosError } from '../../test/axiosErrors';
import { renderWithProviders } from '../../test/renderWithProviders';
import PasskeysPage from './PasskeysPage';

vi.mock('../../services/api', () => ({
  adminApi: { verify: vi.fn() },
  authApi: { signInWithKey: vi.fn(), signOut: vi.fn() },
  passkeysApi: { list: vi.fn(), remove: vi.fn() },
}));
vi.mock('../../services/passkeyCeremony', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/passkeyCeremony')>()),
  getSupportsPasskeys: vi.fn(() => true),
  unlockWithPasskey: vi.fn(),
  createPasskey: vi.fn(),
}));

const laptop = { id: 'p1', name: 'Laptop', createdAt: '2026-03-04T12:00:00.000Z', lastUsedAt: null };

describe('PasskeysPage', () => {
  describe('checking the session', () => {
    it('shows a loading state, then the passkey list when the session is valid', async () => {
      vi.mocked(adminApi.verify).mockResolvedValue(undefined);
      vi.mocked(passkeysApi.list).mockResolvedValue([laptop]);
      renderWithProviders(<PasskeysPage />);

      expect(screen.getByRole('status')).toHaveTextContent('Checking admin session...');
      expect(await screen.findByText('Laptop')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Passkeys' })).toBeInTheDocument();
    });

    it('shows the unlock screen when there is no session', async () => {
      vi.mocked(adminApi.verify).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<PasskeysPage />);

      expect(await screen.findByRole('button', { name: 'Unlock with passkey' })).toBeInTheDocument();
      expect(screen.getByText('Unlock to manage the admin passkeys.')).toBeInTheDocument();
      expect(passkeysApi.list).not.toHaveBeenCalled();
    });
  });

  describe('unlocked', () => {
    it('locks from the Lock button', async () => {
      setAdminSession('unlocked');
      vi.mocked(passkeysApi.list).mockResolvedValue([]);
      vi.mocked(authApi.signOut).mockResolvedValue(undefined);
      renderWithProviders(<PasskeysPage />);

      await userEvent.click(await screen.findByRole('button', { name: 'Lock' }));

      expect(authApi.signOut).toHaveBeenCalled();
      expect(await screen.findByRole('button', { name: 'Unlock with passkey' })).toBeInTheDocument();
    });

    it('returns to the unlock screen with the session-ended message when the list answers 401', async () => {
      setAdminSession('unlocked');
      vi.mocked(passkeysApi.list).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<PasskeysPage />);

      await waitFor(() => expect(screen.getByLabelText('Admin key')).toBeInTheDocument());
      expect(screen.getByRole('alert')).toHaveTextContent('Your admin session ended. Unlock again.');
    });
  });

  describe('after a key sign-in', () => {
    const signInWithKeyAndWaitForList = async (): Promise<void> => {
      setAdminSession('locked');
      vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
      vi.mocked(passkeysApi.list).mockResolvedValue([laptop]);
      renderWithProviders(<PasskeysPage />);
      await userEvent.type(screen.getByLabelText('Admin key'), 'good-key{Enter}');
      await screen.findByRole('button', { name: 'Remove Laptop' });
    };

    it('adds a passkey from the offer and refreshes the list', async () => {
      await signInWithKeyAndWaitForList();
      vi.mocked(createPasskey).mockResolvedValue(undefined);
      vi.mocked(passkeysApi.list).mockResolvedValue([
        laptop,
        { id: 'p2', name: 'Phone', createdAt: '2026-03-05T12:00:00.000Z', lastUsedAt: null },
      ]);

      await userEvent.click(screen.getByRole('button', { name: 'Add passkey' }));

      expect(await screen.findByText('Phone')).toBeInTheDocument();
      expect(screen.queryByText('Add a passkey for this device')).not.toBeInTheDocument();
    });

    it('disables the other add button, Lock and Remove while the offer adds a passkey', async () => {
      await signInWithKeyAndWaitForList();
      vi.mocked(createPasskey).mockImplementation(() => new Promise(() => undefined));

      await userEvent.click(screen.getByRole('button', { name: 'Add passkey' }));

      expect(screen.getByRole('button', { name: 'Add passkey' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Add a passkey' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Lock' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Remove Laptop' })).toBeDisabled();
    });

    it('disables the offer, Lock and Remove while the list adds a passkey', async () => {
      await signInWithKeyAndWaitForList();
      vi.mocked(createPasskey).mockImplementation(() => new Promise(() => undefined));

      await userEvent.click(screen.getByRole('button', { name: 'Add a passkey' }));

      expect(screen.getByRole('button', { name: 'Add passkey' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Add a passkey' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Lock' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Remove Laptop' })).toBeDisabled();
    });

    it('disables both add buttons and Lock while a remove is pending', async () => {
      await signInWithKeyAndWaitForList();
      vi.mocked(passkeysApi.remove).mockImplementation(() => new Promise(() => undefined));

      await userEvent.click(screen.getByRole('button', { name: 'Remove Laptop' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm remove' }));

      expect(screen.getByRole('button', { name: 'Add passkey' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Add a passkey' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Lock' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Confirm remove' })).toBeDisabled();
    });
  });
});
