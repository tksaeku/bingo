import styled, { css } from 'styled-components';
import { Card } from '../../styles/Card';
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

/** Card sized for the three-column ranking table. */
export const LeaderboardCard = styled(Card)`
  max-width: 860px;
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
