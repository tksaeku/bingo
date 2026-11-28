import { DEFAULT_CORS_ORIGINS, DEFAULT_PORT, DEFAULT_TRUSTED_PROXY_HOPS, DEFAULT_WEBAUTHN_ORIGINS, DEFAULT_WEBAUTHN_RP_ID } from './constants';

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

/** Analytics collection is on only when ANALYTICS_ENABLED is exactly the string 'true'. */
export function parseAnalyticsEnabled(rawValue: string | undefined): boolean {
  return rawValue === 'true';
}

/** Parses a comma-separated WEBAUTHN_ORIGINS value; falls back to the default origins when unset or empty. */
export function parseWebAuthnOrigins(rawValue: string | undefined): string[] {
  const origins = (rawValue ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  return origins.length > 0 ? origins : [...DEFAULT_WEBAUTHN_ORIGINS];
}

/** Resolves the WebAuthn relying party ID from WEBAUTHN_RP_ID, defaulting when unset or blank. */
export function parseWebAuthnRpId(rawValue: string | undefined): string {
  const rpId = (rawValue ?? '').trim();
  return rpId.length > 0 ? rpId : DEFAULT_WEBAUTHN_RP_ID;
}
