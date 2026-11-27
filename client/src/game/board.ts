import { CENTER_INDEX, FREE_CELL_TEXT, REQUIRED_OPTION_COUNT, TOTAL_CELLS } from '../constants';
import type { BoardCell, Option } from '../types';

/** Thrown when the option pool is too small to fill a board. */
export class NotEnoughOptionsError extends Error {
  constructor() {
    super(`At least ${REQUIRED_OPTION_COUNT} options are required to play.`);
    this.name = 'NotEnoughOptionsError';
  }
}

/**
 * Returns a uniformly shuffled copy of the items using Fisher-Yates.
 * The random source is injectable so tests can be deterministic.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

/**
 * Builds a 25-cell board: 24 randomly chosen options around a pre-marked free center cell.
 * Throws NotEnoughOptionsError when fewer than 24 options are supplied.
 */
export function generateBoard(options: readonly Option[], random: () => number = Math.random): BoardCell[] {
  if (options.length < REQUIRED_OPTION_COUNT) {
    throw new NotEnoughOptionsError();
  }

  const selectedTexts = shuffle(options, random)
    .slice(0, REQUIRED_OPTION_COUNT)
    .map((option) => option.text);

  return Array.from({ length: TOTAL_CELLS }, (_, cellIndex): BoardCell => {
    if (cellIndex === CENTER_INDEX) {
      return { text: FREE_CELL_TEXT, isMarked: true, isFree: true };
    }
    const textIndex = cellIndex < CENTER_INDEX ? cellIndex : cellIndex - 1;
    return { text: selectedTexts[textIndex], isMarked: false, isFree: false };
  });
}
