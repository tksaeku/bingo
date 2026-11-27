import { useCallback, useEffect, useState } from 'react';
import { REQUIRED_OPTION_COUNT, WIN_MODAL_DELAY_MS } from '../constants';
import { generateBoard, NotEnoughOptionsError } from '../game/board';
import { getHasWon } from '../game/winLines';
import { optionsApi } from '../services/api';
import { getErrorMessage } from '../services/apiErrors';
import { clearSavedBoard, loadSavedBoard, saveBoard } from '../services/boardStorage';
import type { BoardCell } from '../types';

/** Shown when the option pool is too small to fill a board. */
const NOT_ENOUGH_OPTIONS_MESSAGE = `Need at least ${REQUIRED_OPTION_COUNT} options to play. Please add more options!`;

/** Fallback message when the board cannot be loaded. */
const LOAD_FAILED_MESSAGE = 'Failed to load bingo board.';

/** State and actions exposed by useBingoBoard. */
interface UseBingoBoardResult {
  board: BoardCell[] | null;
  isLoading: boolean;
  errorMessage: string | null;
  isWinModalOpen: boolean;
  /** True on a won board whose score has not been submitted and whose modal is closed. */
  canSubmitScore: boolean;
  /** Marks an unmarked cell or unmarks a marked one; the free cell never changes. */
  toggleCell: (cellIndex: number) => void;
  startNewBoard: () => void;
  closeWinModal: () => void;
  openWinModal: () => void;
  markScoreSubmitted: () => void;
}

/**
 * Owns the bingo board lifecycle: restores a valid saved board, otherwise generates a new one
 * from the option pool, persists every change, and auto-opens the win modal only the first time a board is won.
 */
export function useBingoBoard(): UseBingoBoardResult {
  const [initialSavedBoard] = useState(loadSavedBoard);
  const [board, setBoard] = useState<BoardCell[] | null>(initialSavedBoard?.cells ?? null);
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(initialSavedBoard?.isScoreSubmitted ?? false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWinPending, setIsWinPending] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [hasAutoOpenedWinModal, setHasAutoOpenedWinModal] = useState(false);
  const isGenerating = board === null && errorMessage === null;

  useEffect(() => {
    if (!isGenerating) {
      return;
    }
    const controller = new AbortController();

    const generate = async (): Promise<void> => {
      try {
        const options = await optionsApi.getAll(controller.signal);
        if (controller.signal.aborted) {
          return;
        }
        const newBoard = generateBoard(options);
        saveBoard(newBoard, false);
        setBoard(newBoard);
        setIsScoreSubmitted(false);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setErrorMessage(
          error instanceof NotEnoughOptionsError
            ? NOT_ENOUGH_OPTIONS_MESSAGE
            : getErrorMessage(error, LOAD_FAILED_MESSAGE),
        );
      }
    };

    void generate();
    return () => controller.abort();
  }, [isGenerating]);

  useEffect(() => {
    if (!isWinPending) {
      return;
    }
    const timerId = setTimeout(() => {
      setIsWinPending(false);
      setIsWinModalOpen(true);
    }, WIN_MODAL_DELAY_MS);
    return () => clearTimeout(timerId);
  }, [isWinPending]);

  const toggleCell = useCallback(
    (cellIndex: number): void => {
      const cell = board?.[cellIndex];
      if (board === null || cell === undefined || cell.isFree) {
        return;
      }
      const nextBoard = board.map((existingCell, index) =>
        index === cellIndex ? { ...existingCell, isMarked: !existingCell.isMarked } : existingCell,
      );
      saveBoard(nextBoard, isScoreSubmitted);
      setBoard(nextBoard);
      const hasWonNow = getHasWon(nextBoard);
      if (!hasWonNow) {
        setIsWinPending(false);
        return;
      }
      if (!getHasWon(board) && !hasAutoOpenedWinModal) {
        setHasAutoOpenedWinModal(true);
        setIsWinPending(true);
      }
    },
    [board, isScoreSubmitted, hasAutoOpenedWinModal],
  );

  const startNewBoard = useCallback((): void => {
    clearSavedBoard();
    setBoard(null);
    setErrorMessage(null);
    setIsWinPending(false);
    setIsWinModalOpen(false);
    setHasAutoOpenedWinModal(false);
  }, []);

  const openWinModal = useCallback((): void => {
    setIsWinModalOpen(true);
  }, []);

  const markScoreSubmitted = useCallback((): void => {
    if (board === null) {
      return;
    }
    saveBoard(board, true);
    setIsScoreSubmitted(true);
  }, [board]);

  const closeWinModal = useCallback((): void => {
    setIsWinModalOpen(false);
  }, []);

  const canSubmitScore = board !== null && getHasWon(board) && !isScoreSubmitted && !isWinPending && !isWinModalOpen;

  return {
    board,
    isLoading: isGenerating,
    errorMessage,
    isWinModalOpen,
    canSubmitScore,
    toggleCell,
    startNewBoard,
    closeWinModal,
    openWinModal,
    markScoreSubmitted,
  };
}
