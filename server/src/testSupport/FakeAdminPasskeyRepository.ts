import type { AdminPasskeyRepository } from '../repositories/repositoryTypes';
import type { StoredAdminPasskey } from '../types';

/** In-memory admin passkey store mirroring the Firestore repository's semantics. */
export class FakeAdminPasskeyRepository implements AdminPasskeyRepository {
  readonly passkeys: StoredAdminPasskey[];

  constructor(initialPasskeys: readonly StoredAdminPasskey[] = []) {
    this.passkeys = initialPasskeys.map((passkey) => ({ ...passkey }));
  }

  async list(): Promise<StoredAdminPasskey[]> {
    return [...this.passkeys].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt)).map((passkey) => ({ ...passkey }));
  }

  async get(id: string): Promise<StoredAdminPasskey | null> {
    const passkey = this.passkeys.find((candidate) => candidate.id === id);
    return passkey === undefined ? null : { ...passkey };
  }

  async create(passkey: StoredAdminPasskey): Promise<StoredAdminPasskey> {
    if (this.passkeys.some((candidate) => candidate.id === passkey.id)) {
      throw new Error('Admin passkey already exists');
    }
    this.passkeys.push({ ...passkey });
    return passkey;
  }

  async recordUse(id: string, counter: number, usedAt: Date): Promise<void> {
    const passkey = this.passkeys.find((candidate) => candidate.id === id);
    if (passkey !== undefined) {
      passkey.counter = counter;
      passkey.lastUsedAt = usedAt.toISOString();
    }
  }

  async delete(id: string): Promise<boolean> {
    const index = this.passkeys.findIndex((candidate) => candidate.id === id);
    if (index === -1) {
      return false;
    }
    this.passkeys.splice(index, 1);
    return true;
  }
}
