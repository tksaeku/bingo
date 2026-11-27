import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it, vi } from 'vitest';
import { getDatabase } from '../services/firestore';
import { FakeFirestore } from '../testSupport/FakeFirestore';
import { FirestoreOptionsRepository } from './FirestoreOptionsRepository';

vi.mock('../services/firestore', () => ({ getDatabase: vi.fn() }));

function createRepository(): { repository: FirestoreOptionsRepository; database: FakeFirestore } {
  const database = new FakeFirestore();
  vi.mocked(getDatabase).mockReturnValue(database as any);
  return { repository: new FirestoreOptionsRepository(), database };
}

function stored(text: string, isoDate: string): any {
  return { text, createdAt: Timestamp.fromDate(new Date(isoDate)) };
}

describe('FirestoreOptionsRepository', () => {
  describe('listOptions', () => {
    it('returns options ordered by createdAt ascending with ISO timestamps and ids', async () => {
      const { repository, database } = createRepository();
      database.seed('options', {
        b: stored('Second', '2026-01-02T00:00:00.000Z'),
        a: stored('First', '2026-01-01T00:00:00.000Z'),
      });
      expect(await repository.listOptions()).toEqual([
        { id: 'a', text: 'First', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: 'b', text: 'Second', createdAt: '2026-01-02T00:00:00.000Z' },
      ]);
    });
  });

  describe('createUniqueOption', () => {
    it('creates the option inside one transaction, reading before writing', async () => {
      const { repository, database } = createRepository();
      const result = await repository.createUniqueOption('Gold costume');
      expect(result.status).toBe('created');
      expect(database.transactionCount).toBe(1);
      expect(database.log).toEqual(['tx:get', 'tx:set', 'tx:commit']);
      expect(database.getRawDocuments('options').size).toBe(1);
    });

    it('stores createdAt as a Timestamp and returns it as ISO', async () => {
      const { repository, database } = createRepository();
      const result: any = await repository.createUniqueOption('A');
      const raw: any = [...database.getRawDocuments('options').values()][0];
      expect(raw.createdAt).toBeInstanceOf(Timestamp);
      expect(result.option.createdAt).toBe(raw.createdAt.toDate().toISOString());
    });

    it('reports a case-insensitive duplicate in the same transaction and writes nothing', async () => {
      const { repository, database } = createRepository();
      database.seed('options', { a: stored('Gold Costume', '2026-01-01T00:00:00.000Z') });
      const result = await repository.createUniqueOption(' gold   costume ');
      expect(result).toEqual({ status: 'duplicate' });
      expect(database.transactionCount).toBe(1);
      expect(database.log).toEqual(['tx:get', 'tx:commit']);
      expect(database.getRawDocuments('options').size).toBe(1);
    });

    it('never performs non-transactional reads', async () => {
      const { repository, database } = createRepository();
      await repository.createUniqueOption('A');
      expect(database.log).not.toContain('read');
    });
  });

  describe('deleteOption', () => {
    it('deletes an existing option in a transaction and returns true', async () => {
      const { repository, database } = createRepository();
      database.seed('options', { a: stored('A', '2026-01-01T00:00:00.000Z') });
      expect(await repository.deleteOption('a')).toBe(true);
      expect(database.log).toEqual(['tx:get', 'tx:delete', 'tx:commit']);
      expect(database.getRawDocuments('options').size).toBe(0);
    });

    it('returns false without writing when the option does not exist', async () => {
      const { repository, database } = createRepository();
      expect(await repository.deleteOption('missing')).toBe(false);
      expect(database.log).toEqual(['tx:get', 'tx:commit']);
    });
  });

  describe('seed helpers', () => {
    it('deleteAllOptions batches deletes in groups of at most 500', async () => {
      const { repository, database } = createRepository();
      const documents: Record<string, any> = {};
      for (let index = 0; index < 1200; index += 1) {
        documents[`d${index}`] = stored('x', '2026-01-01T00:00:00.000Z');
      }
      database.seed('options', documents);
      expect(await repository.deleteAllOptions()).toBe(1200);
      expect(database.batchSizes).toEqual([500, 500, 200]);
      expect(database.getRawDocuments('options').size).toBe(0);
    });

    it('insertOptions batches in groups of at most 500 and preserves order', async () => {
      const { repository, database } = createRepository();
      const texts = Array.from({ length: 501 }, (_unused, index) => `Option ${index}`);
      expect(await repository.insertOptions(texts)).toBe(501);
      expect(database.batchSizes).toEqual([500, 1]);
      const listed = await repository.listOptions();
      expect(listed.map((option) => option.text)).toEqual(texts);
    });
  });
});
