import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WIN_MODAL_DELAY_MS } from '../../constants';
import { leaderboardApi, optionsApi } from '../../services/api';
import { createAxiosError } from '../../test/axiosErrors';
import type { SavedBoard } from '../../types';
import { createSavedBoardJson, createLeaderboardEntries, createOptions } from '../../test/factories';
import { renderWithProviders } from '../../test/renderWithProviders';
import BingoBoard from './BingoBoard';

vi.mock('../../services/api', () => ({
  optionsApi: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn() },
  leaderboardApi: { getAll: vi.fn(), submitWin: vi.fn() },
  adminApi: { verify: vi.fn() },
}));

const ALMOST_WON_ROW = [0, 1, 2, 3];

function getSavedBoard(): SavedBoard {
  return JSON.parse(localStorage.getItem('bingoBoard') as string);
}

describe('BingoBoard', () => {
  describe('restoring a saved board', () => {
    it('renders the saved board without fetching options', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson([0]));
      renderWithProviders(<BingoBoard />);

      expect(await screen.findByRole('button', { name: 'Cell 0' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Cell 1' })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'FREE' })).toHaveAttribute('aria-pressed', 'true');
      expect(optionsApi.getAll).not.toHaveBeenCalled();
    });
  });

  describe('recovering from a corrupt saved board', () => {
    it.each([['unparsable', '{oops'], ['wrong size', JSON.stringify([{ text: 'a', isMarked: false, isFree: false }])]])(
      'generates a fresh board when the saved value is %s',
      async (_, savedValue) => {
        localStorage.setItem('bingoBoard', savedValue);
        vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(30));
        renderWithProviders(<BingoBoard />);

        expect(await screen.findAllByRole('button', { name: /Option \d+/ })).toHaveLength(24);
        expect(getSavedBoard().cells).toHaveLength(25);
      },
    );
  });

  describe('generating a board', () => {
    it('shows a loading status, then 25 cells and persists the board', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(30));
      renderWithProviders(<BingoBoard />);

      expect(screen.getByRole('status')).toHaveTextContent('Loading board...');
      expect(await screen.findByRole('button', { name: 'FREE' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Option|FREE/ })).toHaveLength(25);
      expect(getSavedBoard().cells).toHaveLength(25);
    });

    it('explains when there are not enough options', async () => {
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(10));
      renderWithProviders(<BingoBoard />);

      expect(await screen.findByRole('alert')).toHaveTextContent('Need at least 24 options');
    });

    it('shows the server error and retries on Try Again', async () => {
      vi.mocked(optionsApi.getAll)
        .mockRejectedValueOnce(createAxiosError(500, 'Server exploded'))
        .mockResolvedValueOnce(createOptions(30));
      renderWithProviders(<BingoBoard />);

      expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded');
      await userEvent.click(screen.getByRole('button', { name: 'Try Again' }));
      expect(await screen.findByRole('button', { name: 'FREE' })).toBeInTheDocument();
    });
  });

  describe('marking cells', () => {
    it('marks a cell, persists it, and unmarks it on a second click', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      const savedBefore = localStorage.getItem('bingoBoard');
      renderWithProviders(<BingoBoard />);

      const cell = await screen.findByRole('button', { name: 'Cell 7' });
      await userEvent.click(cell);
      expect(cell).toHaveAttribute('aria-pressed', 'true');
      expect(getSavedBoard().cells[7].isMarked).toBe(true);
      expect(localStorage.getItem('bingoBoard')).not.toBe(savedBefore);

      await userEvent.click(cell);
      expect(cell).toHaveAttribute('aria-pressed', 'false');
      expect(getSavedBoard().cells[7].isMarked).toBe(false);
    });

    it('never unmarks the free cell', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      renderWithProviders(<BingoBoard />);

      const freeCell = await screen.findByRole('button', { name: 'FREE' });
      await userEvent.click(freeCell);
      expect(freeCell).toHaveAttribute('aria-pressed', 'true');
      expect(getSavedBoard().cells[12].isMarked).toBe(true);
    });

    it('counts marked cells, including the free cell', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson([0]));
      renderWithProviders(<BingoBoard />);

      expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
      await userEvent.click(screen.getByRole('button', { name: 'Cell 0' }));
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
    });

    it('marks with the keyboard', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson());
      renderWithProviders(<BingoBoard />);

      const cell = await screen.findByRole('button', { name: 'Cell 3' });
      cell.focus();
      await userEvent.keyboard('{Enter}');
      expect(cell).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not mutate the previous board state', async () => {
      const board = JSON.parse(createSavedBoardJson()).cells;
      localStorage.setItem('bingoBoard', JSON.stringify({ cells: board, isScoreSubmitted: false }));
      renderWithProviders(<BingoBoard />);

      await userEvent.click(await screen.findByRole('button', { name: 'Cell 2' }));
      expect(board[2].isMarked).toBe(false);
    });
  });

  describe('winning', () => {
    const advancePastWinDelay = async (): Promise<void> => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(WIN_MODAL_DELAY_MS * 2);
      });
    };

    afterEach(() => {
      vi.useRealTimers();
    });

    it('opens the win modal once per board', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      localStorage.setItem('bingoBoard', createSavedBoardJson(ALMOST_WON_ROW));
      renderWithProviders(<BingoBoard />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await userEvent.click(await screen.findByRole('button', { name: 'Cell 4' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await advancePastWinDelay();
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Cell 20' }));
      await advancePastWinDelay();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not reopen the modal when a line is unmarked and completed again', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      localStorage.setItem('bingoBoard', createSavedBoardJson(ALMOST_WON_ROW));
      renderWithProviders(<BingoBoard />);

      const winningCell = await screen.findByRole('button', { name: 'Cell 4' });
      await userEvent.click(winningCell);
      await advancePastWinDelay();
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));

      await userEvent.click(winningCell);
      expect(screen.queryByRole('button', { name: 'Submit score' })).not.toBeInTheDocument();
      await userEvent.click(winningCell);
      await advancePastWinDelay();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit score' })).toBeInTheDocument();
    });

    it('cancels the pending modal when the winning mark is undone', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      localStorage.setItem('bingoBoard', createSavedBoardJson(ALMOST_WON_ROW));
      renderWithProviders(<BingoBoard />);

      const winningCell = await screen.findByRole('button', { name: 'Cell 4' });
      await userEvent.click(winningCell);
      await userEvent.click(winningCell);
      await advancePastWinDelay();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does not open the modal when restoring an already-won board', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      localStorage.setItem('bingoBoard', createSavedBoardJson([0, 1, 2, 3, 4]));
      renderWithProviders(<BingoBoard />);

      await userEvent.click(await screen.findByRole('button', { name: 'Cell 20' }));
      await advancePastWinDelay();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('offers Submit score on a restored won board and reopens the modal', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson([0, 1, 2, 3, 4]));
      renderWithProviders(<BingoBoard />);

      await userEvent.click(await screen.findByRole('button', { name: 'Submit score' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Submit score' })).not.toBeInTheDocument();
    });

    it('offers Submit score after the modal is closed unsubmitted', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson(ALMOST_WON_ROW));
      renderWithProviders(<BingoBoard />);

      await userEvent.click(await screen.findByRole('button', { name: 'Cell 4' }));
      await screen.findByRole('dialog', {}, { timeout: 2000 });
      expect(screen.queryByRole('button', { name: 'Submit score' })).not.toBeInTheDocument();
      await userEvent.keyboard('{Escape}');

      await userEvent.click(screen.getByRole('button', { name: 'Submit score' }));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('hides Submit score once the score is submitted, including after reload', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson(ALMOST_WON_ROW));
      vi.mocked(leaderboardApi.submitWin).mockResolvedValue(createLeaderboardEntries(1)[0]);
      const { unmount } = renderWithProviders(<BingoBoard />);

      await userEvent.click(await screen.findByRole('button', { name: 'Cell 4' }));
      await screen.findByRole('dialog', {}, { timeout: 2000 });
      await userEvent.type(screen.getByLabelText('Your name'), 'Bob{Enter}');
      await userEvent.click(await screen.findByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('button', { name: 'Submit score' })).not.toBeInTheDocument();
      expect(getSavedBoard().isScoreSubmitted).toBe(true);

      unmount();
      renderWithProviders(<BingoBoard />);
      await screen.findByRole('button', { name: 'FREE' });
      expect(screen.queryByRole('button', { name: 'Submit score' })).not.toBeInTheDocument();
    });

    it('Play Again clears the won board, generates a new one, and focuses the board', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson(ALMOST_WON_ROW));
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(30));
      vi.mocked(leaderboardApi.submitWin).mockResolvedValue(createLeaderboardEntries(1)[0]);
      renderWithProviders(<BingoBoard />);

      await userEvent.click(await screen.findByRole('button', { name: 'Cell 4' }));
      await screen.findByRole('dialog', {}, { timeout: 2000 });
      await userEvent.type(screen.getByLabelText('Your name'), 'Bob');
      await userEvent.click(screen.getByRole('button', { name: 'Submit Score' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Play Again' }));

      expect(await screen.findAllByRole('button', { name: /Option \d+/ })).toHaveLength(24);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Cell \d+/ })).not.toBeInTheDocument();
      expect(getSavedBoard().cells.every((cell) => !cell.text.startsWith('Cell'))).toBe(true);
      expect(getSavedBoard().isScoreSubmitted).toBe(false);
      expect(leaderboardApi.submitWin).toHaveBeenCalledWith('Bob');
      expect(screen.getByRole('heading', { name: 'Your Bingo Board' })).toHaveFocus();
    });
  });

  describe('New Board', () => {
    it('replaces the board with a freshly generated one', async () => {
      localStorage.setItem('bingoBoard', createSavedBoardJson([0]));
      vi.mocked(optionsApi.getAll).mockResolvedValue(createOptions(30));
      renderWithProviders(<BingoBoard />);

      await userEvent.click(await screen.findByRole('button', { name: 'New Board' }));
      expect(await screen.findAllByRole('button', { name: /Option \d+/ })).toHaveLength(24);
      expect(screen.getByRole('heading', { name: 'Your Bingo Board' })).toHaveFocus();
    });
  });
});
