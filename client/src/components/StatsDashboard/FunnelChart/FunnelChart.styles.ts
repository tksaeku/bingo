import styled from 'styled-components';

/** Ordered list of funnel rows. */
export const StepList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  list-style: none;
`;

/** One funnel step: label and figures above, bar below. */
export const Step = styled.li`
  min-width: 0;
`;

/** Label on the left, count and percent on the right. */
export const StepHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
`;

/** Step name. */
export const StepName = styled.span`
  color: ${({ theme }) => theme.colors.text};
`;

/** Count and percent of visitors. */
export const StepFigures = styled.span`
  color: ${({ theme }) => theme.colors.mutedText};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

/** Bar background. */
export const BarTrack = styled.div`
  height: 0.625rem;
  background-color: ${({ theme }) => theme.colors.surfaceHover};
  border-radius: 999px;
  overflow: hidden;
`;

/** Filled part of a bar. */
export const BarFill = styled.div<{ $percent: number }>`
  width: ${({ $percent }) => $percent}%;
  height: 100%;
  background: ${({ theme }) => theme.gradients.primary};
  border-radius: 999px;
`;
