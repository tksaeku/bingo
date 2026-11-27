import axios from 'axios';
import type { ApiErrorBody } from '../types';

/** Narrows an unknown response body to the API's `{ error: string }` shape. */
function getIsApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as Record<string, unknown>).error === 'string'
  );
}

/** HTTP status of a failed request, or undefined for non-HTTP failures. */
export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** True when the server rejected the admin key. */
export function getIsUnauthorized(error: unknown): boolean {
  return getErrorStatus(error) === 401;
}

/** True when the request was canceled via AbortController. */
export function getIsCanceled(error: unknown): boolean {
  return axios.isCancel(error);
}

/**
 * Picks a user-facing message: the server's `error` text when present,
 * a connectivity message when no response arrived, otherwise the fallback.
 */
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }
  if (error.response === undefined) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  const body: unknown = error.response.data;
  return getIsApiErrorBody(body) ? body.error : fallbackMessage;
}
