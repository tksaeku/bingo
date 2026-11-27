/** A bingo option as returned by the API. */
export interface Option {
  id: string;
  text: string;
  createdAt: string;
}

/** A leaderboard row as returned by the API. */
export interface LeaderboardEntry {
  id: string;
  playerName: string;
  wins: number;
  lastWin: string;
}

/** One cell of the bingo board. */
export interface BoardCell {
  text: string;
  isMarked: boolean;
  isFree: boolean;
}

/** A board as persisted: its cells plus whether the win has been submitted to the leaderboard. */
export interface SavedBoard {
  cells: BoardCell[];
  isScoreSubmitted: boolean;
}

/** Shape returned by data-fetching hooks. */
export interface AsyncResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Visual variants of the shared button. */
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

/** Size variants of the shared button. */
export type ButtonSize = 'regular' | 'small';

/** Error body returned by the API. */
export interface ApiErrorBody {
  error: string;
}

/** Routes that report a `page_view` event. */
export type AnalyticsRoute = 'play' | 'leaderboard' | 'options';

/** Placements of the outbound website link. */
export type OutboundPlacement = 'header' | 'footer';

/** Analytics events that carry no properties. */
export type PlainAnalyticsEventName =
  'board_started' | 'board_restored' | 'first_mark' | 'bingo' | 'score_submitted' | 'play_again';

/** Every analytics event name in the catalogue. */
export type AnalyticsEventName = PlainAnalyticsEventName | 'page_view' | 'outbound_click';

/** One analytics event as recorded by the tracker. */
export type AnalyticsEvent =
  | { name: PlainAnalyticsEventName }
  | { name: 'page_view'; properties: { route: AnalyticsRoute } }
  | { name: 'outbound_click'; properties: { placement: OutboundPlacement } };

/** An analytics event as sent: the event plus its age in milliseconds at send time. */
export type AnalyticsEventPayload = AnalyticsEvent & { offsetMs: number };

/** Request body of `POST /api/analytics/events`. */
export interface EventBatch {
  visitorId: string;
  events: AnalyticsEventPayload[];
}

/** Device class derived by the server. */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/** Steps of the visitor funnel. */
export type FunnelStep = 'visited' | 'played' | 'marked' | 'won' | 'submitted';

/** Aggregated analytics for one day or for a whole range. */
export interface AnalyticsCounts {
  events: Record<AnalyticsEventName, number>;
  funnel: Record<FunnelStep, number>;
  pageViews: Record<AnalyticsRoute, number>;
  outboundClicks: Record<OutboundPlacement, number>;
  devices: Record<DeviceType, number>;
  /** Events received per LA hour of day, index 0-23. */
  hourly: number[];
}

/** One LA day of analytics. */
export interface DailyAnalytics extends AnalyticsCounts {
  day: string;
}

/** Response of `GET /api/admin/analytics`. */
export interface AnalyticsSummary {
  timeZone: string;
  fromDay: string;
  toDay: string;
  generatedAt: string;
  uniqueVisitors: number;
  totals: AnalyticsCounts;
  days: DailyAnalytics[];
}

/** Day ranges the summary endpoint accepts. */
export type AnalyticsRangeDays = 1 | 7 | 30;
