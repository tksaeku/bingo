import styled from 'styled-components';

/** List of labelled bars. */
export const Items = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
`;

/** One row: label and count above, bar below. */
export const Item = styled.li`
  min-width: 0;
`;

/** Label and count. */
export const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
`;

/** Bar background. */
export const BarTrack = styled.div`
  height: 0.5rem;
  background-color: ${({ theme }) => theme.colors.surfaceHover};
  border-radius: 999px;
  overflow: hidden;
`;

/** Filled part of a bar. */
export const BarFill = styled.div<{ $percent: number }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primaryLight};
  border-radius: 999px;
`;
