import type { ReactElement } from 'react';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { Button } from '../../styles/Button';
import { EmptyMessage, ErrorMessage, LoadingMessage, Panel } from '../../styles/Panel';
import { Actions, NameCell, RankCell, Row, Table, Title, WinsCell } from './Leaderboard.styles';

/** Medal emoji for ranks 1 to 3. */
const MEDALS = ['🥇', '🥈', '🥉'];
/** Number of highlighted top ranks. */
const TOP_THREE_COUNT = MEDALS.length;

/** Returns the medal for the top three ranks and `#n` afterwards. */
function getRankLabel(index: number): string {
  return index < TOP_THREE_COUNT ? MEDALS[index] : `#${index + 1}`;
}

/**
 * The top-20 leaderboard. Only the initial load shows a loading state; refreshes keep the
 * table visible, and a failed fetch shows an error instead of the empty message.
 */
const Leaderboard = (): ReactElement => {
  const { data: entries, loading, error, refetch } = useLeaderboard();

  if (loading) {
    return (
      <Panel aria-labelledby="leaderboard-title">
        <LoadingMessage role="status" aria-live="polite">
          Loading leaderboard...
        </LoadingMessage>
      </Panel>
    );
  }

  return (
    <Panel aria-labelledby="leaderboard-title">
      <Title id="leaderboard-title">🏆 Leaderboard</Title>

      {error !== null && <ErrorMessage role="alert">{error}</ErrorMessage>}

      {entries !== null && entries.length === 0 && error === null && (
        <EmptyMessage>No winners yet. Be the first!</EmptyMessage>
      )}

      {entries !== null && entries.length > 0 && (
        <Table role="table" aria-label="Leaderboard">
          <div role="rowgroup">
            <Row role="row" $isHeader>
              <RankCell role="columnheader">Rank</RankCell>
              <NameCell role="columnheader">Player</NameCell>
              <WinsCell role="columnheader">Wins</WinsCell>
            </Row>
          </div>
          <div role="rowgroup">
            {entries.map((entry, index) => (
              <Row key={entry.id} role="row" $isTopThree={index < TOP_THREE_COUNT}>
                <RankCell role="cell" aria-label={`Rank ${index + 1}`}>
                  {getRankLabel(index)}
                </RankCell>
                <NameCell role="cell">{entry.playerName}</NameCell>
                <WinsCell role="cell">{entry.wins}</WinsCell>
              </Row>
            ))}
          </div>
        </Table>
      )}

      <Actions>
        <Button type="button" $variant="secondary" onClick={refetch}>
          Refresh
        </Button>
      </Actions>
    </Panel>
  );
};
Leaderboard.displayName = 'Leaderboard';

export default Leaderboard;
