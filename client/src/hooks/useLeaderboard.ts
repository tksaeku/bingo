import { LEADERBOARD_REFRESH_INTERVAL_MS } from '../constants';
import { leaderboardApi } from '../services/api';
import type { AsyncResource, LeaderboardEntry } from '../types';
import { useAsyncResource } from './useAsyncResource';

/** Shown when the leaderboard request fails without a server message. */
const FALLBACK_ERROR_MESSAGE = 'Failed to load the leaderboard.';

/** Stable fetcher so the resource effect does not restart on every render. */
function fetchLeaderboard(signal: AbortSignal): Promise<LeaderboardEntry[]> {
  return leaderboardApi.getAll(signal);
}

/** The leaderboard as `{ data, loading, error, refetch }`, refreshed every 30 seconds. */
export function useLeaderboard(): AsyncResource<LeaderboardEntry[]> {
  return useAsyncResource(fetchLeaderboard, FALLBACK_ERROR_MESSAGE, LEADERBOARD_REFRESH_INTERVAL_MS);
}
