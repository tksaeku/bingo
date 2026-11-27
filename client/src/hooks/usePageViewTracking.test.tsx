import { StrictMode } from 'react';
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { trackEvent } from '../services/analytics';
import { usePageViewTracking } from './usePageViewTracking';

vi.mock('../services/analytics', () => ({ trackEvent: vi.fn() }));

const Tracked = (): ReactElement => {
  usePageViewTracking();
  return <Link to="/leaderboard">go</Link>;
};

function renderAt(route: string, isStrict = false): void {
  const tree = (
    <MemoryRouter initialEntries={[route]}>
      <Tracked />
    </MemoryRouter>
  );
  render(isStrict ? <StrictMode>{tree}</StrictMode> : tree);
}

describe('usePageViewTracking', () => {
  it.each([
    ['/', 'play'],
    ['/leaderboard', 'leaderboard'],
    ['/cards', 'options'],
  ])('tracks %s as the %s route', (path, route) => {
    vi.mocked(trackEvent).mockClear();
    renderAt(path);

    expect(trackEvent).toHaveBeenCalledWith({ name: 'page_view', properties: { route } });
  });

  it('skips /stats and unknown paths', () => {
    vi.mocked(trackEvent).mockClear();
    renderAt('/stats');
    renderAt('/nowhere');

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('tracks once under StrictMode', () => {
    vi.mocked(trackEvent).mockClear();
    renderAt('/', true);

    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it('tracks each navigation to a tracked route', async () => {
    vi.mocked(trackEvent).mockClear();
    renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: 'go' }));

    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenLastCalledWith({
      name: 'page_view',
      properties: { route: 'leaderboard' },
    });
  });
});
