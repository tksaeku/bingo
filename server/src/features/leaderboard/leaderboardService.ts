import { LEADERBOARD_LIMIT, LEADERBOARD_QUERY_HEADROOM } from '../../constants';
import type { LeaderboardRepository } from '../../repositories/repositoryTypes';
import type { LeaderboardEntry } from '../../types';
import { collapseWhitespace, getLeaderboardDocumentId } from '../../utils/normalize';

export type LeaderboardService = {
  getLeaderboard: () => Promise<LeaderboardEntry[]>;
  submitWin: (playerName: string) => Promise<LeaderboardEntry>;
};

/**
 * Orders entries by wins descending, then most recent win descending, and
 * keeps the first `limit`. Does not mutate the input.
 */
export function rankEntries(entries: readonly LeaderboardEntry[], limit: number): LeaderboardEntry[] {
  return [...entries]
    .sort((first, second) => {
      if (second.wins !== first.wins) {
        return second.wins - first.wins;
      }
      return Date.parse(second.lastWin) - Date.parse(first.lastWin);
    })
    .slice(0, limit);
}

/**
 * Creates the leaderboard service. `getNow` is injectable for deterministic tests.
 */
export function createLeaderboardService(repository: LeaderboardRepository, getNow: () => Date = (): Date => new Date()): LeaderboardService {
  return {
    async getLeaderboard(): Promise<LeaderboardEntry[]> {
      const entries = await repository.listTopByWins(LEADERBOARD_QUERY_HEADROOM);
      return rankEntries(entries, LEADERBOARD_LIMIT);
    },

    submitWin(playerName: string): Promise<LeaderboardEntry> {
      const displayName = collapseWhitespace(playerName);
      return repository.recordWin({
        documentId: getLeaderboardDocumentId(displayName),
        playerName: displayName,
        now: getNow(),
      });
    },
  };
}
