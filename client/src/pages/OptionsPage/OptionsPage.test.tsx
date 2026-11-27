import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi, optionsApi } from '../../services/api';
import { createAxiosError } from '../../test/axiosErrors';
import { createOptions } from '../../test/factories';
import { renderWithProviders } from '../../test/renderWithProviders';
import OptionsPage from './OptionsPage';

vi.mock('../../services/api', () => ({
  optionsApi: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
  leaderboardApi: { getAll: vi.fn(), submitWin: vi.fn() },
  adminApi: { verify: vi.fn() },
}));

describe('OptionsPage', () => {
  describe('without a stored key', () => {
    it('shows the admin key form and no options', () => {
      renderWithProviders(<OptionsPage />);

      expect(screen.getByLabelText('Admin key')).toBeInTheDocument();
      expect(optionsApi.getAll).not.toHaveBeenCalled();
    });

    it('verifies a correct key, stores it, and reveals the editor', async () => {
      vi.mocked(adminApi.verify).mockResolvedValue(undefined);
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      renderWithProviders(<OptionsPage />);

      await userEvent.type(screen.getByLabelText('Admin key'), ' good-key {Enter}');

      expect(await screen.findByText('Option 0')).toBeInTheDocument();
      expect(adminApi.verify).toHaveBeenCalledWith('good-key', expect.anything());
      expect(sessionStorage.getItem('bingoAdminKey')).toBe('good-key');
    });

    it('rejects a wrong key without storing it', async () => {
      vi.mocked(adminApi.verify).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<OptionsPage />);

      await userEvent.type(screen.getByLabelText('Admin key'), 'bad-key{Enter}');

      expect(await screen.findByRole('alert')).toHaveTextContent('That admin key was not accepted.');
      expect(sessionStorage.getItem('bingoAdminKey')).toBeNull();
      expect(screen.getByLabelText('Admin key')).toBeInTheDocument();
    });

    it('does not call the server for an empty key', async () => {
      renderWithProviders(<OptionsPage />);

      await userEvent.type(screen.getByLabelText('Admin key'), '   {Enter}');

      expect(await screen.findByRole('alert')).toHaveTextContent('Enter the admin key.');
      expect(adminApi.verify).not.toHaveBeenCalled();
    });
  });

  describe('with a stored key', () => {
    it('shows the editor', async () => {
      sessionStorage.setItem('bingoAdminKey', 'stored');
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      renderWithProviders(<OptionsPage />);

      expect(await screen.findByText('Option 0')).toBeInTheDocument();
    });

    it('clears the key and returns to the form after a 401', async () => {
      sessionStorage.setItem('bingoAdminKey', 'stale');
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(1));
      vi.mocked(optionsApi.create).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
      renderWithProviders(<OptionsPage />);
      await screen.findByText('Option 0');

      await userEvent.type(screen.getByLabelText('New option'), 'Thing');
      await userEvent.click(screen.getByRole('button', { name: 'Add Option' }));

      await waitFor(() => expect(screen.getByLabelText('Admin key')).toBeInTheDocument());
      expect(sessionStorage.getItem('bingoAdminKey')).toBeNull();
      expect(screen.getByRole('alert')).toHaveTextContent('Your admin key was rejected');
    });
  });
});
