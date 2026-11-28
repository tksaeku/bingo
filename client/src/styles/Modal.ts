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

/** Dimmed, blurred full-screen backdrop behind a modal dialog. */
export const ModalOverlay = styled.div`
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

/** Dark modal dialog card with a soft purple glow. */
export const ModalDialog = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  padding: 2.75rem 2.25rem 2.25rem;
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
