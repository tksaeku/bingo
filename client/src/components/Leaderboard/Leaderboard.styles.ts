import styled from 'styled-components';

/** Styled title. */
export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2rem;
  text-align: center;
  font-size: 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 2rem;
  }
`;

/** Styled table. */
export const Table = styled.div`
  margin-bottom: 2rem;
`;

/** Styled row. */
export const Row = styled.div<{ $isHeader?: boolean; $isTopThree?: boolean }>`
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
  transition: background-color 0.3s;

  ${({ $isHeader, theme }) =>
    $isHeader
      ? `
    background: ${theme.gradients.primary};
    color: white;
    font-weight: bold;
    border-radius: 8px 8px 0 0;
    font-size: 1.1rem;
  `
      : `
    border-bottom: 1px solid ${theme.colors.border};
    &:hover { background-color: ${theme.colors.surfaceMuted}; }
    &:last-child { border-bottom: none; }
  `}

  ${({ $isTopThree, theme }) =>
    $isTopThree &&
    `
    background: ${theme.gradients.topThree};
    font-weight: 600;
    &:hover { background: ${theme.gradients.topThreeHover}; }
  `}

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 60px 1fr 80px;
    gap: 0.5rem;
    padding: 0.75rem;
  }
`;

/** Styled rank cell. */
export const RankCell = styled.div`
  text-align: center;
  font-size: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.2rem;
  }
`;

/** Styled name cell. */
export const NameCell = styled.div`
  font-size: 1.1rem;
  color: inherit;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1rem;
  }
`;

/** Styled wins cell. */
export const WinsCell = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1rem;
  }
`;

/** Styled actions. */
export const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;
