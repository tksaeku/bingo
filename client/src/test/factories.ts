import { CENTER_INDEX, TOTAL_CELLS } from '../constants';
import type { BoardCell, LeaderboardEntry, Option } from '../types';

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
