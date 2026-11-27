import { describe, expect, it } from 'vitest';
import { createBoard } from '../test/factories';
import { parseSavedBoard } from './savedBoard';

describe('parseSavedBoard', () => {
  describe('with a valid board', () => {
    it('returns the parsed board', () => {
      const savedBoard = { cells: createBoard([0, 1]), isScoreSubmitted: true };
      expect(parseSavedBoard(JSON.stringify(savedBoard))).toEqual(savedBoard);
    });
  });

  describe('with unusable input', () => {
    const wrap = (cells: unknown, isScoreSubmitted: unknown = false): string =>
      JSON.stringify({ cells, isScoreSubmitted });

    it.each([
      ['null', null],
      ['unparsable text', '{not json'],
      ['a bare array (no submission flag)', JSON.stringify(createBoard())],
      ['a missing submission flag', JSON.stringify({ cells: createBoard() })],
      ['a non-boolean submission flag', wrap(createBoard(), 'yes')],
      ['a short array', wrap(createBoard().slice(0, 24))],
      ['a long array', wrap([...createBoard(), createBoard()[0]])],
      ['cells missing fields', wrap(createBoard().map(() => ({ text: 'x' })))],
      ['cells with wrong types', wrap(createBoard().map((cell) => ({ ...cell, isMarked: 'yes' })))],
      ['null cells', wrap(createBoard().map(() => null))],
      ['an unmarked free center', wrap(createBoard().map((cell, index) => (index === 12 ? { ...cell, isMarked: false } : cell)))],
      ['a free cell off center', wrap(createBoard().map((cell, index) => (index === 0 ? { ...cell, isFree: true } : cell)))],
    ])('returns null for %s', (_, rawValue) => {
      expect(parseSavedBoard(rawValue)).toBeNull();
    });
  });
});
