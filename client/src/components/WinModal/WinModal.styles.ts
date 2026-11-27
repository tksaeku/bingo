import styled, { keyframes } from 'styled-components';
import { eyebrowText } from '../../styles/PageHero';

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

/** Dimmed, blurred backdrop. */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.overlay};
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

/** Dark dialog card with a soft purple glow. */
export const Dialog = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 2.75rem 2.25rem 2.25rem;
  text-align: center;
  background: radial-gradient(ellipse at 50% 0%, #2b2530 0%, ${({ theme }) => theme.colors.surface} 60%);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.large};
  box-shadow:
    ${({ theme }) => theme.shadows.modal},
    0 0 80px rgba(166, 91, 160, 0.18);
  animation: ${slideUp} 0.5s ease-out;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.25rem 1.25rem 1.5rem;
  }
`;

/** Tracked label above the title. */
export const DialogEyebrow = styled.p`
  ${eyebrowText}
  position: relative;
`;

/** "Bingo!" heading. */
export const Title = styled.h2`
  position: relative;
  margin-top: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 700;
  font-size: 3rem;
  line-height: 1.1;
  color: white;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 2.25rem;
  }
`;

/** Sparkle glyphs either side of the title. */
export const TitleGlyph = styled.span`
  display: inline-block;
  margin: 0 0.75rem;
  font-size: 1.25rem;
  vertical-align: middle;
  color: ${({ theme }) => theme.colors.primaryLight};
`;

/** Line under the title. */
export const Message = styled.p`
  position: relative;
  margin: 0.75rem 0 2rem;
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Name form; left-aligned fields inside the centered dialog. */
export const Form = styled.form`
  position: relative;
  display: flex;
  flex-direction: column;
  text-align: left;
`;

/** Space under the name input. */
export const NameField = styled.div`
  margin-bottom: 1rem;
`;

/** Live submission status line. */
export const StatusText = styled.div`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedText};
  margin-bottom: 0.5rem;

  &:empty {
    display: none;
  }
`;

/** Side-by-side dialog actions; stacked on phones. */
export const ButtonGroup = styled.div`
  position: relative;
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;

  > button {
    flex: 1;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

/** Success message after the score is saved. */
export const Confirmation = styled.p`
  position: relative;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.125rem;
  color: white;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.small};
`;

/** Clipped layer the confetti falls through. */
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

/** One confetti piece. */
export const ConfettiPiece = styled.div`
  position: absolute;
  width: 7px;
  height: 7px;
  top: -10px;
  animation: ${confettiFall} 3.5s linear infinite;
  opacity: 0.85;
`;
