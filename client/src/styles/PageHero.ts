import styled, { css } from 'styled-components';

/** Uppercase, widely tracked eyebrow text. */
export const eyebrowText = css`
  font-size: 0.6875rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Page column holding a hero and the page's main card. */
export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding-top: 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 1.5rem;
    padding-top: 1rem;
  }
`;

/** Intro block with eyebrow, title and lead copy. */
export const Hero = styled.section`
  position: relative;
  padding: 1.5rem 0 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding-top: 0.5rem;
  }
`;

/** Small line-prefixed eyebrow above the title. */
export const Eyebrow = styled.p`
  ${eyebrowText}
  display: flex;
  align-items: center;
  gap: 0.875rem;

  &::before {
    content: '';
    width: 2rem;
    height: 1px;
    background: ${({ theme }) => theme.colors.primary};
  }
`;

/** Page title. */
export const HeroTitle = styled.h1`
  position: relative;
  z-index: 1;
  margin-top: 0.75rem;
  font-family: ${({ theme }) => theme.fonts.display};
  font-weight: 400;
  font-size: clamp(2.5rem, 7vw, 4.5rem);
  line-height: 1.05;
  color: white;
`;

/** Bold accent word inside the title. */
export const HeroTitleAccent = styled.span`
  font-weight: 700;
`;

/** Lead paragraph under the title. */
export const HeroLead = styled.p`
  position: relative;
  z-index: 1;
  max-width: 36rem;
  margin-top: 1.5rem;
  font-size: 1.0625rem;
  font-weight: 300;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.mutedText};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1rem;
    margin-top: 1rem;
  }
`;
