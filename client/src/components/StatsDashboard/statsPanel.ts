import styled from 'styled-components';
import { eyebrowText } from '../../styles/PageHero';

/** Inset panel that frames one dashboard section. */
export const Panel = styled.section`
  min-width: 0;
  padding: 1.25rem;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.small};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem 0.75rem;
  }
`;

/** Section heading inside a panel. */
export const PanelTitle = styled.h3`
  ${eyebrowText}
  margin-bottom: 1rem;
`;

/** Muted explanatory line under a panel heading. */
export const PanelNote = styled.p`
  margin: -0.5rem 0 1rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Hides content visually while keeping it available to assistive technology. */
export const VisuallyHidden = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
