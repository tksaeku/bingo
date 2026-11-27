import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { trackEvent } from './services/analytics';
import { analyticsApi } from './services/api';
import { createSavedBoardJson } from './test/factories';
import { renderWithProviders } from './test/renderWithProviders';

vi.mock('./services/api', () => ({
  optionsApi: { getAll: vi.fn().mockResolvedValue([]), create: vi.fn(), delete: vi.fn() },
  leaderboardApi: { getAll: vi.fn().mockResolvedValue([]), submitWin: vi.fn() },
  adminApi: { verify: vi.fn() },
  analyticsApi: { getSummary: vi.fn() },
}));

vi.mock('./services/analytics', () => ({ trackEvent: vi.fn() }));

describe('App navigation', () => {
  describe('without a verified admin key', () => {
    it('shows Play and Leaderboard but no cards link', () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      renderWithProviders(<App />);

      expect(screen.getByRole('link', { name: 'Play' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Leaderboard' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Manage Cards' })).not.toBeInTheDocument();
    });
  });

  describe('with a verified admin key in sessionStorage', () => {
    it('still hides the cards link', () => {
      sessionStorage.setItem('bingoAdminKey', 'verified');
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      renderWithProviders(<App />);

      expect(screen.queryByRole('link', { name: 'Manage Cards' })).not.toBeInTheDocument();
    });
  });

  describe('current page', () => {
    it('marks the active link with aria-current', () => {
      renderWithProviders(<App />, '/leaderboard');

      expect(screen.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'Play' })).not.toHaveAttribute('aria-current');
    });
  });

  describe('visiting /cards without a key', () => {
    it('shows the admin key form', () => {
      renderWithProviders(<App />, '/cards');

      expect(screen.getByLabelText('Admin key')).toBeInTheDocument();
    });
  });

  describe('visiting the old /options path', () => {
    it('redirects to the cards page', () => {
      renderWithProviders(<App />, '/options');

      expect(screen.getByRole('heading', { name: 'Admin Access' })).toBeInTheDocument();
    });
  });

  describe('outbound links', () => {
    it('tracks header and footer clicks with their placement', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      vi.mocked(trackEvent).mockClear();
      renderWithProviders(<App />);
      const [headerLink, footerLink] = screen.getAllByRole('link', {
        name: 'Visit The Open website',
      });

      await userEvent.click(headerLink);
      await userEvent.click(footerLink);

      expect(trackEvent).toHaveBeenCalledWith({
        name: 'outbound_click',
        properties: { placement: 'header' },
      });
      expect(trackEvent).toHaveBeenCalledWith({
        name: 'outbound_click',
        properties: { placement: 'footer' },
      });
    });
  });

  describe('page views', () => {
    it('tracks the route on first render', () => {
      vi.mocked(trackEvent).mockClear();
      renderWithProviders(<App />, '/leaderboard');

      expect(trackEvent).toHaveBeenCalledWith({
        name: 'page_view',
        properties: { route: 'leaderboard' },
      });
    });
  });

  describe('Stats link', () => {
    it('is never shown in the nav, even with a verified key', () => {
      sessionStorage.setItem('bingoAdminKey', 'verified');
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      renderWithProviders(<App />);

      expect(screen.queryByRole('link', { name: 'Stats' })).not.toBeInTheDocument();
    });
  });

  describe('visiting /stats with the key verified on /cards', () => {
    it('shows the dashboard without asking for the key again', () => {
      sessionStorage.setItem('bingoAdminKey', 'verified');
      vi.mocked(analyticsApi.getSummary).mockReturnValue(new Promise(() => undefined));
      renderWithProviders(<App />, '/stats');

      expect(screen.getByRole('heading', { name: /Stats\./ })).toBeInTheDocument();
      expect(screen.queryByLabelText('Admin key')).not.toBeInTheDocument();
    });
  });

  describe('visiting /stats without a key', () => {
    it('shows the admin key form and does not track a page view', () => {
      vi.mocked(trackEvent).mockClear();
      renderWithProviders(<App />, '/stats');

      expect(screen.getByLabelText('Admin key')).toBeInTheDocument();
      expect(trackEvent).not.toHaveBeenCalled();
    });
  });
});
