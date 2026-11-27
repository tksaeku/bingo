import { describe, expect, it } from 'vitest';
import { createBoard } from '../test/factories';
import { getHasWon, WIN_LINES } from './winLines';

describe('WIN_LINES', () => {
  it('contains 12 lines of 5 distinct cells', () => {
    expect(WIN_LINES).toHaveLength(12);
    WIN_LINES.forEach((line) => {
      expect(line).toHaveLength(5);
      expect(new Set(line).size).toBe(5);
    });
  });
});

describe('getHasWon', () => {
  describe.each(WIN_LINES.map((line, lineIndex) => ({ line, lineIndex })))(
    'for win line $lineIndex',
    ({ line }) => {
      it('detects the line when fully marked', () => {
        expect(getHasWon(createBoard([...line]))).toBe(true);
      });

      it('does not detect the line with one cell missing', () => {
        const missingIndex = line.find((index) => index !== 12) as number;
        const markedIndices = line.filter((index) => index !== missingIndex);
        const board = createBoard([...markedIndices]);
        expect(board[missingIndex].isMarked).toBe(false);
        expect(getHasWon(board)).toBe(false);
      });
    },
  );

  describe('with only the free cell marked', () => {
    it('is not a win', () => {
      expect(getHasWon(createBoard())).toBe(false);
    });
  });

  describe('with scattered marks that form no line', () => {
    it('is not a win', () => {
      expect(getHasWon(createBoard([0, 1, 2, 3, 5, 6, 7, 8, 10, 11]))).toBe(false);
    });
  });

  describe('with the free cell completing a line', () => {
    it('counts the free cell as marked', () => {
      expect(getHasWon(createBoard([10, 11, 13, 14]))).toBe(true);
    });
  });
});
