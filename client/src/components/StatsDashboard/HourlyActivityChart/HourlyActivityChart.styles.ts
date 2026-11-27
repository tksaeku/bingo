import styled from 'styled-components';

/** Row of 24 bars sharing a baseline. */
export const Bars = styled.div`
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  align-items: end;
  gap: 2px;
  height: 7.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

/** One hour's bar; height is a share of the busiest hour. */
export const Bar = styled.div<{ $percent: number }>`
  height: ${({ $percent }) => $percent}%;
  min-height: ${({ $percent }) => ($percent > 0 ? '2px' : '0')};
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: 2px 2px 0 0;
`;

/** Hour tick labels under the bars. */
export const Ticks = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.375rem;
  font-size: 0.6875rem;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Text summary of the busiest hour. */
export const PeakSummary = styled.p`
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
`;
