import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { useBingoBoard } from '../../hooks/useBingoBoard';
import { leaderboardApi } from '../../services/api';
import { Button } from '../../styles/Button';
import WinModal from '../WinModal/WinModal';
import { CellButton, CellText, Container, Grid, StatusBox, Title } from './BingoBoard.styles';

/** Submits a win to the leaderboard; the modal owns pending and error display. */
async function submitWin(playerName: string): Promise<void> {
  await leaderboardApi.submitWin(playerName);
}

/** The playable bingo board with loading, error, and win-modal handling. */
const BingoBoard = (): ReactElement => {
  const {
    board,
    isLoading,
    errorMessage,
    isWinModalOpen,
    canSubmitScore,
    markCell,
    startNewBoard,
    closeWinModal,
    openWinModal,
    markScoreSubmitted,
  } = useBingoBoard();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusBoardRef = useRef(false);

  useEffect(() => {
    if (!isLoading && board !== null && shouldFocusBoardRef.current && titleRef.current !== null) {
      titleRef.current.focus();
      shouldFocusBoardRef.current = false;
    }
  }, [isLoading, board]);

  const handleStartNewBoard = (): void => {
    shouldFocusBoardRef.current = true;
    startNewBoard();
  };

  const handleSubmitWin = async (playerName: string): Promise<void> => {
    await submitWin(playerName);
    markScoreSubmitted();
  };

  if (isLoading) {
    return (
      <StatusBox role="status" aria-live="polite">
        Loading board...
      </StatusBox>
    );
  }

  if (errorMessage !== null || board === null) {
    return (
      <StatusBox role="alert">
        <p>{errorMessage}</p>
        <Button type="button" onClick={startNewBoard}>
          Try Again
        </Button>
      </StatusBox>
    );
  }

  return (
    <Container>
      <Title ref={titleRef} tabIndex={-1}>
        Bingo Board
      </Title>
      <Grid role="group" aria-label="Bingo board">
        {board.map((cell, index) => (
          <CellButton
            key={`${index}-${cell.text}`}
            type="button"
            aria-pressed={cell.isMarked}
            $isMarked={cell.isMarked}
            $isFree={cell.isFree}
            onClick={() => markCell(index)}
          >
            <CellText $isMarked={cell.isMarked} $isFree={cell.isFree}>
              {cell.text}
            </CellText>
          </CellButton>
        ))}
      </Grid>
      {canSubmitScore && (
        <Button type="button" onClick={openWinModal}>
          Submit score
        </Button>
      )}
      <Button type="button" $variant="secondary" onClick={handleStartNewBoard}>
        New Board
      </Button>
      {isWinModalOpen && (
        <WinModal onSubmit={handleSubmitWin} onClose={closeWinModal} onPlayAgain={handleStartNewBoard} />
      )}
    </Container>
  );
};
BingoBoard.displayName = 'BingoBoard';

export default BingoBoard;
