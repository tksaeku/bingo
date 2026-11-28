import { useCallback, useEffect, useRef } from 'react';
import { ANALYTICS_SUMMARY_REFRESH_INTERVAL_MS } from '../constants';
import { analyticsApi } from '../services/api';
import { getIsUnauthorized } from '../services/apiErrors';
import type { AnalyticsRangeDays, AnalyticsSummary, AsyncResource } from '../types';
import { useAsyncResource } from './useAsyncResource';

/** Shown when the summary request fails without a server message. */
const FALLBACK_ERROR_MESSAGE = 'Failed to load the stats.';

/**
 * The analytics summary for the last `days` days as `{ data, loading, error, refetch }`, refreshed every 60 seconds.
 * Changing `days` refetches while the previous data stays available; a 401 calls `onUnauthorized`.
 */
export function useAnalyticsSummary(
  days: AnalyticsRangeDays,
  onUnauthorized: () => void,
): AsyncResource<AnalyticsSummary> {
  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  const fetchSummary = useCallback(
    async (signal: AbortSignal): Promise<AnalyticsSummary> => {
      try {
        return await analyticsApi.getSummary(days, signal);
      } catch (error) {
        if (getIsUnauthorized(error)) {
          onUnauthorizedRef.current();
        }
        throw error;
      }
    },
    [days],
  );

  return useAsyncResource(fetchSummary, FALLBACK_ERROR_MESSAGE, ANALYTICS_SUMMARY_REFRESH_INTERVAL_MS);
}
