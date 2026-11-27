import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { leaderboardApi } from '../../services/api';
import { createAxiosError } from '../../test/axiosErrors';
import { createLeaderboardEntries } from '../../test/factories';
import { renderWithProviders } from '../../test/renderWithProviders';
import Leaderboard from './Leaderboard';

vi.mock('../../services/api', () => ({
  optionsApi: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
  leaderboardApi: { getAll: vi.fn(), submitWin: vi.fn() },
  adminApi: { verify: vi.fn() },
}));

describe('Leaderboard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('loading', () => {
    it('shows a loading status first, then the rows with ranks', async () => {
      vi.mocked(leaderboardApi.getAll).mockResolvedValue(createLeaderboardEntries(4));
      renderWithProviders(<Leaderboard />);

      expect(screen.getByRole('status')).toHaveTextContent('Loading leaderboard...');
      expect(await screen.findByText('Player 0')).toBeInTheDocument();
      expect(screen.getByText('01')).toBeInTheDocument();
      expect(screen.getByText('04')).toBeInTheDocument();
      expect(screen.getAllByRole('row')).toHaveLength(5);
    });
  });

  describe('empty and error states', () => {
    it('shows the empty message when there are no winners', async () => {
      vi.mocked(leaderboardApi.getAll).mockResolvedValue([]);
      renderWithProviders(<Leaderboard />);

      expect(await screen.findByText('No winners yet. Be the first!')).toBeInTheDocument();
    });

    it('shows an error, not the empty message, when the fetch fails', async () => {
      vi.mocked(leaderboardApi.getAll).mockRejectedValue(createAxiosError(500, 'Boom'));
      renderWithProviders(<Leaderboard />);

      expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
      expect(screen.queryByText('No winners yet. Be the first!')).not.toBeInTheDocument();
    });
  });

  describe('refreshing', () => {
    it('keeps the table visible while the Refresh request is pending', async () => {
      vi.mocked(leaderboardApi.getAll).mockResolvedValueOnce(createLeaderboardEntries(2));
      renderWithProviders(<Leaderboard />);
      await screen.findByText('Player 0');

      vi.mocked(leaderboardApi.getAll).mockReturnValueOnce(new Promise(() => undefined));
      await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

      expect(screen.getByText('Player 0')).toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(leaderboardApi.getAll).toHaveBeenCalledTimes(2);
    });

    it('keeps old rows and shows an error when a refresh fails', async () => {
      vi.mocked(leaderboardApi.getAll).mockResolvedValueOnce(createLeaderboardEntries(2));
      renderWithProviders(<Leaderboard />);
      await screen.findByText('Player 0');

      vi.mocked(leaderboardApi.getAll).mockRejectedValueOnce(createAxiosError(500, 'Refresh failed'));
      await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Refresh failed');
      expect(screen.getByText('Player 0')).toBeInTheDocument();
    });

    it('refreshes automatically every 30 seconds', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.mocked(leaderboardApi.getAll).mockResolvedValue(createLeaderboardEntries(1));
      renderWithProviders(<Leaderboard />);
      await screen.findByText('Player 0');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });
      expect(leaderboardApi.getAll).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Player 0')).toBeInTheDocument();
    });
  });
});
