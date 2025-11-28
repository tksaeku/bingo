import { useState, useEffect } from 'react';
import { optionsAPI, leaderboardAPI } from '../services/api';
import WinModal from './WinModal';
import './BingoBoard.scss';

const BOARD_SIZE = 5;
const CENTER_INDEX = 12; // Middle of 5x5 grid (0-indexed)

interface Cell {
  text: string;
  marked: boolean;
  isFree: boolean;
}

const BingoBoard = () => {
  const [board, setBoard] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const executeSetBoard = (newBoard: Cell[]) => {
    localStorage.setItem('bingoBoard', JSON.stringify(newBoard));
    setBoard(newBoard);
  };
  const generateBoard = async () => {
    try {
      setLoading(true);
      setError(null);
      const localBingoBoard = localStorage.getItem('bingoBoard');
      if (localBingoBoard) {
        const savedBoard = JSON.parse(localBingoBoard || '[]') as Cell[];
        setBoard(savedBoard);
        setLoading(false);
        return;
      }
      const response = await optionsAPI.getAll();
      const options = response.data;

      if (options.length < 24) {
        setError('Need at least 24 options to play. Please add more options!');
        setLoading(false);
        return;
      }

      // Shuffle and pick 24 random options
      const shuffled = [...options].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 24);

      // Create board with FREE space in center
      const newBoard: Cell[] = [];
      let optionIndex = 0;

      for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        if (i === CENTER_INDEX) {
          newBoard.push({ text: 'FREE', marked: true, isFree: true });
        } else {
          newBoard.push({
            text: selected[optionIndex].text,
            marked: false,
            isFree: false,
          });
          optionIndex++;
        }
      }
      executeSetBoard(newBoard);
      setLoading(false);
    } catch (err) {
      setError('Failed to load bingo board');
      setLoading(false);
    }
  };

  const resetBoard = async () => {
    localStorage.removeItem('bingoBoard');
    await generateBoard();
  };

  useEffect(() => {
    generateBoard();
  }, []);

  const checkWin = (updatedBoard: Cell[]): boolean => {
    // Check rows
    for (let row = 0; row < BOARD_SIZE; row++) {
      let win = true;
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!updatedBoard[row * BOARD_SIZE + col].marked) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }

    // Check columns
    for (let col = 0; col < BOARD_SIZE; col++) {
      let win = true;
      for (let row = 0; row < BOARD_SIZE; row++) {
        if (!updatedBoard[row * BOARD_SIZE + col].marked) {
          win = false;
          break;
        }
      }
      if (win) return true;
    }

    // Check diagonal (top-left to bottom-right)
    let diag1Win = true;
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (!updatedBoard[i * BOARD_SIZE + i].marked) {
        diag1Win = false;
        break;
      }
    }
    if (diag1Win) return true;

    // Check diagonal (top-right to bottom-left)
    let diag2Win = true;
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (!updatedBoard[i * BOARD_SIZE + (BOARD_SIZE - 1 - i)].marked) {
        diag2Win = false;
        break;
      }
    }
    if (diag2Win) return true;

    return false;
  };

  const handleCellClick = (index: number) => {
    if (board[index].isFree || board[index].marked) return;

    const updatedBoard = [...board];
    updatedBoard[index].marked = true;
    executeSetBoard(updatedBoard);

    if (checkWin(updatedBoard)) {
      setTimeout(() => setShowWinModal(true), 500);
    }
  };

  const handlePlayAgain = async (playerName: string) => {
    try {
      await leaderboardAPI.submitWin(playerName);
      await generateBoard();
      setShowWinModal(false);
    } catch (err) {
      console.error('Failed to submit win:', err);
    }
  };

  if (loading) {
    return <div className="bingo-board loading">Loading board...</div>;
  }

  if (error) {
    return (
      <div className="bingo-board error">
        <p>{error}</p>
        <button onClick={generateBoard} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bingo-board-container">
      <h1 className="board-title">Bingo Board</h1>
      <div className="bingo-board">
        {board.map((cell, index) => (
          <div
            key={index}
            className={`bingo-cell ${cell.marked ? 'marked' : ''} ${cell.isFree ? 'free' : ''}`}
            onClick={() => handleCellClick(index)}
          >
            <span className="cell-text">{cell.text}</span>
          </div>
        ))}
      </div>
      <button onClick={resetBoard} className="btn btn-secondary reset-btn">
        Reset Board
      </button>
      {showWinModal && (
        <WinModal onClose={() => setShowWinModal(false)} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
};

export default BingoBoard;
