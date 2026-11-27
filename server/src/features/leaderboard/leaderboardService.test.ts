import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry } from '../../types';
import { FakeLeaderboardRepository } from '../../testSupport/FakeLeaderboardRepository';
import { createLeaderboardService, rankEntries } from './leaderboardService';

function createEntry(id: string, wins: number, lastWin: string): LeaderboardEntry {
  return { id, playerName: id, wins, lastWin };
}

describe('leaderboardService', () => {
  describe('rankEntries', () => {
    it('orders by wins desc then lastWin desc', () => {
      const ranked = rankEntries(
        [createEntry('a', 1, '2026-01-03T00:00:00.000Z'), createEntry('b', 2, '2026-01-01T00:00:00.000Z'), createEntry('c', 2, '2026-01-02T00:00:00.000Z')],
        20,
      );
      expect(ranked.map((entry) => entry.id)).toEqual(['c', 'b', 'a']);
    });

    it('keeps only the first `limit` entries', () => {
      const entries = Array.from({ length: 30 }, (_unused, index) => createEntry(`p${index}`, index, '2026-01-01T00:00:00.000Z'));
      expect(rankEntries(entries, 20)).toHaveLength(20);
    });
  });

  describe('submitWin', () => {
    it('keeps the first-win casing and counts case-insensitively', async () => {
      const service = createLeaderboardService(new FakeLeaderboardRepository(), () => new Date('2026-03-01T00:00:00.000Z'));
      await service.submitWin('Bob');
      const second = await service.submitWin('  BOB ');
      expect(second).toEqual({ id: 'bob', playerName: 'Bob', wins: 2, lastWin: '2026-03-01T00:00:00.000Z' });
    });
  });
});
