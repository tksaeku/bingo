import styled, { css } from 'styled-components';
import { Button } from '../../styles/Button';
import { eyebrowText } from '../../styles/PageHero';

/** Inset panel holding the add-card field and button. */
export const AddForm = styled.form`
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.small};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
  }
`;

/** Label and input stacked. */
export const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

/** Submit button sized to match the input height. */
export const AddButton = styled(Button)`
  min-height: 2.875rem;
  white-space: nowrap;
`;

/** Deck size block in the card header. */
export const DeckCount = styled.div`
  text-align: right;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    text-align: left;
  }
`;

/** Large deck size numeral. */
export const DeckCountNumber = styled.p`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 2.5rem;
  line-height: 1;
  color: white;
`;

/** Label under the deck size. */
export const DeckCountLabel = styled.p`
  ${eyebrowText}
  font-size: 0.625rem;
  margin-top: 0.375rem;
`;

/** Spacing wrapper for the short-deck warning. */
export const WarningSpacer = styled.div`
  margin-bottom: 1.5rem;
`;

/** Heading above the tile grid. */
export const ListHeading = styled.h3`
  ${eyebrowText}
  font-weight: 400;
  margin: 0.5rem 0 1rem;
`;

/** Responsive grid of card tiles. */
export const List = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

interface ListItemProps {
  $isConfirming: boolean;
}

/** One card tile, styled like an unmarked board cell. */
export const ListItem = styled.li<ListItemProps>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.875rem;
  min-height: 112px;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.cellSurface};
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: ${({ theme }) => theme.radii.small};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  ${({ $isConfirming, theme }) =>
    $isConfirming &&
    css`
      border-color: ${theme.colors.danger};
      box-shadow: 0 0 0 1px ${theme.colors.danger};
    `}

  @media (max-width: 560px) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    min-height: 0;
    gap: 0.5rem;
    padding: 0.75rem 0.75rem 0.75rem 1rem;
  }
`;

/** Card text. */
export const OptionText = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.35;
  color: ${({ theme }) => theme.colors.cellText};
  overflow-wrap: break-word;

  @media (max-width: 560px) {
    flex: 1;
    min-width: 0;
  }
`;

/** Row of tile actions, aligned to the bottom right. */
export const ItemActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

/** Delete prompt shown while confirming. */
export const ConfirmText = styled.span`
  margin-right: auto;
  font-size: 0.8125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.dangerDark};
`;

/** Quiet text-style delete trigger on a light tile. */
export const DeleteButton = styled.button`
  padding: 0.375rem 0.5rem;
  font-family: inherit;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6e6c76;
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.radii.small};
  cursor: pointer;
  transition: color 0.2s;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.dangerDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** Cancel button readable on a light tile. */
export const CancelButton = styled(DeleteButton)`
  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.cellText};
  }
`;
