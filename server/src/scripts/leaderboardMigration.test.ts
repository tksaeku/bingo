import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry } from '../types';
import { planLeaderboardMigration } from './leaderboardMigration';

describe('planLeaderboardMigration', () => {
  it('merges duplicates by summing wins and keeping the latest lastWin', () => {
    const entries: LeaderboardEntry[] = [
      { id: 'rand1', playerName: 'Bob', wins: 2, lastWin: '2026-01-01T00:00:00.000Z' },
      { id: 'rand2', playerName: 'bob', wins: 3, lastWin: '2026-02-01T00:00:00.000Z' },
    ];
    const plan = planLeaderboardMigration(entries);
    expect(plan.batches).toEqual([
      {
        writes: [{ id: 'bob', playerName: 'Bob', wins: 5, lastWin: '2026-02-01T00:00:00.000Z' }],
        deleteIds: ['rand1', 'rand2'],
      },
    ]);
  });

  it('does not delete a document already stored under the target id', () => {
    const entries: LeaderboardEntry[] = [
      { id: 'bob', playerName: 'Bob', wins: 1, lastWin: '2026-01-01T00:00:00.000Z' },
      { id: 'rand', playerName: 'BOB', wins: 1, lastWin: '2026-01-02T00:00:00.000Z' },
    ];
    const plan = planLeaderboardMigration(entries);
    expect(plan.batches[0].deleteIds).toEqual(['rand']);
    expect(plan.batches[0].writes[0].wins).toBe(2);
  });

  it('leaves correctly keyed unique entries unchanged', () => {
    const entries: LeaderboardEntry[] = [{ id: 'ann', playerName: 'Ann', wins: 1, lastWin: '2026-01-01T00:00:00.000Z' }];
    expect(planLeaderboardMigration(entries)).toEqual({ batches: [], unchangedCount: 1, skippedEntries: [] });
  });

  it('re-keys a unique entry with a random id', () => {
    const entries: LeaderboardEntry[] = [{ id: 'rand', playerName: 'Ann', wins: 4, lastWin: '2026-01-01T00:00:00.000Z' }];
    const plan = planLeaderboardMigration(entries);
    expect(plan.batches).toEqual([{ writes: [{ ...entries[0], id: 'ann' }], deleteIds: ['rand'] }]);
  });

  it('skips and reports names that cannot be encoded instead of throwing', () => {
    const bad: LeaderboardEntry = { id: 'rand', playerName: 'bad\uD800name', wins: 1, lastWin: '2026-01-01T00:00:00.000Z' };
    const good: LeaderboardEntry = { id: 'rand2', playerName: 'Ann', wins: 1, lastWin: '2026-01-01T00:00:00.000Z' };
    const plan = planLeaderboardMigration([bad, good]);
    expect(plan.skippedEntries).toEqual([bad]);
    expect(plan.batches).toHaveLength(1);
  });

  it('is idempotent: applying the plan and re-planning yields no batches', () => {
    const entries: LeaderboardEntry[] = [
      { id: 'r1', playerName: 'Bob', wins: 2, lastWin: '2026-01-01T00:00:00.000Z' },
      { id: 'r2', playerName: ' bob', wins: 3, lastWin: '2026-02-01T00:00:00.000Z' },
      { id: 'r3', playerName: 'Ann', wins: 1, lastWin: '2026-01-05T00:00:00.000Z' },
      { id: 'ann-zzz', playerName: 'Cy', wins: 1, lastWin: '2026-01-05T00:00:00.000Z' },
    ];
    const firstPlan = planLeaderboardMigration(entries);
    const state = new Map(entries.map((entry) => [entry.id, entry]));
    firstPlan.batches.forEach((batch) => {
      batch.deleteIds.forEach((id) => state.delete(id));
      batch.writes.forEach((entry) => state.set(entry.id, entry));
    });
    const secondPlan = planLeaderboardMigration([...state.values()]);
    expect(secondPlan.batches).toEqual([]);
    expect(secondPlan.unchangedCount).toBe(3);
  });
});
