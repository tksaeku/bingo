import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it, vi } from 'vitest';
import { getDatabase } from '../services/firestore';
import { FakeFirestore } from '../testSupport/FakeFirestore';
import type { StoredAdminPasskey } from '../types';
import { FirestoreAdminPasskeyRepository } from './FirestoreAdminPasskeyRepository';

vi.mock('../services/firestore', () => ({ getDatabase: vi.fn() }));

function createRepository(): { repository: FirestoreAdminPasskeyRepository; database: FakeFirestore } {
  const database = new FakeFirestore();
  vi.mocked(getDatabase).mockReturnValue(database as any);
  return { repository: new FirestoreAdminPasskeyRepository(), database };
}

function passkey(id: string, createdAt: string, overrides: Partial<StoredAdminPasskey> = {}): StoredAdminPasskey {
  return { id, publicKey: 'cHVibGlj', counter: 0, transports: ['internal'], name: `Key ${id}`, createdAt, lastUsedAt: null, ...overrides };
}

describe('FirestoreAdminPasskeyRepository', () => {
  describe('create and get', () => {
    it('stores timestamps as Timestamps and reads them back as ISO strings keyed by credential ID', async () => {
      const { repository, database } = createRepository();
      await repository.create(passkey('a', '2026-01-01T00:00:00.000Z'));
      const raw: any = database.getRawDocuments('adminPasskeys').get('a');
      expect(raw.createdAt).toBeInstanceOf(Timestamp);
      expect(raw.lastUsedAt).toBeNull();
      expect(await repository.get('a')).toEqual(passkey('a', '2026-01-01T00:00:00.000Z'));
    });

    it('rejects a duplicate credential ID and keeps the original', async () => {
      const { repository, database } = createRepository();
      await repository.create(passkey('a', '2026-01-01T00:00:00.000Z', { name: 'Original' }));
      await expect(repository.create(passkey('a', '2026-01-02T00:00:00.000Z', { name: 'Other' }))).rejects.toThrow();
      expect(database.getRawDocuments('adminPasskeys').size).toBe(1);
      expect((await repository.get('a'))?.name).toBe('Original');
    });

    it('returns null for a missing passkey', async () => {
      const { repository } = createRepository();
      expect(await repository.get('missing')).toBeNull();
    });
  });

  describe('list', () => {
    it('returns passkeys newest first', async () => {
      const { repository } = createRepository();
      await repository.create(passkey('old', '2026-01-01T00:00:00.000Z'));
      await repository.create(passkey('new', '2026-01-03T00:00:00.000Z'));
      await repository.create(passkey('mid', '2026-01-02T00:00:00.000Z'));
      expect((await repository.list()).map((item) => item.id)).toEqual(['new', 'mid', 'old']);
    });

    it('returns an empty list when none exist', async () => {
      const { repository } = createRepository();
      expect(await repository.list()).toEqual([]);
    });
  });

  describe('recordUse', () => {
    it('updates the counter and lastUsedAt and keeps the other fields', async () => {
      const { repository } = createRepository();
      await repository.create(passkey('a', '2026-01-01T00:00:00.000Z'));
      await repository.recordUse('a', 7, new Date('2026-02-01T00:00:00.000Z'));
      expect(await repository.get('a')).toEqual(passkey('a', '2026-01-01T00:00:00.000Z', { counter: 7, lastUsedAt: '2026-02-01T00:00:00.000Z' }));
    });

    it('does not create a document for a missing passkey', async () => {
      const { repository, database } = createRepository();
      await repository.recordUse('missing', 1, new Date());
      expect(database.getRawDocuments('adminPasskeys').size).toBe(0);
    });
  });

  describe('delete', () => {
    it('deletes an existing passkey and resolves true', async () => {
      const { repository } = createRepository();
      await repository.create(passkey('a', '2026-01-01T00:00:00.000Z'));
      expect(await repository.delete('a')).toBe(true);
      expect(await repository.get('a')).toBeNull();
    });

    it('resolves false when the passkey is missing', async () => {
      const { repository } = createRepository();
      expect(await repository.delete('missing')).toBe(false);
    });
  });
});
