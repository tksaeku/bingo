import { ANALYTICS_SUMMARY_CACHE_MS, ANALYTICS_TIME_ZONE } from '../../constants';
import type { AnalyticsRepository, RecordBatchResult } from '../../repositories/repositoryTypes';
import type { AnalyticsSummary, DailyAnalytics, EventBatch, StoredAnalyticsEvent } from '../../types';
import { sumCounters } from '../../utils/analyticsCounters';
import { getAnalyticsDay, getAnalyticsHour, getRecentDays } from './analyticsTime';
import { getDeviceType } from './userAgent';

export type AnalyticsService = {
  recordEvents: (batch: EventBatch, userAgent: string | undefined) => Promise<RecordBatchResult>;
  getSummary: (days: number) => Promise<AnalyticsSummary>;
};

/** Resolves each event's client offset to an absolute time and orders events by when they happened. */
function toStoredEvents(batch: EventBatch, receivedAt: Date): StoredAnalyticsEvent[] {
  return batch.events
    .map((event): StoredAnalyticsEvent => {
      const occurredAt = new Date(receivedAt.getTime() - event.offsetMs).toISOString();
      return 'properties' in event ? { name: event.name, properties: event.properties, occurredAt } : { name: event.name, occurredAt };
    })
    .sort((first, second) => first.occurredAt.localeCompare(second.occurredAt));
}

/**
 * Creates the analytics service. The server clock (`getNow`) is authoritative for day and hour
 * bucketing. Completed days are cached for the life of the instance; whole summaries for 30 s.
 */
export function createAnalyticsService(repository: AnalyticsRepository, getNow: () => Date = (): Date => new Date()): AnalyticsService {
  const completedDays = new Map<string, DailyAnalytics>();
  const summaries = new Map<number, { expiresAt: number; summary: AnalyticsSummary }>();

  /** Returns totals for each day, reading from the repository only the days not already cached as completed. */
  async function loadDays(dayList: readonly string[], today: string): Promise<DailyAnalytics[]> {
    const missingDays = dayList.filter((day) => day === today || !completedDays.has(day));
    const loaded = new Map((await repository.getDailyTotals(missingDays)).map((daily) => [daily.day, daily]));
    loaded.forEach((daily, day) => {
      if (day !== today) {
        completedDays.set(day, daily);
      }
    });
    return dayList.map((day) => (day === today ? loaded.get(day) : (completedDays.get(day) ?? loaded.get(day))) as DailyAnalytics);
  }

  return {
    async recordEvents(batch: EventBatch, userAgent: string | undefined): Promise<RecordBatchResult> {
      const receivedAt = getNow();
      return repository.recordBatch({
        visitorId: batch.visitorId,
        day: getAnalyticsDay(receivedAt),
        hour: getAnalyticsHour(receivedAt),
        receivedAt,
        deviceType: getDeviceType(userAgent),
        events: toStoredEvents(batch, receivedAt),
      });
    },

    async getSummary(days: number): Promise<AnalyticsSummary> {
      const now = getNow();
      const cached = summaries.get(days);
      if (cached && cached.expiresAt > now.getTime()) {
        return cached.summary;
      }

      const today = getAnalyticsDay(now);
      const dayList = getRecentDays(today, days);
      const [dailyTotals, uniqueVisitors] = await Promise.all([loadDays(dayList, today), repository.countVisitorsSince(dayList[0])]);
      const summary: AnalyticsSummary = {
        timeZone: ANALYTICS_TIME_ZONE,
        fromDay: dayList[0],
        toDay: today,
        generatedAt: now.toISOString(),
        uniqueVisitors,
        totals: sumCounters(dailyTotals),
        days: dailyTotals,
      };
      summaries.set(days, { expiresAt: now.getTime() + ANALYTICS_SUMMARY_CACHE_MS, summary });
      return summary;
    },
  };
}
