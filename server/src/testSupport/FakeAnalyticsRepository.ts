import { ANALYTICS_DAILY_EVENT_CAP_PER_VISITOR, ANALYTICS_RAW_RETENTION_DAYS } from '../constants';
import type { AnalyticsRepository, RecordBatchInput, RecordBatchResult } from '../repositories/repositoryTypes';
import type { AnalyticsBatchRecord, AnalyticsCounters, DailyAnalytics } from '../types';
import { addCounters, countBatchEvents, createEmptyCounters, planBatch, type VisitorDayState } from '../utils/analyticsCounters';

const MILLISECONDS_PER_DAY = 86_400_000;

/** In-memory analytics store mirroring the Firestore repository's semantics, including the daily cap. */
export class FakeAnalyticsRepository implements AnalyticsRepository {
  readonly batches: AnalyticsBatchRecord[] = [];
  readonly counters = new Map<string, AnalyticsCounters>();
  readonly visitorDays = new Map<string, VisitorDayState>();
  readonly visitorLastSeenDay = new Map<string, string>();
  /** Number of getDailyTotals calls, so tests can assert caching. */
  getDailyTotalsCallCount = 0;

  async recordBatch(input: RecordBatchInput): Promise<RecordBatchResult> {
    const visitorDayKey = `${input.day}_${input.visitorId}`;
    const plan = planBatch(this.visitorDays.get(visitorDayKey), input.events, ANALYTICS_DAILY_EVENT_CAP_PER_VISITOR);
    if (plan.status === 'daily_cap_exceeded') {
      return 'daily_cap_exceeded';
    }

    const contribution = countBatchEvents(input.events, input.hour);
    plan.newSteps.forEach((step) => {
      contribution.funnel[step] += 1;
    });
    if (plan.isFirstBatchOfDay) {
      contribution.devices[input.deviceType] += 1;
      this.visitorLastSeenDay.set(input.visitorId, input.day);
    }
    this.counters.set(input.day, addCounters(this.counters.get(input.day) ?? createEmptyCounters(), contribution));

    const previousSteps = this.visitorDays.get(visitorDayKey)?.steps ?? {};
    this.visitorDays.set(visitorDayKey, {
      steps: { ...previousSteps, ...Object.fromEntries(plan.newSteps.map((step) => [step, true as const])) },
      eventCount: plan.eventCount,
    });
    this.batches.push({
      visitorId: input.visitorId,
      day: input.day,
      receivedAt: input.receivedAt.toISOString(),
      deviceType: input.deviceType,
      events: input.events,
      expireAt: new Date(input.receivedAt.getTime() + ANALYTICS_RAW_RETENTION_DAYS * MILLISECONDS_PER_DAY).toISOString(),
    });
    return 'recorded';
  }

  async getDailyTotals(days: readonly string[]): Promise<DailyAnalytics[]> {
    this.getDailyTotalsCallCount += 1;
    return days.map((day) => ({ day, ...(this.counters.get(day) ?? createEmptyCounters()) }));
  }

  async countVisitorsSince(day: string): Promise<number> {
    return [...this.visitorLastSeenDay.values()].filter((lastSeenDay) => lastSeenDay >= day).length;
  }

  async listBatches(fromDay: string, toDay: string): Promise<AnalyticsBatchRecord[]> {
    return this.batches.filter((batch) => batch.day >= fromDay && batch.day <= toDay);
  }
}
