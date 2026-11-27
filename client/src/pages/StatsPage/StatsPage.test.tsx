import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi, analyticsApi } from '../../services/api';
import { createAxiosError } from '../../test/axiosErrors';
import { createAnalyticsSummary } from '../../test/factories';
import { renderWithProviders } from '../../test/renderWithProviders';
import StatsPage from './StatsPage';

vi.mock('../../services/api', () => ({
  adminApi: { verify: vi.fn() },
  analyticsApi: { getSummary: vi.fn() },
}));

describe('StatsPage', () => {
  it('shows the key form without a key and the dashboard after unlocking', async () => {
    vi.mocked(adminApi.verify).mockResolvedValue(undefined);
    vi.mocked(analyticsApi.getSummary).mockResolvedValue(createAnalyticsSummary());
    renderWithProviders(<StatsPage />);

    await userEvent.type(screen.getByLabelText('Admin key'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Unlock' }));

    expect(await screen.findByText('Unique visitors')).toBeInTheDocument();
    expect(analyticsApi.getSummary).toHaveBeenCalledWith('secret', 7, expect.any(AbortSignal));
  });

  it('returns to the key form with a message when the summary answers 401', async () => {
    sessionStorage.setItem('bingoAdminKey', 'stale');
    vi.mocked(analyticsApi.getSummary).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
    renderWithProviders(<StatsPage />);

    expect(await screen.findByLabelText('Admin key')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Your admin key was rejected. Enter it again.');
    expect(sessionStorage.getItem('bingoAdminKey')).toBeNull();
  });
});
