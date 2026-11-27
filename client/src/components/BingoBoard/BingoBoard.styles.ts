import styled, { css, keyframes } from 'styled-components';
import { eyebrowText, Hero } from '../../styles/PageHero';

/** Keyframes for a freshly marked cell. */
const markCell = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.06); }
  100% { transform: scale(1); }
`;

/** Slow twinkle for the hero sparkles. */
const twinkle = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

/** Hero for the board page, tall enough to hold the decorative art. */
export const BoardHero = styled(Hero)`
  min-height: 220px;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    min-height: 0;
  }
`;

/** Decorative orb, dotted ring and sparkles to the right of the hero. */
export const HeroArt = styled.div`
  position: absolute;
  top: -3.5rem;
  right: 2rem;
  width: 340px;
  height: 300px;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    inset: 10px 0;
    border-radius: 50%;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.55) 1px, transparent 1.6px);
    background-size: 11px 11px;
    mask-image: radial-gradient(circle, transparent 58%, black 60%, black 72%, transparent 74%);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 30px -10px 0 -30px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transform: rotate(-28deg);
  }

  /* Keeps the art clear of the title and lead copy just above the tablet breakpoint. */
  @media (max-width: 1100px) {
    right: 0;
    transform: scale(0.7);
    transform-origin: top right;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

/** Dark sphere in the center of the hero art. */
export const HeroOrb = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 220px;
  height: 220px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #2a2830 0%, #17171b 70%);
  box-shadow:
    0 0 80px rgba(166, 91, 160, 0.18),
    inset 0 0 40px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.6);
`;

interface SparkleProps {
  $top: string;
  $left: string;
}

/** Small glowing dot orbiting the hero orb. */
export const Sparkle = styled.span<SparkleProps>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #dcd6ff;
  box-shadow: 0 0 12px 4px rgba(190, 180, 255, 0.45);
  animation: ${twinkle} 3.5s ease-in-out infinite;
`;

/**
 * Card holding the board, the progress counter and the extras (tips and actions).
 * Desktop: progress and extras stack in a right-hand column. Narrower: progress above the board, extras below it.
 */
export const BoardCard = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 250px;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    'board progress'
    'board extras';
  column-gap: 2rem;
  padding: 2rem 1.875rem;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  box-shadow: ${({ theme }) => theme.shadows.card};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto;
    grid-template-areas:
      'progress'
      'board'
      'extras';
    gap: 1.5rem;
    padding: 1.5rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.125rem 0.875rem;
    margin: 0 -0.25rem;
  }
`;

/** Board column: heading, column letters and the grid. */
export const BoardSection = styled.div`
  grid-area: board;
  min-width: 0;
`;

/** Board heading block. */
export const BoardHeader = styled.div`
  margin-bottom: 1.25rem;
`;

/** Board heading; focused after a new board is generated. */
export const BoardTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 400;
  font-size: 1.75rem;
  color: white;

  &:focus {
    outline: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.375rem;
  }
`;

/** Short instruction under the board heading. */
export const BoardSubtitle = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 300;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** B-I-N-G-O letters above the columns. */
export const ColumnLetters = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.625rem;
  margin-bottom: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.25rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 0.375rem;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
`;

/** The 5x5 grid of cells. */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.625rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 0.375rem;
  }
`;

/** Loading or error panel shown in place of the board card. */
export const StatusBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  min-height: 300px;
  width: 100%;
  text-align: center;
  padding: 1.5rem;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  box-shadow: ${({ theme }) => theme.shadows.card};
  color: ${({ theme }) => theme.colors.mutedText};
`;

interface CellProps {
  $isMarked: boolean;
  $isFree: boolean;
}

/** One board cell. Marked and free cells share the purple treatment. */
export const CellButton = styled.button<CellProps>`
  position: relative;
  min-width: 0;
  aspect-ratio: 1 / 0.86;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  font-family: inherit;
  border-radius: ${({ theme }) => theme.radii.small};
  border: 1px solid
    ${({ $isMarked, $isFree, theme }) => ($isMarked || $isFree ? theme.colors.primaryLight : 'rgba(0, 0, 0, 0.12)')};
  background: ${({ $isFree, $isMarked, theme }) => {
    if ($isFree || $isMarked) {
      return theme.gradients.free;
    }
    return theme.gradients.cell;
  }};
  box-shadow: ${({ $isMarked, $isFree }) =>
    $isMarked || $isFree ? '0 0 24px rgba(166, 91, 160, 0.35)' : '0 1px 2px rgba(0, 0, 0, 0.3)'};
  cursor: ${({ $isFree }) => ($isFree ? 'default' : 'pointer')};
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  ${({ $isMarked, $isFree }) =>
    $isMarked &&
    !$isFree &&
    css`
      animation: ${markCell} 0.3s ease-out;
    `}

  &:hover {
    ${({ $isFree, theme }) =>
      !$isFree &&
      css`
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.raised};
      `}
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    aspect-ratio: 1;
    padding: 0.25rem;
  }
`;

/** Text inside a cell. */
export const CellText = styled.span<CellProps>`
  text-align: center;
  font-family: ${({ $isFree, theme }) => ($isFree ? theme.fonts.display : 'inherit')};
  font-weight: 700;
  font-size: ${({ $isFree }) => ($isFree ? '1.375rem' : '0.8125rem')};
  letter-spacing: ${({ $isFree }) => ($isFree ? '0.06em' : 'normal')};
  line-height: 1.25;
  color: ${({ $isMarked, $isFree, theme }) => ($isMarked || $isFree ? 'white' : theme.colors.cellText)};
  overflow-wrap: break-word;
  min-width: 0;
  max-width: 100%;

  /* Board column is narrowest just above the tablet breakpoint, beside the sidebar. */
  @media (max-width: 1100px) and (min-width: 901px) {
    font-size: ${({ $isFree }) => ($isFree ? '1.125rem' : '0.6875rem')};
    hyphens: auto;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ $isFree }) => ($isFree ? '0.9375rem' : '0.625rem')};
    line-height: 1.15;
    hyphens: auto;
  }
`;

/** Sparkle under the FREE label. */
export const FreeGlyph = styled.span`
  position: absolute;
  bottom: 0.625rem;
  left: 50%;
  transform: translateX(-50%);
  color: #f2c6ee;
  font-size: 0.875rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    bottom: 0.25rem;
    font-size: 0.625rem;
  }
`;

/** Divider and spacing shared by the right-hand column areas on desktop. */
const sideColumn = css`
  padding-left: 2rem;
  border-left: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding-left: 0;
    border-left: none;
  }
`;

/** Callout, New Board button and hint: under the counter on desktop, under the board on narrower screens. */
export const BoardExtras = styled.div`
  ${sideColumn}
  grid-area: extras;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1.25rem 1.5rem;
    align-items: start;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
`;

/** New Board / Submit score buttons and the hint below them. */
export const BoardActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  & > button {
    width: 100%;
  }
`;

/** Counter block: label, big number, progress bar and caption. */
export const Progress = styled.div`
  ${sideColumn}
  grid-area: progress;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding-bottom: 1.5rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

/** "Moments spotted" label. */
export const ProgressLabel = styled.p`
  ${eyebrowText}
  font-size: 0.625rem;
`;

/** Large "NN / 25" counter. */
export const ProgressCount = styled.p`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 2.5rem;
  line-height: 1;
  color: white;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 2rem;
  }
`;

/** Track behind the progress fill. */
export const ProgressTrack = styled.div`
  height: 4px;
  margin-top: 0.75rem;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.1);
  overflow: hidden;
`;

interface ProgressFillProps {
  $percent: number;
}

/** Filled portion of the progress bar. */
export const ProgressFill = styled.div<ProgressFillProps>`
  width: ${({ $percent }) => `${$percent}%`};
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  transition: width 0.3s ease-out;
`;

/** Caption under the progress bar. */
export const ProgressCaption = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 300;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Purple-edged callout card. */
export const Callout = styled.div`
  padding: 1.25rem 1.25rem 1.25rem 1.125rem;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.small};
`;

/** Callout heading. */
export const CalloutTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 400;
  font-size: 1rem;
  color: white;
`;

/** Callout body copy. */
export const CalloutText = styled.p`
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 300;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Small print under the board actions. */
export const BoardHint = styled.p`
  font-size: 0.75rem;
  font-weight: 300;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.faintText};
`;
