import styled, { keyframes } from 'styled-components';

/** Keyframes for the fade in. */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/** Keyframes for the slide up. */
const slideUp = keyframes`
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

/** Keyframes for the confetti fall. */
const confettiFall = keyframes`
  0% { top: -10px; transform: rotate(0deg); }
  100% { top: 100%; transform: rotate(720deg); }
`;

/** Styled overlay. */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

/** Styled dialog. */
export const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  padding: 3rem;
  border-radius: ${({ theme }) => theme.radii.large};
  box-shadow: ${({ theme }) => theme.shadows.modal};
  max-width: 500px;
  width: 90%;
  position: relative;
  animation: ${slideUp} 0.5s ease-out;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem;
  }
`;

/** Styled title. */
export const Title = styled.h1`
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
  background: ${({ theme }) => theme.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 2rem;
  }
`;

/** Styled message. */
export const Message = styled.p`
  text-align: center;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.2rem;
  }
`;

/** Styled form. */
export const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

/** Styled name input. */
export const NameInput = styled.input`
  padding: 1rem;
  font-size: 1.1rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.small};
  margin-bottom: 1rem;
  transition: border-color 0.3s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

/** Styled button group. */
export const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;

  > button {
    flex: 1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

/** Styled confirmation. */
export const Confirmation = styled.p`
  text-align: center;
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.primary};
  padding: 1rem 0 2rem;
`;

/** Styled confetti. */
export const Confetti = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.large};

  @media (prefers-reduced-motion: reduce) {
    display: none;
  }
`;

/** Styled confetti piece. */
export const ConfettiPiece = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  top: -10px;
  animation: ${confettiFall} 3s linear infinite;
  opacity: 0.8;
`;
