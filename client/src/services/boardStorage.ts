import { BOARD_STORAGE_KEY } from '../constants';
import { parseSavedBoard } from '../game/savedBoard';
import type { BoardCell, SavedBoard } from '../types';

/** Reads the saved board; returns null when absent, corrupt, or storage is unavailable. */
export function loadSavedBoard(): SavedBoard | null {
  try {
    return parseSavedBoard(localStorage.getItem(BOARD_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Persists the board and its submission flag; storage failures are ignored so play continues. */
export function saveBoard(cells: readonly BoardCell[], isScoreSubmitted: boolean): void {
  try {
    const savedBoard: SavedBoard = { cells: [...cells], isScoreSubmitted };
    localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(savedBoard));
  } catch {
    // Storage may be full or blocked; the in-memory board still works.
  }
}

/** Removes the saved board. */
export function clearSavedBoard(): void {
  try {
    localStorage.removeItem(BOARD_STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
