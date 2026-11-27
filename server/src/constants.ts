/** Firestore collection holding the option pool. */
export const OPTIONS_COLLECTION = 'options';
/** Firestore collection holding leaderboard entries, keyed by normalized player name. */
export const LEADERBOARD_COLLECTION = 'leaderboard';

/** Maximum number of options in the pool. */
export const MAX_OPTIONS = 200;
/** Maximum option text length after trimming. */
export const MAX_OPTION_LENGTH = 100;
/** Maximum player name length after whitespace collapse. */
export const MAX_PLAYER_NAME_LENGTH = 20;

/** Number of leaderboard entries returned. */
export const LEADERBOARD_LIMIT = 20;
/** Rows fetched by wins before the in-memory lastWin tie-break; avoids a composite index. */
export const LEADERBOARD_QUERY_HEADROOM = 100;

/** Maximum operations per Firestore write batch. */
export const FIRESTORE_BATCH_LIMIT = 500;

/** Listen port when PORT is unset or invalid. */
export const DEFAULT_PORT = 5174;
/** Maximum JSON request body size. */
export const JSON_BODY_LIMIT = '10kb';
/** Request header carrying the admin key. */
export const ADMIN_KEY_HEADER = 'x-admin-key';
/** Trusted proxy hops when TRUSTED_PROXY_HOPS is unset or invalid. */
export const DEFAULT_TRUSTED_PROXY_HOPS = 1;

/**
 * CORS allow-list used when CORS_ORIGINS is unset. The production client is served by this same
 * server (same origin), so cross-origin access is only needed for the Vite dev server.
 */
export const DEFAULT_CORS_ORIGINS: readonly string[] = ['http://localhost:5173'];

/** Rate-limit window (one minute). */
export const RATE_LIMIT_WINDOW_MS = 60_000;
/** Win submissions allowed per IP per window. */
export const LEADERBOARD_WRITE_LIMIT_PER_WINDOW = 10;
/** Admin requests allowed per IP per window. */
export const ADMIN_WRITE_LIMIT_PER_WINDOW = 30;
