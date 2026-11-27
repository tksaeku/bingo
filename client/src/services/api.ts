import axios from 'axios';
import { ADMIN_KEY_HEADER } from '../constants';
import type { AnalyticsRangeDays, AnalyticsSummary, EventBatch, LeaderboardEntry, Option } from '../types';

/** API base URL from `VITE_API_URL`, when configured. */
const configuredBaseUrl: string | undefined = import.meta.env.VITE_API_URL;
/** Base URL used for every request; falls back to the local dev server. */
const API_BASE_URL = configuredBaseUrl ?? '/api';

/** Shared axios instance for the bingo API. */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Builds the request config that carries the admin key. */
function getAdminConfig(adminKey: string): { headers: Record<string, string> } {
  return { headers: { [ADMIN_KEY_HEADER]: adminKey } };
}

/** Option endpoints. Writes require the admin key. */
export const optionsApi = {
  getAll: async (signal?: AbortSignal): Promise<Option[]> => {
    const response = await apiClient.get<Option[]>('/options', { signal });
    return response.data;
  },
  create: async (text: string, adminKey: string): Promise<Option> => {
    const response = await apiClient.post<Option>('/options', { text }, getAdminConfig(adminKey));
    return response.data;
  },
  delete: async (id: string, adminKey: string): Promise<void> => {
    await apiClient.delete(`/options/${encodeURIComponent(id)}`, getAdminConfig(adminKey));
  },
};

/** Leaderboard endpoints. */
export const leaderboardApi = {
  getAll: async (signal?: AbortSignal): Promise<LeaderboardEntry[]> => {
    const response = await apiClient.get<LeaderboardEntry[]>('/leaderboard', { signal });
    return response.data;
  },
  submitWin: async (playerName: string): Promise<LeaderboardEntry> => {
    const response = await apiClient.post<LeaderboardEntry>('/leaderboard', { playerName });
    return response.data;
  },
};

/** Admin endpoints. */
export const adminApi = {
  verify: async (adminKey: string, signal?: AbortSignal): Promise<void> => {
    await apiClient.get('/admin/verify', { ...getAdminConfig(adminKey), signal });
  },
};

/** Analytics endpoints. */
export const analyticsApi = {
  /** Sends a batch and resolves with the HTTP status; rejects only when no response arrives. */
  sendEvents: async (batch: EventBatch, options: { keepalive: boolean }): Promise<number> => {
    if (options.keepalive) {
      const response = await fetch(`${API_BASE_URL}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
        keepalive: true,
      });
      return response.status;
    }
    const response = await apiClient.post('/analytics/events', batch, {
      validateStatus: () => true,
    });
    return response.status;
  },
  getSummary: async (adminKey: string, days: AnalyticsRangeDays, signal?: AbortSignal): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>('/admin/analytics', {
      ...getAdminConfig(adminKey),
      params: { days },
      signal,
    });
    return response.data;
  },
};
