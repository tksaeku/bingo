import styled from 'styled-components';
import { Card } from '../../../styles/Card';

/** Dashboard frame; sections stack with even spacing. */
export const DashboardCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
`;

/** Range presets, refresh button and freshness note. */
export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
`;

/** Segmented control holding the range presets. */
export const RangeGroup = styled.div`
  display: flex;
  flex: 1 1 18rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.small};
  overflow: hidden;
`;

/** One range preset; the pressed one is filled. */
export const RangeButton = styled.button`
  flex: 1;
  min-width: 0;
  padding: 0.625rem 0.5rem;
  border: none;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  color: ${({ theme }) => theme.colors.text};
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
  }

  &[aria-pressed='true'] {
    background: ${({ theme }) => theme.gradients.primary};
    color: white;
  }

  & + & {
    border-left: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

/** "Last updated" and timezone note. */
export const FreshnessNote = styled.p`
  flex: 1 1 100%;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Two panels side by side on wide screens, stacked on phones. */
export const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/** Three breakdown panels side by side on wide screens, stacked on phones. */
export const ThreeColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
