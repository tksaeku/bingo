/** Firestore collection holding the option pool. */
export const OPTIONS_COLLECTION = 'options';
/** Firestore collection holding leaderboard entries, keyed by normalized player name. */
export const LEADERBOARD_COLLECTION = 'leaderboard';

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

/** Firestore collection holding raw analytics event batches (expire by TTL). */
export const ANALYTICS_EVENT_BATCHES_COLLECTION = 'analyticsEventBatches';
/** Firestore collection holding one document per LA day; counters live in its shards subcollection. */
export const ANALYTICS_DAYS_COLLECTION = 'analyticsDays';
/** Subcollection of a day document holding the counter shards. */
export const ANALYTICS_SHARDS_SUBCOLLECTION = 'shards';
/** Firestore collection holding per-visitor daily state (expires by TTL). */
export const ANALYTICS_VISITOR_DAYS_COLLECTION = 'analyticsVisitorDays';
/** Firestore collection holding one document per visitor, used for range-unique counts (expires by TTL). */
export const ANALYTICS_VISITORS_COLLECTION = 'analyticsVisitors';

/** Time zone that defines an analytics "day" and "hour". */
export const ANALYTICS_TIME_ZONE = 'America/Los_Angeles';
/** Counter shards per day; each accepted batch increments one at random. */
export const ANALYTICS_COUNTER_SHARDS = 10;
/** Days raw batches and visitor documents live before TTL deletes them. */
export const ANALYTICS_RAW_RETENTION_DAYS = 30;
/** Maximum events in one batch. */
export const ANALYTICS_MAX_BATCH_EVENTS = 20;
/** Maximum client-reported age of an event within a batch, in milliseconds. */
export const ANALYTICS_MAX_OFFSET_MS = 300_000;
/** Events one visitor may have accepted per LA day. */
export const ANALYTICS_DAILY_EVENT_CAP_PER_VISITOR = 500;
/** Analytics batches allowed per IP per rate-limit window. */
export const ANALYTICS_IP_LIMIT_PER_WINDOW = 600;
/** Analytics batches allowed per visitor ID per rate-limit window. */
export const ANALYTICS_VISITOR_LIMIT_PER_WINDOW = 20;
/** How long a whole analytics summary response is cached per instance. */
export const ANALYTICS_SUMMARY_CACHE_MS = 30_000;
/** Accepted values of the `days` query parameter. */
export const ANALYTICS_SUMMARY_DAY_OPTIONS: readonly number[] = [1, 7, 30];
/** Hours in an analytics day. */
export const ANALYTICS_HOURS_PER_DAY = 24;

/** Catalogue of analytics event names. */
export const ANALYTICS_EVENT_NAMES = [
  'page_view',
  'board_started',
  'board_restored',
  'first_mark',
  'bingo',
  'score_submitted',
  'play_again',
  'outbound_click',
] as const;
/** Routes a `page_view` may report. */
export const ANALYTICS_ROUTES = ['play', 'leaderboard', 'options'] as const;
/** Placements an `outbound_click` may report. */
export const ANALYTICS_PLACEMENTS = ['header', 'footer'] as const;
/** Device types derived from the User-Agent. */
export const ANALYTICS_DEVICE_TYPES = ['mobile', 'tablet', 'desktop'] as const;
/** Funnel steps, in order. */
export const ANALYTICS_FUNNEL_STEPS = ['visited', 'played', 'marked', 'won', 'submitted'] as const;

/** UUID v4 pattern for visitor IDs (lowercase). */
export const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Firestore collection holding registered admin passkeys, keyed by credential ID. */
export const ADMIN_PASSKEYS_COLLECTION = 'adminPasskeys';
/** Name of the signed admin session cookie. */
export const ADMIN_SESSION_COOKIE = 'bingo_admin_session';
/** Name of the signed WebAuthn challenge cookie. */
export const WEBAUTHN_CHALLENGE_COOKIE = 'bingo_webauthn_challenge';
/** Admin session lifetime (12 hours). */
export const ADMIN_SESSION_TTL_MS = 43_200_000;
/** WebAuthn challenge lifetime (5 minutes). */
export const WEBAUTHN_CHALLENGE_TTL_MS = 300_000;
/** WebAuthn user handle shared by every admin passkey (UTF-8 bytes of `bingo-admin`). */
export const ADMIN_USER_HANDLE = new TextEncoder().encode('bingo-admin');
/** Purpose string the admin session signing key is derived with. */
export const ADMIN_SESSION_KEY_PURPOSE = 'bingo-admin-session';
/** Purpose string the WebAuthn challenge signing key is derived with. */
export const WEBAUTHN_CHALLENGE_KEY_PURPOSE = 'bingo-webauthn-challenge';
/** Relying party display name shown by authenticators. */
export const WEBAUTHN_RP_NAME = 'Bingo admin';
/** Auth requests allowed per IP per rate-limit window. */
export const AUTH_LIMIT_PER_WINDOW = 10;
/** Maximum passkey name length after trimming. */
export const MAX_PASSKEY_NAME_LENGTH = 40;

/** Relying party ID when WEBAUTHN_RP_ID is unset. */
export const DEFAULT_WEBAUTHN_RP_ID = 'localhost';
/** Allowed WebAuthn origins when WEBAUTHN_ORIGINS is unset. */
export const DEFAULT_WEBAUTHN_ORIGINS: readonly string[] = ['http://localhost:5173'];
