import { CENTER_INDEX, TOTAL_CELLS } from '../constants';
import type { AnalyticsCounts, AnalyticsSummary, BoardCell, LeaderboardEntry, Option } from '../types';

/** Creates `count` distinct options. */
export function createOptions(count: number): Option[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `option-${index}`,
    text: `Option ${index}`,
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
}

/** Creates a 25-cell board with only the free cell and the given indices marked. */
export function createBoard(markedIndices: number[] = []): BoardCell[] {
  return Array.from({ length: TOTAL_CELLS }, (_, index) => {
    if (index === CENTER_INDEX) {
      return { text: 'FREE', isMarked: true, isFree: true };
    }
    return { text: `Cell ${index}`, isMarked: markedIndices.includes(index), isFree: false };
  });
}

/** Serializes a board the way it is persisted in localStorage. */
export function createSavedBoardJson(markedIndices: number[] = [], isScoreSubmitted = false): string {
  return JSON.stringify({ cells: createBoard(markedIndices), isScoreSubmitted });
}

/** Creates leaderboard entries with descending wins. */
export function createLeaderboardEntries(count: number): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `player-${index}`,
    playerName: `Player ${index}`,
    wins: count - index,
    lastWin: '2026-01-01T00:00:00.000Z',
  }));
}

/** Creates a zero-filled analytics summary; pass overrides for the parts a test cares about. */
export function createAnalyticsSummary(overrides: Partial<AnalyticsSummary> = {}): AnalyticsSummary {
  const counts = (): AnalyticsCounts => ({
    events: {
      page_view: 0,
      board_started: 0,
      board_restored: 0,
      first_mark: 0,
      bingo: 0,
      score_submitted: 0,
      play_again: 0,
      outbound_click: 0,
    },
    funnel: { visited: 0, played: 0, marked: 0, won: 0, submitted: 0 },
    pageViews: { play: 0, leaderboard: 0, options: 0 },
    outboundClicks: { header: 0, footer: 0 },
    devices: { mobile: 0, tablet: 0, desktop: 0 },
    hourly: Array.from({ length: 24 }, () => 0),
  });
  return {
    timeZone: 'America/Los_Angeles',
    fromDay: '2026-11-26',
    toDay: '2026-11-26',
    generatedAt: '2026-11-26T19:04:11.000Z',
    uniqueVisitors: 0,
    totals: counts(),
    days: [{ day: '2026-11-26', ...counts() }],
    ...overrides,
  };
}
