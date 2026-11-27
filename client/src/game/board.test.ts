import { describe, expect, it } from 'vitest';
import { createOptions } from '../test/factories';
import { generateBoard, NotEnoughOptionsError, shuffle } from './board';

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const shuffled = shuffle(items);
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('is deterministic for a fixed random source', () => {
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});

describe('generateBoard', () => {
  describe('with enough options', () => {
    it('creates 25 cells with a marked free center', () => {
      const board = generateBoard(createOptions(40));
      expect(board).toHaveLength(25);
      expect(board[12]).toEqual({ text: 'FREE', isMarked: true, isFree: true });
    });

    it('uses 24 distinct options and leaves them unmarked', () => {
      const board = generateBoard(createOptions(40));
      const others = board.filter((_, index) => index !== 12);
      expect(new Set(others.map((cell) => cell.text)).size).toBe(24);
      expect(others.every((cell) => !cell.isMarked && !cell.isFree)).toBe(true);
    });

    it('works with exactly 24 options', () => {
      const board = generateBoard(createOptions(24));
      expect(board.filter((cell) => cell.isFree)).toHaveLength(1);
    });
  });

  describe('with fewer than 24 options', () => {
    it('throws NotEnoughOptionsError', () => {
      expect(() => generateBoard(createOptions(23))).toThrow(NotEnoughOptionsError);
    });
  });
});
