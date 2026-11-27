import type { ReactElement } from 'react';
import type { AnalyticsSummary } from '../../../types';
import { formatCount } from '../statsFormat';
import { Tile, TileGrid, TileLabel, TileValue } from './StatTiles.styles';

interface StatTilesProps {
  summary: AnalyticsSummary;
}

/** The four headline numbers for the selected range. */
const StatTiles = ({ summary }: StatTilesProps): ReactElement => {
  const { events } = summary.totals;
  const tiles = [
    { label: 'Unique visitors', value: summary.uniqueVisitors },
    { label: 'Boards started', value: events.board_started },
    { label: 'Bingos', value: events.bingo },
    { label: 'Scores submitted', value: events.score_submitted },
  ];

  return (
    <TileGrid aria-label="Key numbers">
      {tiles.map((tile) => (
        <Tile key={tile.label}>
          <TileLabel>{tile.label}</TileLabel>
          <TileValue>{formatCount(tile.value)}</TileValue>
        </Tile>
      ))}
    </TileGrid>
  );
};
StatTiles.displayName = 'StatTiles';

export default StatTiles;
