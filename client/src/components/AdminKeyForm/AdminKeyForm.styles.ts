import styled from 'styled-components';
import { Card } from '../../styles/Card';

/** Narrow card for the single-field unlock form. */
export const KeyCard = styled(Card)`
  max-width: 520px;
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
