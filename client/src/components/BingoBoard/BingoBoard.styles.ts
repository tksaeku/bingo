import styled, { css, keyframes } from 'styled-components';

/** Keyframes for the mark cell. */
const markCell = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

/** Styled container. */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

/** Styled title. */
export const Title = styled.h1`
  color: white;
  font-size: 2.5rem;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 2rem;
  }
`;

/** Styled grid. */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  background-color: ${({ theme }) => theme.colors.surface};
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radii.medium};
  box-shadow: ${({ theme }) => theme.shadows.card};
  max-width: 600px;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 0.25rem;
    padding: 0.5rem;
  }
`;

/** Styled status box. */
export const StatusBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 300px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.surface};
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radii.medium};
  box-shadow: ${({ theme }) => theme.shadows.card};
  color: ${({ theme }) => theme.colors.text};
`;

interface CellProps {
  $isMarked: boolean;
  $isFree: boolean;
}

/** Styled cell button. */
export const CellButton = styled.button<CellProps>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-family: inherit;
  background: ${({ $isFree, $isMarked, theme }) => {
    if ($isFree) {
      return theme.gradients.free;
    }
    return $isMarked ? theme.gradients.primary : theme.gradients.cell;
  }};
  border-radius: ${({ theme }) => theme.radii.small};
  cursor: ${({ $isMarked }) => ($isMarked ? 'default' : 'pointer')};
  transition: all 0.3s;
  padding: 0.5rem;
  min-height: 80px;
  ${({ $isMarked, $isFree }) =>
    $isMarked &&
    !$isFree &&
    css`
      animation: ${markCell} 0.3s ease-out;
    `}

  &:hover {
    ${({ $isMarked, theme }) =>
      !$isMarked &&
      css`
        transform: scale(1.05);
        box-shadow: ${theme.shadows.raised};
      `}
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 60px;
  }
`;

/** Styled cell text. */
export const CellText = styled.span<CellProps>`
  text-align: center;
  font-weight: ${({ $isFree }) => ($isFree ? 'bold' : '500')};
  color: ${({ $isMarked, $isFree, theme }) => ($isMarked || $isFree ? 'white' : theme.colors.text)};
  word-break: break-word;
  font-size: ${({ $isFree }) => ($isFree ? '1.2rem' : '0.875rem')};
  line-height: 1.2;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: ${({ $isFree }) => ($isFree ? '1.2rem' : '0.75rem')};
  }
`;
