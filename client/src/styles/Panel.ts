import styled from 'styled-components';

/** White card used by the leaderboard, options and admin pages. */
export const Panel = styled.section`
  max-width: 800px;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.surface};
  padding: 2rem;
  border-radius: ${({ theme }) => theme.radii.medium};
  box-shadow: ${({ theme }) => theme.shadows.card};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem;
  }
`;

/** Centered, muted line shown when a list has no content. */
export const EmptyMessage = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.mutedText};
  padding: 2rem;
  font-size: 1.2rem;
  font-style: italic;
`;

/** Centered loading text for a panel with no data yet. */
export const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.primary};
`;

/** Inline error banner. */
export const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.dangerText};
  background-color: ${({ theme }) => theme.colors.dangerBackground};
  border: 1px solid ${({ theme }) => theme.colors.dangerBorder};
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radii.small};
  margin: 1rem 0;
`;

/** Text input shared by forms. */
export const TextInput = styled.input`
  flex: 1;
  padding: 1rem;
  font-size: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.small};
  transition: border-color 0.3s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** Visible label for a form field. */
export const FieldLabel = styled.label`
  display: block;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.5rem;
`;
