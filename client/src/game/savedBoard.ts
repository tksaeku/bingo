import { CENTER_INDEX, TOTAL_CELLS } from '../constants';
import type { BoardCell, SavedBoard } from '../types';

/** True when the value has the exact shape of a BoardCell. */
function getIsBoardCell(value: unknown): value is BoardCell {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.text === 'string' &&
    typeof candidate.isMarked === 'boolean' &&
    typeof candidate.isFree === 'boolean'
  );
}

/** True when the value is a structurally valid 25-cell board with a marked free center only. */
export function getIsValidBoard(value: unknown): value is BoardCell[] {
  if (!Array.isArray(value) || value.length !== TOTAL_CELLS) {
    return false;
  }
  return value.every((cell, index) => {
    if (!getIsBoardCell(cell)) {
      return false;
    }
    if (index === CENTER_INDEX) {
      return cell.isFree && cell.isMarked;
    }
    return !cell.isFree;
  });
}

/** True when the value is `{ cells, isScoreSubmitted }` with a valid board. */
function getIsSavedBoard(value: unknown): value is SavedBoard {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.isScoreSubmitted === 'boolean' && getIsValidBoard(candidate.cells);
}

/**
 * Parses a persisted board. Returns null for missing, unparsable or invalid data
 * so the caller can generate a fresh board.
 */
export function parseSavedBoard(rawValue: string | null): SavedBoard | null {
  if (rawValue === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(rawValue);
    return getIsSavedBoard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
