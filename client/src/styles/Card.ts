import styled from 'styled-components';

/** Dark bordered card that holds a page's main content. */
export const Card = styled.section`
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

/** Card heading row: title block on the left, actions on the right. */
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

  &:focus {
    outline: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.375rem;
  }
`;

/** Short line under the card heading. */
export const CardSubtitle = styled.p`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 300;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Purple-edged inset note. */
export const Callout = styled.div`
  padding: 1.25rem;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.small};
`;

/** Callout heading. */
export const CalloutTitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 400;
  font-size: 1.0625rem;
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

/** Centered muted line for loading states inside a card. */
export const CardLoading = styled.p`
  padding: 3rem 0;
  text-align: center;
  color: ${({ theme }) => theme.colors.mutedText};
`;
