import { describe, expect, it } from 'vitest';
import type { RecordBatchInput } from '../repositories/repositoryTypes';
import { FakeAnalyticsRepository } from './FakeAnalyticsRepository';

const VISITOR_ID = '3f1c2a9e-8b7d-4c1e-9f2a-6d5b4c3a2b1e';

function input(names: string[], overrides: Partial<RecordBatchInput> = {}): RecordBatchInput {
  return {
    visitorId: VISITOR_ID,
    day: '2026-11-27',
    hour: 9,
    receivedAt: new Date('2026-11-27T17:00:00.000Z'),
    deviceType: 'tablet',
    events: names.map((name) => ({ name, occurredAt: '2026-11-27T17:00:00.000Z' }) as any),
    ...overrides,
  };
}

describe('FakeAnalyticsRepository', () => {
  it('counts funnel steps and devices once per visitor per day', async () => {
    const repository = new FakeAnalyticsRepository();
    await repository.recordBatch(input(['board_started']));
    await repository.recordBatch(input(['board_started', 'bingo']));
    const [totals] = await repository.getDailyTotals(['2026-11-27']);
    expect(totals.funnel).toEqual({ visited: 1, played: 1, marked: 0, won: 1, submitted: 0 });
    expect(totals.devices.tablet).toBe(1);
    expect(totals.events.board_started).toBe(2);
    expect(await repository.countVisitorsSince('2026-11-27')).toBe(1);
  });

  it('aborts without writes past the daily cap', async () => {
    const repository = new FakeAnalyticsRepository();
    const names = Array.from({ length: 20 }, () => 'bingo');
    for (let batchIndex = 0; batchIndex < 25; batchIndex += 1) {
      expect(await repository.recordBatch(input(names))).toBe('recorded');
    }
    expect(await repository.recordBatch(input(['bingo']))).toBe('daily_cap_exceeded');
    expect(repository.batches).toHaveLength(25);
  });
});
