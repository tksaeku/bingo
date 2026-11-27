import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  ANALYTICS_COUNTER_SHARDS,
  ANALYTICS_DAILY_EVENT_CAP_PER_VISITOR,
  ANALYTICS_DAYS_COLLECTION,
  ANALYTICS_EVENT_BATCHES_COLLECTION,
  ANALYTICS_RAW_RETENTION_DAYS,
  ANALYTICS_SHARDS_SUBCOLLECTION,
  ANALYTICS_VISITOR_DAYS_COLLECTION,
  ANALYTICS_VISITORS_COLLECTION,
} from '../constants';
import { getDatabase } from '../services/firestore';
import type { AnalyticsBatchRecord, AnalyticsCounters, DailyAnalytics, FunnelStep } from '../types';
import { countBatchEvents, formatHourKey, parseCounters, planBatch, sumCounters, type VisitorDayState } from '../utils/analyticsCounters';
import { analyticsBatchConverter } from './converters';
import type { AnalyticsRepository, RecordBatchInput, RecordBatchResult } from './repositoryTypes';

const MILLISECONDS_PER_DAY = 86_400_000;

/** Wraps each non-zero count in a FieldValue.increment so concurrent batches add up. */
function toIncrements(counts: Record<string, number>): Record<string, FieldValue> {
  return Object.fromEntries(
    Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => [key, FieldValue.increment(count)]),
  );
}

/** Builds the shard update for one batch: only non-zero counters are written. */
function buildShardUpdate(input: RecordBatchInput, newSteps: readonly FunnelStep[], isFirstBatchOfDay: boolean): Record<string, unknown> {
  const counters: AnalyticsCounters = countBatchEvents(input.events, input.hour);
  const hourly = Object.fromEntries(counters.hourly.map((count, hour) => [formatHourKey(hour), count]));
  const groups: Record<string, Record<string, FieldValue>> = {
    events: toIncrements(counters.events),
    pageViews: toIncrements(counters.pageViews),
    outboundClicks: toIncrements(counters.outboundClicks),
    hourly: toIncrements(hourly),
    funnel: toIncrements(Object.fromEntries(newSteps.map((step) => [step, 1]))),
    devices: isFirstBatchOfDay ? toIncrements({ [input.deviceType]: 1 }) : {},
  };
  const nonEmptyGroups = Object.entries(groups).filter(([, group]) => Object.keys(group).length > 0);
  return { ...Object.fromEntries(nonEmptyGroups), updatedAt: Timestamp.fromDate(input.receivedAt) };
}

/** Reads a visitor-day document into the planner's state. */
function toVisitorDayState(data: FirebaseFirestore.DocumentData | undefined): VisitorDayState | undefined {
  if (data === undefined) {
    return undefined;
  }
  return {
    steps: typeof data.steps === 'object' && data.steps !== null ? data.steps : {},
    eventCount: typeof data.eventCount === 'number' ? data.eventCount : 0,
  };
}

/** Firestore-backed analytics store; see `.claude/specs/analytics/data-model.md`. */
export class FirestoreAnalyticsRepository implements AnalyticsRepository {
  /** Reference to one counter shard of one day. */
  #getShardReference(day: string, shardIndex: number): FirebaseFirestore.DocumentReference {
    return getDatabase()
      .collection(ANALYTICS_DAYS_COLLECTION)
      .doc(day)
      .collection(ANALYTICS_SHARDS_SUBCOLLECTION)
      .doc(String(shardIndex));
  }

  /** Records one batch in a single transaction so funnel, device and cap counts are exact. */
  async recordBatch(input: RecordBatchInput): Promise<RecordBatchResult> {
    const database = getDatabase();
    const visitorDayReference = database.collection(ANALYTICS_VISITOR_DAYS_COLLECTION).doc(`${input.day}_${input.visitorId}`);
    const batchesCollection = database.collection(ANALYTICS_EVENT_BATCHES_COLLECTION).withConverter(analyticsBatchConverter);
    const visitorReference = database.collection(ANALYTICS_VISITORS_COLLECTION).doc(input.visitorId);
    const shardReference = this.#getShardReference(input.day, Math.floor(Math.random() * ANALYTICS_COUNTER_SHARDS));
    const expireAt = new Date(input.receivedAt.getTime() + ANALYTICS_RAW_RETENTION_DAYS * MILLISECONDS_PER_DAY);

    return database.runTransaction(async (transaction): Promise<RecordBatchResult> => {
      const snapshot = await transaction.get(visitorDayReference);
      const plan = planBatch(toVisitorDayState(snapshot.data()), input.events, ANALYTICS_DAILY_EVENT_CAP_PER_VISITOR);
      if (plan.status === 'daily_cap_exceeded') {
        return 'daily_cap_exceeded';
      }

      const record: AnalyticsBatchRecord = {
        visitorId: input.visitorId,
        day: input.day,
        receivedAt: input.receivedAt.toISOString(),
        deviceType: input.deviceType,
        events: input.events,
        expireAt: expireAt.toISOString(),
      };
      transaction.set(batchesCollection.doc(), record);
      transaction.set(shardReference, buildShardUpdate(input, plan.newSteps, plan.isFirstBatchOfDay), { merge: true });
      transaction.set(
        visitorDayReference,
        {
          visitorId: input.visitorId,
          day: input.day,
          ...(plan.isFirstBatchOfDay ? { deviceType: input.deviceType } : {}),
          steps: Object.fromEntries(plan.newSteps.map((step) => [step, true])),
          eventCount: plan.eventCount,
          expireAt: Timestamp.fromDate(expireAt),
        },
        { merge: true },
      );
      if (plan.isFirstBatchOfDay) {
        transaction.set(visitorReference, { lastSeenDay: input.day, expireAt: Timestamp.fromDate(expireAt) }, { merge: true });
      }
      return 'recorded';
    });
  }

  /** Reads and sums all shards of the requested days with one `getAll`. */
  async getDailyTotals(days: readonly string[]): Promise<DailyAnalytics[]> {
    if (days.length === 0) {
      return [];
    }
    const references = days.flatMap((day) =>
      Array.from({ length: ANALYTICS_COUNTER_SHARDS }, (_unused, shardIndex) => this.#getShardReference(day, shardIndex)),
    );
    const snapshots = await getDatabase().getAll(...references);
    return days.map((day, dayIndex) => {
      const shards = snapshots.slice(dayIndex * ANALYTICS_COUNTER_SHARDS, (dayIndex + 1) * ANALYTICS_COUNTER_SHARDS);
      return { day, ...sumCounters(shards.map((shard) => parseCounters(shard.data()))) };
    });
  }

  /** Counts visitor documents last seen on or after `day` with an aggregation query. */
  async countVisitorsSince(day: string): Promise<number> {
    const snapshot = await getDatabase().collection(ANALYTICS_VISITORS_COLLECTION).where('lastSeenDay', '>=', day).count().get();
    return snapshot.data().count;
  }

  /** Lists raw batches in the inclusive day range, oldest first; uses only the automatic `day` index. */
  async listBatches(fromDay: string, toDay: string): Promise<AnalyticsBatchRecord[]> {
    const snapshot = await getDatabase()
      .collection(ANALYTICS_EVENT_BATCHES_COLLECTION)
      .withConverter(analyticsBatchConverter)
      .where('day', '>=', fromDay)
      .where('day', '<=', toDay)
      .get();
    return snapshot.docs.map((document) => document.data()).sort((first, second) => first.receivedAt.localeCompare(second.receivedAt));
  }
}
