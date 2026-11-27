import styled from 'styled-components';
import { eyebrowText } from './PageHero';

/** Inline error banner. */
export const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.colors.dangerText};
  background-color: ${({ theme }) => theme.colors.dangerBackground};
  border: 1px solid ${({ theme }) => theme.colors.dangerBorder};
  padding: 0.75rem 1rem;
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 0.875rem;
  margin: 1rem 0;
`;

/** Text input shared by forms. */
export const TextInput = styled.input`
  flex: 1;
  width: 100%;
  padding: 0.875rem 1rem;
  font-family: inherit;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.small};
  transition: border-color 0.2s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.faintText};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** Visible label for a form field, in the tracked eyebrow style. */
export const FieldLabel = styled.label`
  ${eyebrowText}
  display: block;
  font-size: 0.625rem;
  margin-bottom: 0.625rem;
`;
