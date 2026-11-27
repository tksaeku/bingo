import { DEFAULT_CORS_ORIGINS, DEFAULT_PORT, DEFAULT_TRUSTED_PROXY_HOPS } from './constants';

/**
 * Parses a comma-separated CORS_ORIGINS value into an allow-list.
 * Falls back to the default origins when the value is unset or empty.
 */
export function parseCorsOrigins(rawValue: string | undefined): string[] {
  const origins = (rawValue ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  return origins.length > 0 ? origins : [...DEFAULT_CORS_ORIGINS];
}

/** Resolves the listen port from PORT, defaulting when unset or invalid. */
export function parsePort(rawValue: string | undefined): number {
  const port = Number(rawValue);
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT;
}

/** Resolves the number of trusted proxy hops from TRUSTED_PROXY_HOPS, defaulting when unset or not a non-negative integer. */
export function parseTrustedProxyHops(rawValue: string | undefined): number {
  const hops = Number(rawValue);
  return rawValue !== undefined && rawValue.trim() !== '' && Number.isInteger(hops) && hops >= 0 ? hops : DEFAULT_TRUSTED_PROXY_HOPS;
}
