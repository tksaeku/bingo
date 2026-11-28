import axios from 'axios';
import type {
  AdminPasskey,
  AnalyticsRangeDays,
  AnalyticsSummary,
  AuthenticationResponseJSON,
  EventBatch,
  LeaderboardEntry,
  Option,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '../types';

/** API base URL from `VITE_API_URL`, when configured. */
const configuredBaseUrl: string | undefined = import.meta.env.VITE_API_URL;
/** Base URL used for every request; falls back to the local dev server. */
const API_BASE_URL = configuredBaseUrl ?? '/api';

/** Shared axios instance for the bingo API. */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Option endpoints. Writes require an admin session. */
export const optionsApi = {
  getAll: async (signal?: AbortSignal): Promise<Option[]> => {
    const response = await apiClient.get<Option[]>('/options', { signal });
    return response.data;
  },
  create: async (text: string): Promise<Option> => {
    const response = await apiClient.post<Option>('/options', { text });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/options/${encodeURIComponent(id)}`);
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

/** Admin endpoints. The session cookie authorizes them. */
export const adminApi = {
  verify: async (signal?: AbortSignal): Promise<void> => {
    await apiClient.get('/admin/verify', { signal });
  },
};

/** Sign-in and sign-out endpoints. */
export const authApi = {
  signInWithKey: async (adminKey: string): Promise<void> => {
    await apiClient.post('/auth/session', { adminKey });
  },
  signOut: async (): Promise<void> => {
    await apiClient.delete('/auth/session');
  },
  getPasskeyOptions: async (): Promise<PublicKeyCredentialRequestOptionsJSON> => {
    const response =
      await apiClient.post<PublicKeyCredentialRequestOptionsJSON>('/auth/passkey/options');
    return response.data;
  },
  verifyPasskey: async (response: AuthenticationResponseJSON): Promise<void> => {
    await apiClient.post('/auth/passkey/verify', { response });
  },
};

/** Passkey management endpoints (admin session required). */
export const passkeysApi = {
  getRegistrationOptions: async (): Promise<PublicKeyCredentialCreationOptionsJSON> => {
    const response = await apiClient.post<PublicKeyCredentialCreationOptionsJSON>(
      '/admin/passkeys/registration-options'
    );
    return response.data;
  },
  register: async (response: RegistrationResponseJSON, name?: string): Promise<AdminPasskey> => {
    const created = await apiClient.post<AdminPasskey>('/admin/passkeys', { response, name });
    return created.data;
  },
  list: async (signal?: AbortSignal): Promise<AdminPasskey[]> => {
    const response = await apiClient.get<AdminPasskey[]>('/admin/passkeys', { signal });
    return response.data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/passkeys/${encodeURIComponent(id)}`);
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
  getSummary: async (days: AnalyticsRangeDays, signal?: AbortSignal): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>('/admin/analytics', {
      params: { days },
      signal,
    });
    return response.data;
  },
};
