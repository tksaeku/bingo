import { describe, expect, it } from 'vitest';
import type { StoredAdminPasskey } from '../types';
import { FakeAdminPasskeyRepository } from './FakeAdminPasskeyRepository';

const base: StoredAdminPasskey = { id: 'a', publicKey: 'k', counter: 0, transports: [], name: 'A', createdAt: '2026-01-01T00:00:00.000Z', lastUsedAt: null };

describe('FakeAdminPasskeyRepository', () => {
  it('rejects a duplicate create', async () => {
    const repository = new FakeAdminPasskeyRepository([base]);
    await expect(repository.create(base)).rejects.toThrow();
  });

  it('delete returns false when missing and true when removed', async () => {
    const repository = new FakeAdminPasskeyRepository([base]);
    expect(await repository.delete('nope')).toBe(false);
    expect(await repository.delete('a')).toBe(true);
    expect(await repository.get('a')).toBeNull();
  });

  it('lists newest first and records use', async () => {
    const repository = new FakeAdminPasskeyRepository([base, { ...base, id: 'b', createdAt: '2026-02-01T00:00:00.000Z' }]);
    await repository.recordUse('a', 3, new Date('2026-03-01T00:00:00.000Z'));
    expect((await repository.list()).map((item) => item.id)).toEqual(['b', 'a']);
    expect(await repository.get('a')).toMatchObject({ counter: 3, lastUsedAt: '2026-03-01T00:00:00.000Z' });
  });
});
