/** A bingo option as returned by the API. */
export interface Option {
  id: string;
  text: string;
  createdAt: string;
}

/** A leaderboard row as returned by the API. */
export interface LeaderboardEntry {
  id: string;
  playerName: string;
  wins: number;
  lastWin: string;
}

/** One cell of the bingo board. */
export interface BoardCell {
  text: string;
  isMarked: boolean;
  isFree: boolean;
}

/** A board as persisted: its cells plus whether the win has been submitted to the leaderboard. */
export interface SavedBoard {
  cells: BoardCell[];
  isScoreSubmitted: boolean;
}

/** Shape returned by data-fetching hooks. */
export interface AsyncResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Visual variants of the shared button. */
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

/** Size variants of the shared button. */
export type ButtonSize = 'regular' | 'small';

/** Error body returned by the API. */
export interface ApiErrorBody {
  error: string;
}
