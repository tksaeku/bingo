import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { passkeysApi } from '../services/api';
import { createAxiosError } from '../test/axiosErrors';
import { usePasskeys } from './usePasskeys';

vi.mock('../services/api', () => ({ passkeysApi: { list: vi.fn(), remove: vi.fn() } }));

const passkey = {
  id: 'p1',
  name: 'Laptop',
  createdAt: '2026-01-02T00:00:00.000Z',
  lastUsedAt: null,
};

describe('usePasskeys', () => {
  it('loads the passkeys', async () => {
    vi.mocked(passkeysApi.list).mockResolvedValue([passkey]);
    const { result } = renderHook(() => usePasskeys(vi.fn()));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual([passkey]));
  });

  it('reports a load failure', async () => {
    vi.mocked(passkeysApi.list).mockRejectedValue(createAxiosError(500, 'Boom'));
    const { result } = renderHook(() => usePasskeys(vi.fn()));

    await waitFor(() => expect(result.current.error).toBe('Boom'));
  });

  it('calls onUnauthorized when the list answers 401', async () => {
    vi.mocked(passkeysApi.list).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
    const onUnauthorized = vi.fn();
    renderHook(() => usePasskeys(onUnauthorized));

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
  });

  it('removes a passkey and reloads the list', async () => {
    vi.mocked(passkeysApi.list).mockResolvedValueOnce([passkey]).mockResolvedValueOnce([]);
    vi.mocked(passkeysApi.remove).mockResolvedValue(undefined);
    const { result } = renderHook(() => usePasskeys(vi.fn()));
    await waitFor(() => expect(result.current.data).toEqual([passkey]));

    await act(async () => {
      await result.current.remove('p1');
    });

    expect(passkeysApi.remove).toHaveBeenCalledWith('p1');
    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});
