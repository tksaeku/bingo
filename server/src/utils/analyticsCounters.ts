import {
  ANALYTICS_DEVICE_TYPES,
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_FUNNEL_STEPS,
  ANALYTICS_HOURS_PER_DAY,
  ANALYTICS_PLACEMENTS,
  ANALYTICS_ROUTES,
} from '../constants';
import { getFunnelStepsForEvents } from '../features/analytics/funnel';
import type { AnalyticsCounters, FunnelStep, StoredAnalyticsEvent } from '../types';

/** Builds a `{ key: 0 }` record for every key. */
function zeroRecord<Key extends string>(keys: readonly Key[]): Record<Key, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<Key, number>;
}

/** Counters with every key present and zero. */
export function createEmptyCounters(): AnalyticsCounters {
  return {
    events: zeroRecord(ANALYTICS_EVENT_NAMES),
    funnel: zeroRecord(ANALYTICS_FUNNEL_STEPS),
    pageViews: zeroRecord(ANALYTICS_ROUTES),
    outboundClicks: zeroRecord(ANALYTICS_PLACEMENTS),
    devices: zeroRecord(ANALYTICS_DEVICE_TYPES),
    hourly: Array.from({ length: ANALYTICS_HOURS_PER_DAY }, () => 0),
  };
}

function addRecords<Key extends string>(first: Record<Key, number>, second: Record<Key, number>): Record<Key, number> {
  return Object.fromEntries((Object.keys(first) as Key[]).map((key) => [key, first[key] + second[key]])) as Record<Key, number>;
}

/** Adds two counter sets key by key. */
export function addCounters(first: AnalyticsCounters, second: AnalyticsCounters): AnalyticsCounters {
  return {
    events: addRecords(first.events, second.events),
    funnel: addRecords(first.funnel, second.funnel),
    pageViews: addRecords(first.pageViews, second.pageViews),
    outboundClicks: addRecords(first.outboundClicks, second.outboundClicks),
    devices: addRecords(first.devices, second.devices),
    hourly: first.hourly.map((value, hour) => value + second.hourly[hour]),
  };
}

/** Sums any number of counter sets. */
export function sumCounters(counters: readonly AnalyticsCounters[]): AnalyticsCounters {
  return counters.reduce(addCounters, createEmptyCounters());
}

function readRecord<Key extends string>(keys: readonly Key[], raw: unknown): Record<Key, number> {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(keys.map((key) => [key, typeof source[key] === 'number' ? source[key] : 0])) as Record<Key, number>;
}

/** Reads a stored counter document tolerantly: missing or malformed fields count as zero. */
export function parseCounters(raw: unknown): AnalyticsCounters {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const hourly = typeof source.hourly === 'object' && source.hourly !== null ? (source.hourly as Record<string, unknown>) : {};
  return {
    events: readRecord(ANALYTICS_EVENT_NAMES, source.events),
    funnel: readRecord(ANALYTICS_FUNNEL_STEPS, source.funnel),
    pageViews: readRecord(ANALYTICS_ROUTES, source.pageViews),
    outboundClicks: readRecord(ANALYTICS_PLACEMENTS, source.outboundClicks),
    devices: readRecord(ANALYTICS_DEVICE_TYPES, source.devices),
    hourly: Array.from({ length: ANALYTICS_HOURS_PER_DAY }, (_unused, hour) => {
      const value = hourly[formatHourKey(hour)];
      return typeof value === 'number' ? value : 0;
    }),
  };
}

/** Two-digit hour key used in stored `hourly` maps. */
export function formatHourKey(hour: number): string {
  return String(hour).padStart(2, '0');
}

/** Counters contributed by the events of one batch received in `hour`. */
export function countBatchEvents(events: readonly StoredAnalyticsEvent[], hour: number): AnalyticsCounters {
  const counters = createEmptyCounters();
  counters.hourly[hour] = events.length;
  events.forEach((event) => {
    counters.events[event.name] += 1;
    if (event.name === 'page_view' && event.properties && 'route' in event.properties) {
      counters.pageViews[event.properties.route] += 1;
    }
    if (event.name === 'outbound_click' && event.properties && 'placement' in event.properties) {
      counters.outboundClicks[event.properties.placement] += 1;
    }
  });
  return counters;
}

/** A visitor's state for one LA day. */
export type VisitorDayState = {
  steps: Partial<Record<FunnelStep, true>>;
  eventCount: number;
};

export type BatchPlan =
  | { status: 'daily_cap_exceeded' }
  | { status: 'accepted'; isFirstBatchOfDay: boolean; newSteps: FunnelStep[]; eventCount: number };

/**
 * Decides how a batch affects a visitor's day: aborts when the daily cap would be exceeded,
 * otherwise reports which funnel steps are reached for the first time and the new event count.
 */
export function planBatch(existing: VisitorDayState | undefined, events: readonly StoredAnalyticsEvent[], dailyCap: number): BatchPlan {
  const previousCount = existing?.eventCount ?? 0;
  if (previousCount + events.length > dailyCap) {
    return { status: 'daily_cap_exceeded' };
  }
  const newSteps = getFunnelStepsForEvents(events).filter((step) => existing?.steps[step] !== true);
  return { status: 'accepted', isFirstBatchOfDay: existing === undefined, newSteps, eventCount: previousCount + events.length };
}
