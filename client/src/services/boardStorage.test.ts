import { describe, expect, it, vi } from 'vitest';
import { createBoard } from '../test/factories';
import { clearSavedBoard, loadSavedBoard, saveBoard } from './boardStorage';

describe('boardStorage', () => {
  describe('round trip', () => {
    it('saves, loads, and clears a board', () => {
      const cells = createBoard([1]);
      saveBoard(cells, true);
      expect(loadSavedBoard()).toEqual({ cells, isScoreSubmitted: true });

      clearSavedBoard();
      expect(loadSavedBoard()).toBeNull();
    });

    it('returns null for corrupt stored data', () => {
      localStorage.setItem('bingoBoard', '{oops');
      expect(loadSavedBoard()).toBeNull();
    });
  });

  describe('when Storage throws', () => {
    it('load returns null', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(loadSavedBoard()).toBeNull();
    });

    it('save and clear do not throw', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('blocked');
      });
      expect(() => saveBoard(createBoard(), false)).not.toThrow();
      expect(() => clearSavedBoard()).not.toThrow();
    });
  });
});
