import { optionsApi } from '../services/api';
import type { AsyncResource, Option } from '../types';
import { useAsyncResource } from './useAsyncResource';

/** Shown when the options request fails without a server message. */
const FALLBACK_ERROR_MESSAGE = 'Failed to load options.';

/** Stable fetcher so the resource effect does not restart on every render. */
function fetchOptions(signal: AbortSignal): Promise<Option[]> {
  return optionsApi.getAll(signal);
}

/** The option pool as `{ data, loading, error, refetch }`. */
export function useOptions(): AsyncResource<Option[]> {
  return useAsyncResource(fetchOptions, FALLBACK_ERROR_MESSAGE);
}
