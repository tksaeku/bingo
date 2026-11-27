import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it, vi } from 'vitest';
import { getDatabase } from '../services/firestore';
import { FakeFirestore } from '../testSupport/FakeFirestore';
import { FirestoreLeaderboardRepository } from './FirestoreLeaderboardRepository';

vi.mock('../services/firestore', () => ({ getDatabase: vi.fn() }));

function createRepository(): { repository: FirestoreLeaderboardRepository; database: FakeFirestore } {
  const database = new FakeFirestore();
  vi.mocked(getDatabase).mockReturnValue(database as any);
  return { repository: new FirestoreLeaderboardRepository(), database };
}

function stored(playerName: string, wins: number, isoDate: string): any {
  return { playerName, wins, lastWin: Timestamp.fromDate(new Date(isoDate)) };
}

describe('FirestoreLeaderboardRepository', () => {
  describe('recordWin', () => {
    it('creates the entry with 1 win and the submitted display name on first win', async () => {
      const { repository, database } = createRepository();
      const entry = await repository.recordWin({ documentId: 'bob', playerName: 'Bob', now: new Date('2026-03-01T00:00:00.000Z') });
      expect(entry).toEqual({ id: 'bob', playerName: 'Bob', wins: 1, lastWin: '2026-03-01T00:00:00.000Z' });
      expect(database.log).toEqual(['tx:get', 'tx:set', 'tx:commit']);
    });

    it('increments wins, keeps the first-win casing and updates lastWin', async () => {
      const { repository, database } = createRepository();
      database.seed('leaderboard', { bob: stored('Bob', 2, '2026-01-01T00:00:00.000Z') });
      const entry = await repository.recordWin({ documentId: 'bob', playerName: 'BOB', now: new Date('2026-03-01T00:00:00.000Z') });
      expect(entry).toEqual({ id: 'bob', playerName: 'Bob', wins: 3, lastWin: '2026-03-01T00:00:00.000Z' });
      const raw: any = database.getRawDocuments('leaderboard').get('bob');
      expect(raw.wins).toBe(3);
      expect(raw.lastWin).toBeInstanceOf(Timestamp);
    });

    it('runs read-modify-write in a single transaction without extra reads', async () => {
      const { repository, database } = createRepository();
      await repository.recordWin({ documentId: 'a', playerName: 'A', now: new Date() });
      expect(database.transactionCount).toBe(1);
      expect(database.log).not.toContain('read');
    });
  });

  describe('listTopByWins', () => {
    it('orders by wins descending, honors the limit and maps timestamps to ISO', async () => {
      const { repository, database } = createRepository();
      database.seed('leaderboard', {
        a: stored('A', 1, '2026-01-01T00:00:00.000Z'),
        b: stored('B', 5, '2026-01-02T00:00:00.000Z'),
        c: stored('C', 3, '2026-01-03T00:00:00.000Z'),
      });
      const entries = await repository.listTopByWins(2);
      expect(entries).toEqual([
        { id: 'b', playerName: 'B', wins: 5, lastWin: '2026-01-02T00:00:00.000Z' },
        { id: 'c', playerName: 'C', wins: 3, lastWin: '2026-01-03T00:00:00.000Z' },
      ]);
    });
  });

  describe('migration helpers', () => {
    it('applyMigrationBatches writes and deletes each player in one atomic batch', async () => {
      const { repository, database } = createRepository();
      database.seed('leaderboard', { r1: stored('Bob', 1, '2026-01-01T00:00:00.000Z'), r2: stored('bob', 2, '2026-02-01T00:00:00.000Z') });
      await repository.applyMigrationBatches([
        { writes: [{ id: 'bob', playerName: 'Bob', wins: 3, lastWin: '2026-02-01T00:00:00.000Z' }], deleteIds: ['r1', 'r2'] },
      ]);
      expect(database.batchSizes).toEqual([3]);
      expect([...database.getRawDocuments('leaderboard').keys()]).toEqual(['bob']);
    });

    it('rejects a batch larger than the Firestore limit', async () => {
      const { repository } = createRepository();
      const deleteIds = Array.from({ length: 501 }, (_unused, index) => `d${index}`);
      await expect(repository.applyMigrationBatches([{ writes: [], deleteIds }])).rejects.toThrow();
    });

    it('listAllEntries returns every entry', async () => {
      const { repository, database } = createRepository();
      database.seed('leaderboard', { a: stored('A', 1, '2026-01-01T00:00:00.000Z') });
      expect(await repository.listAllEntries()).toHaveLength(1);
    });
  });
});
