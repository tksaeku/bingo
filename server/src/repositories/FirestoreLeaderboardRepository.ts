import { FIRESTORE_BATCH_LIMIT, LEADERBOARD_COLLECTION } from '../constants';
import { getDatabase } from '../services/firestore';
import type { LeaderboardEntry } from '../types';
import { leaderboardConverter } from './converters';
import type { LeaderboardMigrationBatch, LeaderboardRepository, RecordWinInput } from './repositoryTypes';

/** Firestore-backed leaderboard store. Documents are keyed by normalized player name. */
export class FirestoreLeaderboardRepository implements LeaderboardRepository {
  /** Typed collection reference with the leaderboard converter. */
  #getCollection(): FirebaseFirestore.CollectionReference<LeaderboardEntry> {
    return getDatabase().collection(LEADERBOARD_COLLECTION).withConverter(leaderboardConverter);
  }

  /** Lists up to `limit` entries by wins descending; needs only the automatic single-field index. */
  async listTopByWins(limit: number): Promise<LeaderboardEntry[]> {
    const snapshot = await this.#getCollection().orderBy('wins', 'desc').limit(limit).get();
    return snapshot.docs.map((document) => document.data());
  }

  /** Increments (or creates) the player's entry in one transaction; the first-win display name is preserved. */
  async recordWin(input: RecordWinInput): Promise<LeaderboardEntry> {
    const reference = this.#getCollection().doc(input.documentId);
    return getDatabase().runTransaction(async (transaction): Promise<LeaderboardEntry> => {
      const snapshot = await transaction.get(reference);
      const existing = snapshot.data();
      const entry: LeaderboardEntry = {
        id: input.documentId,
        playerName: existing ? existing.playerName : input.playerName,
        wins: existing ? existing.wins + 1 : 1,
        lastWin: input.now.toISOString(),
      };
      transaction.set(reference, entry);
      return entry;
    });
  }

  /** Reads every leaderboard entry. Used by the migration script. */
  async listAllEntries(): Promise<LeaderboardEntry[]> {
    const snapshot = await this.#getCollection().get();
    return snapshot.docs.map((document) => document.data());
  }

  /**
   * Applies each migration batch atomically. A batch holds all writes and
   * deletes for one player, so a partial run never double-counts wins.
   */
  async applyMigrationBatches(batches: readonly LeaderboardMigrationBatch[]): Promise<void> {
    const collection = this.#getCollection();
    for (const migrationBatch of batches) {
      if (migrationBatch.writes.length + migrationBatch.deleteIds.length > FIRESTORE_BATCH_LIMIT) {
        throw new Error('Migration batch exceeds the Firestore batch limit');
      }
      const batch = getDatabase().batch();
      migrationBatch.writes.forEach((entry) => batch.set(collection.doc(entry.id), entry));
      migrationBatch.deleteIds.forEach((id) => batch.delete(collection.doc(id)));
      await batch.commit();
    }
  }
}
