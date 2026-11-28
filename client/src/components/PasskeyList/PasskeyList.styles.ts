import styled, { css } from 'styled-components';
import { eyebrowText } from '../../styles/PageHero';

/** Heading above the passkey rows. */
export const ListHeading = styled.h3`
  ${eyebrowText}
  font-weight: 400;
  margin: 0.5rem 0 1rem;
`;

/** Stacked passkey rows. */
export const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

interface RowProps {
  $isConfirming: boolean;
}

/** One passkey: details on the left, actions on the right. */
export const Row = styled.li<RowProps>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.small};

  ${({ $isConfirming, theme }) =>
    $isConfirming &&
    css`
      border-color: ${theme.colors.danger};
    `}
`;

/** Passkey name. */
export const PasskeyName = styled.p`
  font-size: 0.9375rem;
  font-weight: 700;
  color: white;
  overflow-wrap: anywhere;
`;

/** Added and last-used dates. */
export const PasskeyMeta = styled.p`
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Row of actions, aligned right. */
export const RowActions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

/** Remove prompt shown while confirming. */
export const ConfirmText = styled.span`
  font-size: 0.8125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.dangerText};
`;

/** Quiet text-style row action. */
export const TextButton = styled.button`
  padding: 0.375rem 0.5rem;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.mutedText};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.small};
  cursor: pointer;
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.dangerText};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
