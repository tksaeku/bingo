import styled from 'styled-components';
import { Card } from '../../styles/Card';

/** Narrow card for the single-field unlock form, centered horizontally on the page. */
export const KeyCard = styled(Card)`
  width: 100%;
  max-width: 520px;
  margin-inline: auto;
`;

/** Stacked form fields and actions. */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  & > button {
    width: 100%;
  }
`;

/** Live verification status line. */
export const StatusText = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedText};

  &:empty {
    display: none;
  }
`;
