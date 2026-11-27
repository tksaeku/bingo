import styled from 'styled-components';
import { TextInput } from '../../styles/Panel';

/** Styled title. */
export const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 1rem;
  text-align: center;
`;

/** Styled description. */
export const Description = styled.p`
  color: ${({ theme }) => theme.colors.mutedText};
  text-align: center;
  margin-bottom: 2rem;
`;

/** Styled form. */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 480px;
  margin: 0 auto;
`;

/** Full-width admin key input. */
export const KeyInput = styled(TextInput)`
  width: 100%;
`;
