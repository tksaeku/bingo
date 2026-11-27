import styled from 'styled-components';
import { Link, NavLink } from 'react-router-dom';

/** Styled shell. */
export const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

/** Styled navbar. */
export const Navbar = styled.nav`
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem;
  }
`;

/** Styled nav content. */
export const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    gap: 1rem;
  }
`;

/** Styled brand. */
export const Brand = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: ${({ theme }) => theme.colors.primaryDark};
  }
`;

/** Styled nav links. */
export const NavLinks = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 1rem;
  }
`;

/** Styled nav item. */
export const NavItem = styled(NavLink)`
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: ${({ theme }) => theme.radii.small};
  transition: all 0.3s;

  &:hover,
  &[aria-current='page'] {
    background-color: #f0f0f0;
    color: ${({ theme }) => theme.colors.primary};
  }

  &[aria-current='page'] {
    font-weight: 700;
  }
`;

/** Styled main. */
export const Main = styled.main`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem;
  }
`;
