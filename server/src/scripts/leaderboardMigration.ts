import type { LeaderboardMigrationBatch } from '../repositories/repositoryTypes';
import type { LeaderboardEntry } from '../types';
import { collapseWhitespace, getIsWellFormed, getLeaderboardDocumentId } from '../utils/normalize';

/** Result of planning a leaderboard re-key. */
export type LeaderboardMigrationPlan = {
  batches: LeaderboardMigrationBatch[];
  unchangedCount: number;
  /** Entries whose names cannot be encoded into a document id; left untouched. */
  skippedEntries: LeaderboardEntry[];
};

/**
 * Plans re-keying leaderboard entries to normalized-name document IDs.
 * Entries sharing a normalized name merge: wins are summed, the latest lastWin
 * is kept, and the display name comes from the earliest win. Entries already
 * stored under their target ID with no duplicates are left alone.
 */
export function planLeaderboardMigration(entries: readonly LeaderboardEntry[]): LeaderboardMigrationPlan {
  const groups = new Map<string, LeaderboardEntry[]>();
  const skippedEntries: LeaderboardEntry[] = [];
  entries.forEach((entry) => {
    if (!getIsWellFormed(entry.playerName)) {
      skippedEntries.push(entry);
      return;
    }
    const targetId = getLeaderboardDocumentId(entry.playerName);
    groups.set(targetId, [...(groups.get(targetId) ?? []), entry]);
  });

  const batches: LeaderboardMigrationBatch[] = [];
  let unchangedCount = 0;

  groups.forEach((members, targetId) => {
    if (members.length === 1 && members[0].id === targetId) {
      unchangedCount += 1;
      return;
    }
    const byEarliestWin = [...members].sort((first, second) => Date.parse(first.lastWin) - Date.parse(second.lastWin));
    const latestLastWin = byEarliestWin[byEarliestWin.length - 1].lastWin;
    const merged: LeaderboardEntry = {
      id: targetId,
      playerName: collapseWhitespace(byEarliestWin[0].playerName),
      wins: members.reduce((total, member) => total + member.wins, 0),
      lastWin: latestLastWin,
    };
    batches.push({
      writes: [merged],
      deleteIds: members.filter((member) => member.id !== targetId).map((member) => member.id),
    });
  });

  return { batches, unchangedCount, skippedEntries };
}
