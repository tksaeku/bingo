import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { createSavedBoardJson } from './test/factories';
import { renderWithProviders } from './test/renderWithProviders';

vi.mock('./services/api', () => ({
  optionsApi: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn(), delete: vi.fn() },
  leaderboardApi: { getAll: vi.fn().mockResolvedValue([]), submitWin: vi.fn() },
  adminApi: { verify: vi.fn() },
}));

describe('App navigation', () => {
  describe('without a verified admin key', () => {
    it('hides the Manage Options link', () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      renderWithProviders(<App />);

      expect(screen.getByRole('link', { name: 'Play' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Leaderboard' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Manage Options' })).not.toBeInTheDocument();
    });
  });

  describe('with a verified admin key in sessionStorage', () => {
    it('shows the Manage Options link', () => {
      sessionStorage.setItem('bingoAdminKey', 'verified');
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      renderWithProviders(<App />);

      expect(screen.getByRole('link', { name: 'Manage Options' })).toHaveAttribute('href', '/options');
    });
  });

  describe('current page', () => {
    it('marks the active link with aria-current', () => {
      renderWithProviders(<App />, '/leaderboard');

      expect(screen.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Play' })).not.toHaveAttribute('aria-current');
    });
  });

  describe('visiting /options without a key', () => {
    it('shows the admin key form', () => {
      renderWithProviders(<App />, '/options');

      expect(screen.getByLabelText('Admin key')).toBeInTheDocument();
    });
  });
});
