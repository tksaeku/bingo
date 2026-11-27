import styled, { css } from 'styled-components';
import type { ButtonSize, ButtonVariant } from '../types';

interface ButtonProps {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
}

/** Shared button used across the app; variant and size are transient props. */
export const Button = styled.button<ButtonProps>`
  padding: ${({ $size }) => ($size === 'small' ? '0.5rem 1rem' : '0.75rem 1.5rem')};
  border: none;
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: ${({ $size }) => ($size === 'small' ? '0.875rem' : '1rem')};
  font-weight: 600;
  cursor: pointer;
  color: white;
  transition: all 0.3s;

  ${({ $variant = 'primary', theme }) => {
    if ($variant === 'secondary') {
      return css`
        background-color: ${theme.colors.secondary};
        &:hover:not(:disabled) {
          background-color: ${theme.colors.secondaryDark};
        }
      `;
    }
    if ($variant === 'danger') {
      return css`
        background-color: ${theme.colors.danger};
        &:hover:not(:disabled) {
          background-color: ${theme.colors.dangerDark};
        }
      `;
    }
    return css`
      background: ${theme.gradients.primary};
      &:hover:not(:disabled) {
        background: ${theme.gradients.primaryHover};
      }
    `;
  }}

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.raised};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
