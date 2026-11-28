import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { adminApi, analyticsApi, authApi } from '../../services/api';
import { setAdminSession } from '../../services/adminSessionStore';
import { createAxiosError } from '../../test/axiosErrors';
import { createAnalyticsSummary } from '../../test/factories';
import { renderWithProviders } from '../../test/renderWithProviders';
import StatsPage from './StatsPage';

vi.mock('../../services/api', () => ({
  adminApi: { verify: vi.fn() },
  authApi: { signInWithKey: vi.fn(), signOut: vi.fn() },
  analyticsApi: { getSummary: vi.fn() },
}));
vi.mock('../../services/passkeyCeremony', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/passkeyCeremony')>()),
  getSupportsPasskeys: vi.fn(() => true),
  unlockWithPasskey: vi.fn(),
  createPasskey: vi.fn(),
}));

describe('StatsPage', () => {
  it('shows a loading state, then the dashboard when the session is valid', async () => {
    vi.mocked(adminApi.verify).mockResolvedValue(undefined);
    vi.mocked(analyticsApi.getSummary).mockResolvedValue(createAnalyticsSummary());
    renderWithProviders(<StatsPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Checking admin session...');
    expect(await screen.findByText('Unique visitors')).toBeInTheDocument();
    expect(analyticsApi.getSummary).toHaveBeenCalledWith(7, expect.any(AbortSignal));
  });

  it('shows the unlock screen, then the dashboard after a key sign-in', async () => {
    setAdminSession('locked');
    vi.mocked(authApi.signInWithKey).mockResolvedValue(undefined);
    vi.mocked(analyticsApi.getSummary).mockResolvedValue(createAnalyticsSummary());
    renderWithProviders(<StatsPage />);
    expect(screen.getByText('Unlock to view the usage stats.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Admin key'), 'secret');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Unique visitors')).toBeInTheDocument();
    expect(screen.getByText('Add a passkey for this device')).toBeInTheDocument();
  });

  it('returns to the unlock screen with a message when the summary answers 401', async () => {
    setAdminSession('unlocked');
    vi.mocked(analyticsApi.getSummary).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
    renderWithProviders(<StatsPage />);

    expect(await screen.findByLabelText('Admin key')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Your admin session ended. Unlock again.');
  });

  it('has no Lock button', async () => {
    setAdminSession('unlocked');
    vi.mocked(analyticsApi.getSummary).mockResolvedValue(createAnalyticsSummary());
    renderWithProviders(<StatsPage />);

    await waitFor(() => expect(analyticsApi.getSummary).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Lock' })).not.toBeInTheDocument();
  });
});
