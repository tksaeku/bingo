import type {
  ANALYTICS_DEVICE_TYPES,
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_FUNNEL_STEPS,
  ANALYTICS_PLACEMENTS,
  ANALYTICS_ROUTES,
} from './constants';

export type Option = {
  id: string;
  text: string;
  createdAt: string;
};

export type LeaderboardEntry = {
  id: string;
  playerName: string;
  wins: number;
  lastWin: string;
};

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];
export type AnalyticsRoute = (typeof ANALYTICS_ROUTES)[number];
export type AnalyticsPlacement = (typeof ANALYTICS_PLACEMENTS)[number];
export type DeviceType = (typeof ANALYTICS_DEVICE_TYPES)[number];
export type FunnelStep = (typeof ANALYTICS_FUNNEL_STEPS)[number];

/** One client-reported event; `offsetMs` is its age when the batch was sent. */
export type AnalyticsEvent =
  | { name: 'page_view'; offsetMs: number; properties: { route: AnalyticsRoute } }
  | { name: 'outbound_click'; offsetMs: number; properties: { placement: AnalyticsPlacement } }
  | { name: Exclude<AnalyticsEventName, 'page_view' | 'outbound_click'>; offsetMs: number };

/** Body of POST /api/analytics/events. */
export type EventBatch = {
  visitorId: string;
  events: AnalyticsEvent[];
};

/** Counters for one LA day (or a whole range); every key is always present. */
export type AnalyticsCounters = {
  events: Record<AnalyticsEventName, number>;
  funnel: Record<FunnelStep, number>;
  pageViews: Record<AnalyticsRoute, number>;
  outboundClicks: Record<AnalyticsPlacement, number>;
  devices: Record<DeviceType, number>;
  /** Events received per LA hour, index 0-23. */
  hourly: number[];
};

export type DailyAnalytics = AnalyticsCounters & { day: string };

/** Response of GET /api/admin/analytics. */
export type AnalyticsSummary = {
  timeZone: string;
  fromDay: string;
  toDay: string;
  generatedAt: string;
  uniqueVisitors: number;
  totals: AnalyticsCounters;
  days: DailyAnalytics[];
};

/** An event as stored: the client offset resolved to an absolute ISO time. */
export type StoredAnalyticsEvent = {
  name: AnalyticsEventName;
  properties?: { route: AnalyticsRoute } | { placement: AnalyticsPlacement };
  occurredAt: string;
};

/** One accepted batch as stored in `analyticsEventBatches`. */
export type AnalyticsBatchRecord = {
  visitorId: string;
  day: string;
  receivedAt: string;
  deviceType: DeviceType;
  events: StoredAnalyticsEvent[];
  expireAt: string;
};

/** A registered admin passkey as stored; the public key and counter never leave the server. */
export type StoredAdminPasskey = {
  /** Credential ID (base64url), also the document ID. */
  id: string;
  /** base64url of the COSE public key. */
  publicKey: string;
  counter: number;
  transports: string[];
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
};
