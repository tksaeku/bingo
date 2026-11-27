import styled, { css } from 'styled-components';
import { Link, NavLink } from 'react-router-dom';

/** Uppercase, widely tracked label text used by the header and footer. */
const trackedLabel = css`
  font-size: 0.6875rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
`;

/** Filled purple pill shared by the external link and the active nav item. */
const filledAction = css`
  background: ${({ theme }) => theme.colors.primary};
  color: white;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }
`;

/** Full-height column holding header, main content and footer. */
export const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

/** Top bar with brand and navigation. */
export const Header = styled.header`
  background-color: rgba(10, 10, 12, 0.85);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 1.25rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.875rem 1rem;
  }
`;

/** Centered row inside the header. */
export const HeaderContent = styled.div`
  max-width: 1160px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

/** Brand lockup linking home. */
export const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
`;

/** Boxed "The Open" wordmark. */
export const Wordmark = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #08080a;
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

/** Sparkle glyph inside the wordmark. */
export const WordmarkGlyph = styled.span`
  color: ${({ theme }) => theme.colors.primaryLight};
  font-size: 1rem;
`;

/** "World Swing Dance Championships" tagline beside the wordmark. */
export const BrandTagline = styled.span`
  ${trackedLabel}
  font-size: 0.625rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.mutedText};
  padding-left: 1rem;
  border-left: 1px solid ${({ theme }) => theme.colors.border};

  @media (max-width: 560px) {
    display: none;
  }
`;

/** Navigation link group. */
export const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 0.5rem;
  }
`;

/** Filled link out to The Open website. */
export const ExternalLink = styled.a`
  ${filledAction}
  padding: 0.75rem 1.125rem;
  border-radius: ${({ theme }) => theme.radii.small};
  font-size: 0.8125rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.2s;

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

/** In-app nav item; the current page is shown as a filled pill. */
export const NavItem = styled(NavLink)`
  ${trackedLabel}
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  padding: 0.75rem 1.125rem;
  border-radius: ${({ theme }) => theme.radii.small};
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryLight};
  }

  &[aria-current='page'] {
    ${filledAction}
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.625rem 0.75rem;
    letter-spacing: 0.18em;
  }
`;

/** Page content column. */
export const Main = styled.main`
  flex: 1;
  padding: 2rem;
  max-width: 1224px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem;
  }
`;

/** Site footer. */
export const Footer = styled.footer`
  max-width: 1224px;
  width: 100%;
  margin: 0 auto;
  padding: 3rem 2rem 2.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  align-items: center;
  ${trackedLabel}
  color: ${({ theme }) => theme.colors.faintText};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem;
    line-height: 1.8;
  }
`;

/** Underlined footer link to The Open website. */
export const FooterLink = styled.a`
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  padding-bottom: 0.125rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.primary};

  &:hover {
    color: ${({ theme }) => theme.colors.primaryLight};
  }
`;
