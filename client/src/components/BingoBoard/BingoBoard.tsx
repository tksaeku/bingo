import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { TOTAL_CELLS } from '../../constants';
import { useBingoBoard } from '../../hooks/useBingoBoard';
import { leaderboardApi } from '../../services/api';
import { Button } from '../../styles/Button';
import { Callout, CalloutText, CalloutTitle } from '../../styles/Card';
import { Eyebrow, HeroLead, HeroTitle, HeroTitleAccent, Page } from '../../styles/PageHero';
import WinModal from '../WinModal/WinModal';
import {
  BoardActions,
  BoardCard,
  BoardExtras,
  BoardHint,
  BoardHeader,
  BoardHero,
  BoardSection,
  BoardSubtitle,
  BoardTitle,
  CellButton,
  CellText,
  ColumnLetters,
  FreeGlyph,
  Grid,
  HeroArt,
  HeroOrb,
  Progress,
  ProgressCaption,
  ProgressCount,
  ProgressFill,
  ProgressLabel,
  ProgressTrack,
  Sparkle,
  StatusBox,
} from './BingoBoard.styles';

/** Letters shown above the five board columns. */
const COLUMN_LETTERS = ['B', 'I', 'N', 'G', 'O'];

/** Submits a win to the leaderboard; the modal owns pending and error display. */
async function submitWin(playerName: string): Promise<void> {
  await leaderboardApi.submitWin(playerName);
}

/** Pads a count to two digits for the "01 / 25" counter. */
function formatCount(count: number): string {
  return String(count).padStart(2, '0');
}

/** Page title, lead copy and decorative orb. */
const BingoHero = (): ReactElement => (
  <BoardHero>
    <Eyebrow>A little game for the big moments</Eyebrow>
    <HeroTitle>
      The Open <HeroTitleAccent>Bingo.</HeroTitleAccent>
    </HeroTitle>
    <HeroLead>
      From unforgettable routines to the moments between them—celebrate everything that makes The Open magical.
    </HeroLead>
    <HeroArt aria-hidden="true">
      <HeroOrb>✦</HeroOrb>
      <Sparkle $top="14%" $left="2%" />
      <Sparkle $top="2%" $left="88%" />
      <Sparkle $top="80%" $left="84%" />
    </HeroArt>
  </BoardHero>
);
BingoHero.displayName = 'BingoHero';

/** The playable bingo board with loading, error, and win-modal handling. */
const BingoBoard = (): ReactElement => {
  const {
    board,
    isLoading,
    errorMessage,
    isWinModalOpen,
    canSubmitScore,
    toggleCell,
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
      <Page>
        <BingoHero />
        <StatusBox role="status" aria-live="polite">
          Loading board...
        </StatusBox>
      </Page>
    );
  }

  if (errorMessage !== null || board === null) {
    return (
      <Page>
        <BingoHero />
        <StatusBox role="alert">
          <p>{errorMessage}</p>
          <Button type="button" onClick={startNewBoard}>
            Try Again
          </Button>
        </StatusBox>
      </Page>
    );
  }

  const markedCount = board.filter((cell) => cell.isMarked).length;
  const markedPercent = (markedCount / TOTAL_CELLS) * 100;

  return (
    <Page>
      <BingoHero />
      <BoardCard>
        <BoardSection>
          <BoardHeader>
            <BoardTitle ref={titleRef} tabIndex={-1}>
              Your Bingo Board
            </BoardTitle>
            <BoardSubtitle>Spot a moment? Tap its square. Five in a row wins.</BoardSubtitle>
          </BoardHeader>
          <ColumnLetters aria-hidden="true">
            {COLUMN_LETTERS.map((letter) => (
              <span key={letter}>{letter}</span>
            ))}
          </ColumnLetters>
          <Grid role="group" aria-label="Bingo board">
            {board.map((cell, index) => (
              <CellButton
                key={`${index}-${cell.text}`}
                type="button"
                aria-pressed={cell.isMarked}
                $isMarked={cell.isMarked}
                $isFree={cell.isFree}
                onClick={() => toggleCell(index)}
              >
                <CellText $isMarked={cell.isMarked} $isFree={cell.isFree}>
                  {cell.text}
                </CellText>
                {cell.isFree && <FreeGlyph aria-hidden="true">✦</FreeGlyph>}
              </CellButton>
            ))}
          </Grid>
        </BoardSection>

        <Progress>
          <ProgressLabel id="moments-spotted-label">Moments spotted</ProgressLabel>
          <ProgressCount>
            {formatCount(markedCount)} / {TOTAL_CELLS}
          </ProgressCount>
          <ProgressTrack
            role="progressbar"
            aria-labelledby="moments-spotted-label"
            aria-valuemin={0}
            aria-valuemax={TOTAL_CELLS}
            aria-valuenow={markedCount}
          >
            <ProgressFill $percent={markedPercent} />
          </ProgressTrack>
          <ProgressCaption>Every square is a moment worth celebrating.</ProgressCaption>
        </Progress>

        <BoardExtras>
          <Callout>
            <CalloutTitle>The Floor Is Yours</CalloutTitle>
            <CalloutText>Keep your eyes on the dance floor and mark what you see.</CalloutText>
          </Callout>

          <BoardActions>
            {canSubmitScore && (
              <Button type="button" onClick={openWinModal}>
                Submit score
              </Button>
            )}
            <Button type="button" $variant={canSubmitScore ? 'secondary' : 'primary'} onClick={handleStartNewBoard}>
              <span aria-hidden="true">✦&nbsp;&nbsp;</span>New Board
            </Button>
            <BoardHint>The center is always free. Tap a marked square again to undo it.</BoardHint>
          </BoardActions>
        </BoardExtras>
      </BoardCard>
      {isWinModalOpen && (
        <WinModal onSubmit={handleSubmitWin} onClose={closeWinModal} onPlayAgain={handleStartNewBoard} />
      )}
    </Page>
  );
};
BingoBoard.displayName = 'BingoBoard';

export default BingoBoard;
