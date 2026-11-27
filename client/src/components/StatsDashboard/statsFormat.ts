import type { AnalyticsEventName, AnalyticsRoute, DeviceType, OutboundPlacement } from '../../types';

/** Column and tile labels for each event. */
export const EVENT_LABELS: Readonly<Record<AnalyticsEventName, string>> = {
  page_view: 'Page views',
  board_started: 'Boards started',
  board_restored: 'Boards restored',
  first_mark: 'First marks',
  bingo: 'Bingos',
  score_submitted: 'Scores submitted',
  play_again: 'Play again',
  outbound_click: 'Outbound clicks',
};

/** Events in the order the daily table lists them. */
export const EVENT_ORDER: readonly AnalyticsEventName[] = [
  'page_view',
  'board_started',
  'board_restored',
  'first_mark',
  'bingo',
  'score_submitted',
  'play_again',
  'outbound_click',
];

/** Display names of the tracked routes. */
export const ROUTE_LABELS: Readonly<Record<AnalyticsRoute, string>> = {
  play: 'Play',
  leaderboard: 'Leaderboard',
  options: 'Cards',
};

/** Display names of the outbound link placements. */
export const PLACEMENT_LABELS: Readonly<Record<OutboundPlacement, string>> = {
  header: 'Header',
  footer: 'Footer',
};

/** Display names of the device types. */
export const DEVICE_LABELS: Readonly<Record<DeviceType, string>> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
};

const HOURS_PER_HALF_DAY = 12;

/** Share of `total` as a whole-number percent; 0 when there is no total. */
export function getPercent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

/** Formats a count with thousands separators. */
export function formatCount(count: number): string {
  return count.toLocaleString('en-US');
}

/** Formats an LA hour of day (0-23) as "12 AM", "3 PM". */
export function formatHour(hour: number): string {
  const suffix = hour < HOURS_PER_HALF_DAY ? 'AM' : 'PM';
  const hourOnClock = hour % HOURS_PER_HALF_DAY === 0 ? HOURS_PER_HALF_DAY : hour % HOURS_PER_HALF_DAY;
  return `${hourOnClock} ${suffix}`;
}

/** Formats a "YYYY-MM-DD" day as "Thu, Nov 26" without any time zone shifting. */
export function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Formats an ISO timestamp as a clock time in the given time zone, e.g. "11:04 AM". */
export function formatClockTime(isoTimestamp: string, timeZone: string): string {
  return new Date(isoTimestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  });
}
