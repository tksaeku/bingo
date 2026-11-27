import styled, { css } from 'styled-components';
import { eyebrowText } from '../../styles/PageHero';

/** Shared grid columns for header and body rows. */
const rowColumns = css`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 96px;
  gap: 1rem;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 44px minmax(0, 1fr) 64px;
    gap: 0.75rem;
  }
`;

/** Dark card holding the ranking table. */
export const Card = styled.section`
  max-width: 860px;
  width: 100%;
  padding: 2rem 1.875rem;
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.medium};
  box-shadow: ${({ theme }) => theme.shadows.card};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.25rem 1rem;
  }
`;

/** Card heading row: title on the left, Refresh on the right. */
export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

/** Card heading. */
export const CardTitle = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 400;
  font-size: 1.75rem;
  color: white;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.375rem;
  }
`;

/** Short line under the card heading. */
export const CardSubtitle = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 300;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Ranking table. */
export const Table = styled.div`
  display: flex;
  flex-direction: column;
`;

/** Column labels above the rows. */
export const HeaderRow = styled.div`
  ${rowColumns}
  ${eyebrowText}
  font-size: 0.625rem;
  padding: 0 1.25rem 0.75rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 0.75rem 0.625rem;
    letter-spacing: 0.2em;
  }
`;

interface RowProps {
  $isTopThree: boolean;
}

/** One player row; the top three get the purple treatment. */
export const Row = styled.div<RowProps>`
  ${rowColumns}
  padding: 1rem 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 2px solid transparent;
  transition: background 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  ${({ $isTopThree, theme }) =>
    $isTopThree &&
    css`
      background: ${theme.gradients.topThree};
      border-left-color: ${theme.colors.primary};

      &:hover {
        background: ${theme.gradients.topThreeHover};
      }
    `}

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.875rem 0.75rem;
  }
`;

/** Column header for the wins column, aligned with the numbers below it. */
export const WinsHeader = styled.span`
  text-align: right;
`;

/** Two-digit rank numeral. */
export const RankCell = styled.div<RowProps>`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.5rem;
  line-height: 1;
  color: ${({ $isTopThree, theme }) => ($isTopThree ? theme.colors.primaryLight : theme.colors.faintText)};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.125rem;
  }
`;

/** Player name. */
export const NameCell = styled.div<RowProps>`
  font-size: 1rem;
  font-weight: ${({ $isTopThree }) => ($isTopThree ? 700 : 400)};
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 0.9375rem;
  }
`;

/** Win count. */
export const WinsCell = styled.div`
  text-align: right;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.5rem;
  line-height: 1;
  color: white;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.125rem;
  }
`;

/** Purple-edged message shown when nobody has won yet. */
export const EmptyCallout = styled.div`
  padding: 1.5rem 1.25rem;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.small};
`;

/** Empty-state heading. */
export const EmptyTitle = styled.p`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.125rem;
  color: white;
`;

/** Empty-state body copy. */
export const EmptyText = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 300;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Loading line inside the card. */
export const LoadingText = styled.p`
  padding: 3rem 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.mutedText};
`;
