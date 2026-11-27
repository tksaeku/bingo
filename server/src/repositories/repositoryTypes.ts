import type { LeaderboardEntry, Option } from '../types';

/** Outcome of an atomic option insert. */
export type CreateOptionResult =
  | { status: 'created'; option: Option }
  | { status: 'duplicate' }
  | { status: 'full' };

/** Input for atomically recording one win; documentId is the normalized-name key. */
export type RecordWinInput = {
  documentId: string;
  playerName: string;
  now: Date;
};

/** Persistence contract for the option pool. */
export type OptionsRepository = {
  /** Lists all options ordered by createdAt ascending. */
  listOptions: () => Promise<Option[]>;
  /** Atomically inserts an option unless it duplicates an existing one or the pool is full. */
  createUniqueOption: (input: { text: string; maxOptions: number }) => Promise<CreateOptionResult>;
  /** Deletes an option; resolves false when it does not exist. */
  deleteOption: (id: string) => Promise<boolean>;
};

/** Persistence contract for the leaderboard. */
export type LeaderboardRepository = {
  /** Lists up to `limit` entries ordered by wins descending (ties in arbitrary order). */
  listTopByWins: (limit: number) => Promise<LeaderboardEntry[]>;
  /** Atomically increments wins for the player, creating the entry on first win. */
  recordWin: (input: RecordWinInput) => Promise<LeaderboardEntry>;
};

/** All writes and deletes for one player, applied atomically by the migration script. */
export type LeaderboardMigrationBatch = {
  writes: LeaderboardEntry[];
  deleteIds: string[];
};
