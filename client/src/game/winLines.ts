import { BOARD_SIZE } from '../constants';
import type { BoardCell } from '../types';

/**
 * Generates every winning line as cell indices: rows, columns, then both diagonals.
 */
function buildWinLines(): number[][] {
  const positions = Array.from({ length: BOARD_SIZE }, (_, position) => position);
  const rows = positions.map((row) => positions.map((column) => row * BOARD_SIZE + column));
  const columns = positions.map((column) => positions.map((row) => row * BOARD_SIZE + column));
  const diagonal = positions.map((position) => position * BOARD_SIZE + position);
  const antiDiagonal = positions.map((position) => position * BOARD_SIZE + (BOARD_SIZE - 1 - position));
  return [...rows, ...columns, diagonal, antiDiagonal];
}

/** The 12 winning lines of a 5x5 board. */
export const WIN_LINES: readonly (readonly number[])[] = buildWinLines();

/** True when any winning line is fully marked (the free cell counts as marked). */
export function getHasWon(board: readonly BoardCell[]): boolean {
  return WIN_LINES.some((line) => line.every((cellIndex) => board[cellIndex]?.isMarked === true));
}
