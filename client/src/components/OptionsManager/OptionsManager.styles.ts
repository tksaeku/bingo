import styled from 'styled-components';
import { Button } from '../../styles/Button';

/** Styled title. */
export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2rem;
  text-align: center;
`;

/** Styled add form. */
export const AddForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

/** Styled input group. */
export const InputGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

/** Styled sub heading. */
export const SubHeading = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  font-size: 1.3rem;
`;

/** Styled list. */
export const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

/** Styled list item. */
export const ListItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  border-radius: ${({ theme }) => theme.radii.small};
  transition: background-color 0.3s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.surfaceHover};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`;

/** Styled option text. */
export const OptionText = styled.span`
  flex: 1;
  color: ${({ theme }) => theme.colors.text};
  word-break: break-word;
`;

/** Styled item actions. */
export const ItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/** Styled confirm text. */
export const ConfirmText = styled.span`
  color: ${({ theme }) => theme.colors.dangerText};
  font-weight: 600;
`;

/** Submit button aligned to the bottom of the add-option row. */
export const AddButton = styled(Button)`
  align-self: flex-end;
`;
