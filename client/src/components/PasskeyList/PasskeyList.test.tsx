import type { ComponentProps } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { passkeysApi } from '../../services/api';
import { createAxiosError } from '../../test/axiosErrors';
import { renderWithProviders } from '../../test/renderWithProviders';
import PasskeyList from './PasskeyList';

vi.mock('../../services/api', () => ({
  passkeysApi: { list: vi.fn(), remove: vi.fn() },
  adminApi: { verify: vi.fn() },
  authApi: { signInWithKey: vi.fn(), signOut: vi.fn() },
}));
vi.mock('../../services/passkeyCeremony', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/passkeyCeremony')>()),
  getSupportsPasskeys: vi.fn(() => true),
}));

const laptop = {
  id: 'p1',
  name: 'Laptop',
  createdAt: '2026-03-04T12:00:00.000Z',
  lastUsedAt: '2026-03-09T12:00:00.000Z',
};
const phone = { id: 'p2', name: 'Phone', createdAt: '2026-03-05T12:00:00.000Z', lastUsedAt: null };

const createProps = (): ComponentProps<typeof PasskeyList> => ({
  isBusy: false,
  onAdd: vi.fn().mockResolvedValue(true),
  onRemovingChange: vi.fn(),
  onSessionEnded: vi.fn(),
});

describe('PasskeyList', () => {
  it('lists passkeys with added and last-used dates', async () => {
    vi.mocked(passkeysApi.list).mockResolvedValue([laptop, phone]);
    renderWithProviders(<PasskeyList {...createProps()} />);

    expect(await screen.findByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText(/Added Mar 4/)).toHaveTextContent('Last used Mar 9');
    expect(screen.getByText(/Added Mar 5/)).toHaveTextContent('Never used');
  });

  it('shows a loading state, then an empty state', async () => {
    vi.mocked(passkeysApi.list).mockResolvedValue([]);
    renderWithProviders(<PasskeyList {...createProps()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading passkeys...');
    expect(await screen.findByText('No passkeys yet.')).toBeInTheDocument();
  });

  it('shows a load error', async () => {
    vi.mocked(passkeysApi.list).mockRejectedValue(createAxiosError(500, 'Boom'));
    renderWithProviders(<PasskeyList {...createProps()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
  });

  describe('removing', () => {
    it('asks for confirmation before removing, and can cancel', async () => {
      vi.mocked(passkeysApi.list).mockResolvedValue([laptop]);
      vi.mocked(passkeysApi.remove).mockClear();
      renderWithProviders(<PasskeyList {...createProps()} />);

      await userEvent.click(await screen.findByRole('button', { name: 'Remove Laptop' }));
      expect(screen.getByText('Remove this passkey?')).toBeInTheDocument();
      expect(passkeysApi.remove).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText('Remove this passkey?')).not.toBeInTheDocument();
    });

    it('removes the passkey on confirm and reloads', async () => {
      vi.mocked(passkeysApi.list).mockResolvedValueOnce([laptop]).mockResolvedValueOnce([]);
      vi.mocked(passkeysApi.remove).mockResolvedValue(undefined);
      renderWithProviders(<PasskeyList {...createProps()} />);

      await userEvent.click(await screen.findByRole('button', { name: 'Remove Laptop' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm remove' }));

      expect(passkeysApi.remove).toHaveBeenCalledWith('p1');
      expect(await screen.findByText('No passkeys yet.')).toBeInTheDocument();
    });

    it('shows the error and keeps the row when removal fails', async () => {
      vi.mocked(passkeysApi.list).mockResolvedValue([laptop]);
      vi.mocked(passkeysApi.remove).mockRejectedValue(createAxiosError(500, 'Nope'));
      renderWithProviders(<PasskeyList {...createProps()} />);

      await userEvent.click(await screen.findByRole('button', { name: 'Remove Laptop' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm remove' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Nope');
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    it('ends the session when removal answers 401', async () => {
      const props = createProps();
      vi.mocked(passkeysApi.list).mockResolvedValue([laptop]);
      vi.mocked(passkeysApi.remove).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<PasskeyList {...props} />);

      await userEvent.click(await screen.findByRole('button', { name: 'Remove Laptop' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm remove' }));

      await waitFor(() => expect(props.onSessionEnded).toHaveBeenCalled());
    });
  });

  describe('removing busy state', () => {
    it('reports the remove request in flight, then settled', async () => {
      const props = createProps();
      vi.mocked(passkeysApi.list).mockResolvedValue([laptop]);
      vi.mocked(passkeysApi.remove).mockResolvedValue(undefined);
      renderWithProviders(<PasskeyList {...props} />);

      await userEvent.click(await screen.findByRole('button', { name: 'Remove Laptop' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm remove' }));

      await waitFor(() => expect(props.onRemovingChange).toHaveBeenLastCalledWith(false));
      expect(props.onRemovingChange).toHaveBeenNthCalledWith(1, true);
    });
  });

  describe('adding', () => {
    it('adds a passkey through onAdd and reloads the list', async () => {
      const props = createProps();
      vi.mocked(passkeysApi.list).mockResolvedValueOnce([]).mockResolvedValueOnce([phone]);
      renderWithProviders(<PasskeyList {...props} />);

      await userEvent.click(await screen.findByRole('button', { name: 'Add a passkey' }));

      expect(props.onAdd).toHaveBeenCalled();
      expect(await screen.findByText('Phone')).toBeInTheDocument();
    });

    it('disables every button while the page is busy', async () => {
      const props = { ...createProps(), isBusy: true };
      vi.mocked(passkeysApi.list).mockResolvedValue([laptop]);
      renderWithProviders(<PasskeyList {...props} />);

      expect(await screen.findByRole('button', { name: 'Add a passkey' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Remove Laptop' })).toBeDisabled();
    });
  });
});
