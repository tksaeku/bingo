import styled from 'styled-components';

/** Grid of KPI tiles: four across on wide screens, two across on phones. */
export const TileGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

/** One KPI tile. */
export const Tile = styled.div`
  min-width: 0;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.surfaceInset};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.small};
`;

/** Tile caption. */
export const TileLabel = styled.dt`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedText};
`;

/** Tile number. */
export const TileValue = styled.dd`
  margin-top: 0.375rem;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: 2rem;
  line-height: 1.1;
  color: white;
  overflow-wrap: anywhere;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.625rem;
  }
`;
