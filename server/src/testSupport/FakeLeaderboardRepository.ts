import type { LeaderboardRepository, RecordWinInput } from '../repositories/repositoryTypes';
import type { LeaderboardEntry } from '../types';

/** In-memory leaderboard store mirroring the Firestore repository's semantics. */
export class FakeLeaderboardRepository implements LeaderboardRepository {
  readonly entries: Map<string, LeaderboardEntry>;

  constructor(initialEntries: readonly LeaderboardEntry[] = []) {
    this.entries = new Map(initialEntries.map((entry) => [entry.id, entry]));
  }

  async listTopByWins(limit: number): Promise<LeaderboardEntry[]> {
    // Arbitrary tie order, like Firestore, so the service must tie-break itself.
    return [...this.entries.values()].sort((first, second) => second.wins - first.wins).slice(0, limit);
  }

  async recordWin(input: RecordWinInput): Promise<LeaderboardEntry> {
    const existing = this.entries.get(input.documentId);
    const entry: LeaderboardEntry = {
      id: input.documentId,
      playerName: existing ? existing.playerName : input.playerName,
      wins: existing ? existing.wins + 1 : 1,
      lastWin: input.now.toISOString(),
    };
    this.entries.set(input.documentId, entry);
    return entry;
  }
}
