import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { analyticsApi } from '../../../services/api';
import { createAxiosError } from '../../../test/axiosErrors';
import { createAnalyticsSummary } from '../../../test/factories';
import { renderWithProviders } from '../../../test/renderWithProviders';
import StatsDashboard from './StatsDashboard';

vi.mock('../../../services/api', () => ({ analyticsApi: { getSummary: vi.fn() } }));

function createRangeSummary(dayCount: number, visited = 10): ReturnType<typeof createAnalyticsSummary> {
  const base = createAnalyticsSummary();
  const days = Array.from({ length: dayCount }, (_, index) => ({
    ...base.days[0],
    day: `2026-11-${String(index + 1).padStart(2, '0')}`,
  }));
  return createAnalyticsSummary({
    uniqueVisitors: visited,
    days,
    totals: { ...base.totals, funnel: { ...base.totals.funnel, visited } },
  });
}

describe('StatsDashboard', () => {
  it('shows a loading state, then the dashboard sections', async () => {
    vi.mocked(analyticsApi.getSummary).mockResolvedValue(createRangeSummary(7, 100));
    renderWithProviders(<StatsDashboard adminKey="k" onUnauthorized={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading stats...');
    expect(await screen.findByText('Unique visitors')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Funnel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Activity by hour' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'By day' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page views' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Outbound clicks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Devices' })).toBeInTheDocument();
    expect(screen.getAllByText(/Times in Pacific Time/).length).toBeGreaterThan(0);
    expect(analyticsApi.getSummary).toHaveBeenCalledWith('k', 7, expect.any(AbortSignal));
  });

  it('defaults to the last 7 days and refetches when another range is picked', async () => {
    vi.mocked(analyticsApi.getSummary).mockImplementation(async (_key, days) => createRangeSummary(days));
    renderWithProviders(<StatsDashboard adminKey="k" onUnauthorized={vi.fn()} />);
    await screen.findByText('Unique visitors');

    expect(screen.getByRole('button', { name: 'Last 7 days' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'true');
    await vi.waitFor(() => expect(analyticsApi.getSummary).toHaveBeenLastCalledWith('k', 1, expect.any(AbortSignal)));
    await vi.waitFor(() => expect(screen.queryByText(/Updating/)).not.toBeInTheDocument());
  });

  it('keeps the numbers on screen while refreshing', async () => {
    vi.mocked(analyticsApi.getSummary).mockResolvedValueOnce(createRangeSummary(7, 321));
    renderWithProviders(<StatsDashboard adminKey="k" onUnauthorized={vi.fn()} />);
    await screen.findByText('321');
    vi.mocked(analyticsApi.getSummary).mockImplementation(() => new Promise(() => undefined));

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(screen.getAllByText('321').length).toBeGreaterThan(0);
    expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument();
  });

  it('shows an error, not zeros, when the first load fails', async () => {
    vi.mocked(analyticsApi.getSummary).mockRejectedValue(createAxiosError(500, 'Server exploded'));
    renderWithProviders(<StatsDashboard adminKey="k" onUnauthorized={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded');
    expect(screen.queryByText('Unique visitors')).not.toBeInTheDocument();
  });

  it('keeps stale numbers visible with a could-not-refresh note when a refresh fails', async () => {
    vi.mocked(analyticsApi.getSummary).mockResolvedValueOnce(createRangeSummary(7, 321));
    renderWithProviders(<StatsDashboard adminKey="k" onUnauthorized={vi.fn()} />);
    await screen.findByText('321');
    vi.mocked(analyticsApi.getSummary).mockRejectedValue(createAxiosError(500, 'Server exploded'));

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't refresh: Server exploded");
    expect(screen.getAllByText('321').length).toBeGreaterThan(0);
  });

  it('calls onUnauthorized on a 401', async () => {
    const onUnauthorized = vi.fn();
    vi.mocked(analyticsApi.getSummary).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
    renderWithProviders(<StatsDashboard adminKey="bad" onUnauthorized={onUnauthorized} />);

    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it('renders a zero-filled summary cleanly', async () => {
    vi.mocked(analyticsApi.getSummary).mockResolvedValue(createRangeSummary(7, 0));
    renderWithProviders(<StatsDashboard adminKey="k" onUnauthorized={vi.fn()} />);

    const funnel = (await screen.findByRole('heading', { name: 'Funnel' })).closest('section') as HTMLElement;
    expect(within(funnel).getAllByText('0 · 0%')).toHaveLength(5);
    expect(screen.getByText('No activity in this range yet.')).toBeInTheDocument();
  });
});
