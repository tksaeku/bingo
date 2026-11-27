import type { AnalyticsBatchRecord, DailyAnalytics, DeviceType, LeaderboardEntry, Option, StoredAnalyticsEvent } from '../types';

/** Outcome of an atomic option insert. */
export type CreateOptionResult =
  | { status: 'created'; option: Option }
  | { status: 'duplicate' };

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
  /** Atomically inserts an option unless it duplicates an existing one. */
  createUniqueOption: (text: string) => Promise<CreateOptionResult>;
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

/** Input for atomically recording one accepted analytics batch. */
export type RecordBatchInput = {
  visitorId: string;
  /** LA day of `receivedAt`, `YYYY-MM-DD`. */
  day: string;
  /** LA hour of `receivedAt`, 0-23. */
  hour: number;
  receivedAt: Date;
  deviceType: DeviceType;
  events: StoredAnalyticsEvent[];
};

export type RecordBatchResult = 'recorded' | 'daily_cap_exceeded';

/** Persistence contract for analytics. */
export type AnalyticsRepository = {
  /** Atomically stores a batch and updates counters, or aborts with no writes when the visitor's daily cap would be exceeded. */
  recordBatch: (input: RecordBatchInput) => Promise<RecordBatchResult>;
  /** Returns zero-filled counters for each requested day, in the order given. */
  getDailyTotals: (days: readonly string[]) => Promise<DailyAnalytics[]>;
  /** Counts visitors whose last-seen day is on or after `day`. */
  countVisitorsSince: (day: string) => Promise<number>;
  /** Lists raw batches whose day is within the inclusive range, oldest first. */
  listBatches: (fromDay: string, toDay: string) => Promise<AnalyticsBatchRecord[]>;
};
