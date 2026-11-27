import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it, vi } from 'vitest';
import { getDatabase } from '../services/firestore';
import { FakeFirestore } from '../testSupport/FakeFirestore';
import type { StoredAnalyticsEvent } from '../types';
import { FirestoreAnalyticsRepository } from './FirestoreAnalyticsRepository';
import type { RecordBatchInput } from './repositoryTypes';

vi.mock('../services/firestore', () => ({ getDatabase: vi.fn() }));

const VISITOR_ID = '3f1c2a9e-8b7d-4c1e-9f2a-6d5b4c3a2b1e';
const RECEIVED_AT = new Date('2026-11-27T20:15:00.000Z');

function createRepository(): { repository: FirestoreAnalyticsRepository; database: FakeFirestore } {
  const database = new FakeFirestore();
  vi.mocked(getDatabase).mockReturnValue(database as any);
  return { repository: new FirestoreAnalyticsRepository(), database };
}

function event(name: StoredAnalyticsEvent['name'], properties?: StoredAnalyticsEvent['properties']): StoredAnalyticsEvent {
  return { name, ...(properties ? { properties } : {}), occurredAt: '2026-11-27T20:14:59.000Z' };
}

function input(events: StoredAnalyticsEvent[], overrides: Partial<RecordBatchInput> = {}): RecordBatchInput {
  return { visitorId: VISITOR_ID, day: '2026-11-27', hour: 12, receivedAt: RECEIVED_AT, deviceType: 'mobile', events, ...overrides };
}

async function getTotals(repository: FirestoreAnalyticsRepository, day = '2026-11-27'): Promise<any> {
  const [totals] = await repository.getDailyTotals([day]);
  return totals;
}

describe('FirestoreAnalyticsRepository', () => {
  describe('recordBatch', () => {
    it('writes the raw batch, the shard counters, the visitor-day and the visitor in one transaction', async () => {
      const { repository, database } = createRepository();
      const result = await repository.recordBatch(
        input([event('page_view', { route: 'play' }), event('board_started'), event('outbound_click', { placement: 'header' })]),
      );

      expect(result).toBe('recorded');
      expect(database.transactionCount).toBe(1);
      expect(database.log).toEqual(['tx:get', 'tx:set', 'tx:set', 'tx:set', 'tx:set', 'tx:commit']);

      const batches = [...database.getRawDocuments('analyticsEventBatches').values()] as any[];
      expect(batches).toHaveLength(1);
      expect(batches[0]).toMatchObject({ visitorId: VISITOR_ID, day: '2026-11-27', deviceType: 'mobile' });
      expect(batches[0].receivedAt).toBeInstanceOf(Timestamp);
      expect(batches[0].events[0]).toMatchObject({ name: 'page_view', properties: { route: 'play' } });
      expect(batches[0].events[1]).not.toHaveProperty('properties');

      const visitorDay: any = database.getRawDocuments('analyticsVisitorDays').get(`2026-11-27_${VISITOR_ID}`);
      expect(visitorDay).toMatchObject({ eventCount: 3, deviceType: 'mobile', steps: { visited: true, played: true } });
      const visitor: any = database.getRawDocuments('analyticsVisitors').get(VISITOR_ID);
      expect(visitor.lastSeenDay).toBe('2026-11-27');
    });

    it('sets expireAt thirty days after receipt on every expiring document', async () => {
      const { repository, database } = createRepository();
      await repository.recordBatch(input([event('board_started')]));
      const expected = new Date('2026-12-27T20:15:00.000Z').getTime();
      const batch: any = [...database.getRawDocuments('analyticsEventBatches').values()][0];
      const visitorDay: any = database.getRawDocuments('analyticsVisitorDays').get(`2026-11-27_${VISITOR_ID}`);
      const visitor: any = database.getRawDocuments('analyticsVisitors').get(VISITOR_ID);
      [batch.expireAt, visitorDay.expireAt, visitor.expireAt].forEach((expireAt) => {
        expect(expireAt).toBeInstanceOf(Timestamp);
        expect(expireAt.toMillis()).toBe(expected);
      });
    });

    it('increments exactly one shard per batch', async () => {
      const { repository, database } = createRepository();
      await repository.recordBatch(input([event('board_started')]));
      const shardCollections = [...Array(10).keys()].map((index) => database.getRawDocuments('analyticsDays/2026-11-27/shards').get(String(index)));
      expect(shardCollections.filter((shard) => shard !== undefined)).toHaveLength(1);
    });

    it('counts events, page views, outbound clicks and hourly activity', async () => {
      const { repository } = createRepository();
      await repository.recordBatch(
        input([event('page_view', { route: 'play' }), event('page_view', { route: 'leaderboard' }), event('outbound_click', { placement: 'footer' })]),
      );
      const totals = await getTotals(repository);
      expect(totals.events).toMatchObject({ page_view: 2, outbound_click: 1, bingo: 0 });
      expect(totals.pageViews).toEqual({ play: 1, leaderboard: 1, options: 0 });
      expect(totals.outboundClicks).toEqual({ header: 0, footer: 1 });
      expect(totals.hourly[12]).toBe(3);
      expect(totals.hourly.reduce((sum: number, value: number) => sum + value, 0)).toBe(3);
    });

    it('counts funnel steps and the device once per visitor per day', async () => {
      const { repository } = createRepository();
      await repository.recordBatch(input([event('page_view', { route: 'play' }), event('board_started')]));
      await repository.recordBatch(input([event('board_restored'), event('first_mark')]));
      await repository.recordBatch(input([event('first_mark'), event('bingo')], { deviceType: 'desktop' }));
      const totals = await getTotals(repository);
      expect(totals.funnel).toEqual({ visited: 1, played: 1, marked: 1, won: 1, submitted: 0 });
      expect(totals.devices).toEqual({ mobile: 1, tablet: 0, desktop: 0 });
      expect(totals.events.first_mark).toBe(2);
    });

    it('counts a visitor again on a new day and for a different visitor', async () => {
      const { repository } = createRepository();
      await repository.recordBatch(input([event('board_started')]));
      await repository.recordBatch(input([event('board_started')], { visitorId: '11111111-1111-4111-8111-111111111111' }));
      await repository.recordBatch(input([event('board_started')], { day: '2026-11-28' }));
      expect((await getTotals(repository)).funnel.visited).toBe(2);
      expect((await getTotals(repository, '2026-11-28')).funnel.visited).toBe(1);
    });

    it('aborts with no writes when the daily cap would be exceeded', async () => {
      const { repository, database } = createRepository();
      database.seed('analyticsVisitorDays', { [`2026-11-27_${VISITOR_ID}`]: { eventCount: 499, steps: { visited: true } } });
      const result = await repository.recordBatch(input([event('board_started'), event('first_mark')]));
      expect(result).toBe('daily_cap_exceeded');
      expect(database.log).toEqual(['tx:get', 'tx:commit']);
      expect(database.getRawDocuments('analyticsEventBatches').size).toBe(0);
      expect(database.getRawDocuments('analyticsVisitors').size).toBe(0);
      expect((database.getRawDocuments('analyticsVisitorDays').get(`2026-11-27_${VISITOR_ID}`) as any).eventCount).toBe(499);
    });

    it('accepts a batch that lands exactly on the cap', async () => {
      const { repository, database } = createRepository();
      database.seed('analyticsVisitorDays', { [`2026-11-27_${VISITOR_ID}`]: { eventCount: 499, steps: { visited: true } } });
      expect(await repository.recordBatch(input([event('board_started')]))).toBe('recorded');
      expect((database.getRawDocuments('analyticsVisitorDays').get(`2026-11-27_${VISITOR_ID}`) as any).eventCount).toBe(500);
    });
  });

  describe('getDailyTotals', () => {
    it('zero-fills days with no shards and reads all shards in one getAll', async () => {
      const { repository, database } = createRepository();
      const totals = await repository.getDailyTotals(['2026-11-26', '2026-11-27']);
      expect(totals.map((day) => day.day)).toEqual(['2026-11-26', '2026-11-27']);
      expect(totals[0].hourly).toHaveLength(24);
      expect(totals[0].events.bingo).toBe(0);
      expect(database.log).toEqual(['getAll']);
    });

    it('sums counters across shards', async () => {
      const { repository, database } = createRepository();
      database.seed('analyticsDays/2026-11-27/shards', {
        '0': { events: { bingo: 2 }, hourly: { '07': 2 }, funnel: { visited: 3 } },
        '4': { events: { bingo: 5 }, hourly: { '07': 1, '23': 4 }, funnel: { visited: 1 } },
      });
      const totals = await getTotals(repository);
      expect(totals.events.bingo).toBe(7);
      expect(totals.hourly[7]).toBe(3);
      expect(totals.hourly[23]).toBe(4);
      expect(totals.funnel.visited).toBe(4);
    });
  });

  describe('countVisitorsSince', () => {
    it('counts visitors last seen on or after the day', async () => {
      const { repository, database } = createRepository();
      database.seed('analyticsVisitors', {
        a: { lastSeenDay: '2026-11-20' },
        b: { lastSeenDay: '2026-11-21' },
        c: { lastSeenDay: '2026-11-27' },
      });
      expect(await repository.countVisitorsSince('2026-11-21')).toBe(2);
      expect(await repository.countVisitorsSince('2026-11-28')).toBe(0);
    });
  });

  describe('listBatches', () => {
    it('returns batches in the inclusive day range, oldest first, with ISO timestamps', async () => {
      const { repository } = createRepository();
      await repository.recordBatch(input([event('board_started')], { day: '2026-11-27', receivedAt: new Date('2026-11-27T21:00:00.000Z') }));
      await repository.recordBatch(input([event('bingo')], { day: '2026-11-26', receivedAt: new Date('2026-11-26T21:00:00.000Z') }));
      await repository.recordBatch(input([event('bingo')], { day: '2026-11-20', receivedAt: new Date('2026-11-20T21:00:00.000Z') }));
      const batches = await repository.listBatches('2026-11-25', '2026-11-27');
      expect(batches.map((batch) => batch.day)).toEqual(['2026-11-26', '2026-11-27']);
      expect(batches[0].receivedAt).toBe('2026-11-26T21:00:00.000Z');
      expect(batches[0].events[0].occurredAt).toBe('2026-11-27T20:14:59.000Z');
    });
  });
});
