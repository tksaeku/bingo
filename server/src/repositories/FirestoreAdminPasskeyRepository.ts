import { ADMIN_PASSKEYS_COLLECTION } from '../constants';
import { getDatabase } from '../services/firestore';
import type { StoredAdminPasskey } from '../types';
import { adminPasskeyConverter } from './converters';
import type { AdminPasskeyRepository } from './repositoryTypes';

/** Firestore-backed admin passkey store; the document ID is the credential ID. */
export class FirestoreAdminPasskeyRepository implements AdminPasskeyRepository {
  #getCollection(): FirebaseFirestore.CollectionReference<StoredAdminPasskey> {
    return getDatabase().collection(ADMIN_PASSKEYS_COLLECTION).withConverter(adminPasskeyConverter);
  }

  /** Lists every passkey, newest first. */
  async list(): Promise<StoredAdminPasskey[]> {
    const snapshot = await this.#getCollection().orderBy('createdAt', 'desc').get();
    return snapshot.docs.map((document) => document.data());
  }

  /** Fetches one passkey, or null when missing. */
  async get(id: string): Promise<StoredAdminPasskey | null> {
    const snapshot = await this.#getCollection().doc(id).get();
    return snapshot.exists ? (snapshot.data() ?? null) : null;
  }

  /** Inserts a passkey in one transaction; rejects when the credential ID already exists. */
  async create(passkey: StoredAdminPasskey): Promise<StoredAdminPasskey> {
    const reference = this.#getCollection().doc(passkey.id);
    return getDatabase().runTransaction(async (transaction): Promise<StoredAdminPasskey> => {
      const snapshot = await transaction.get(reference);
      if (snapshot.exists) {
        throw new Error('Admin passkey already exists');
      }
      transaction.set(reference, passkey);
      return passkey;
    });
  }

  /** Updates the counter and last-used time in one transaction; does nothing when the passkey is missing. */
  async recordUse(id: string, counter: number, usedAt: Date): Promise<void> {
    const reference = this.#getCollection().doc(id);
    await getDatabase().runTransaction(async (transaction): Promise<void> => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        return;
      }
      transaction.set(reference, { ...snapshot.data()!, counter, lastUsedAt: usedAt.toISOString() });
    });
  }

  /** Deletes a passkey in a transaction; resolves false when it does not exist. */
  async delete(id: string): Promise<boolean> {
    const reference = this.#getCollection().doc(id);
    return getDatabase().runTransaction(async (transaction): Promise<boolean> => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) {
        return false;
      }
      transaction.delete(reference);
      return true;
    });
  }
}
