import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { analyticsApi } from '../services/api';
import { createAxiosError } from '../test/axiosErrors';
import { createAnalyticsSummary } from '../test/factories';
import { useAnalyticsSummary } from './useAnalyticsSummary';

vi.mock('../services/api', () => ({ analyticsApi: { getSummary: vi.fn() } }));

describe('useAnalyticsSummary', () => {
  it('loads the summary for the key and range', async () => {
    const summary = createAnalyticsSummary({ uniqueVisitors: 9 });
    vi.mocked(analyticsApi.getSummary).mockResolvedValue(summary);
    const { result } = renderHook(() => useAnalyticsSummary(30, vi.fn()));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual(summary));
    expect(analyticsApi.getSummary).toHaveBeenCalledWith(30, expect.any(AbortSignal));
  });

  it('refetches when the range changes and keeps the previous data meanwhile', async () => {
    vi.mocked(analyticsApi.getSummary).mockResolvedValueOnce(createAnalyticsSummary({ uniqueVisitors: 1 }));
    const { result, rerender } = renderHook(({ days }: { days: 1 | 7 }) => useAnalyticsSummary(days, vi.fn()), {
      initialProps: { days: 7 },
    });
    await waitFor(() => expect(result.current.data?.uniqueVisitors).toBe(1));
    vi.mocked(analyticsApi.getSummary).mockImplementation(() => new Promise(() => undefined));

    rerender({ days: 1 });

    expect(result.current.data?.uniqueVisitors).toBe(1);
    expect(result.current.loading).toBe(false);
    await waitFor(() => expect(analyticsApi.getSummary).toHaveBeenLastCalledWith(1, expect.any(AbortSignal)));
  });

  it('reports a 401 through onUnauthorized and still surfaces the error', async () => {
    const onUnauthorized = vi.fn();
    vi.mocked(analyticsApi.getSummary).mockRejectedValue(createAxiosError(401, 'Unauthorized'));
    const { result } = renderHook(() => useAnalyticsSummary(7, onUnauthorized));

    await waitFor(() => expect(result.current.error).toBe('Unauthorized'));
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
