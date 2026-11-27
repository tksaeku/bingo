import type { ReactElement, ReactNode } from 'react';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { Button } from '../../styles/Button';
import { ErrorMessage } from '../../styles/Form';
import { Eyebrow, Hero, HeroLead, HeroTitle, HeroTitleAccent, Page } from '../../styles/PageHero';
import {
  Callout,
  CalloutText,
  CalloutTitle,
  CardHeader,
  CardLoading,
  CardSubtitle,
  CardTitle,
} from '../../styles/Card';
import { HeaderRow, LeaderboardCard, NameCell, RankCell, Row, Table, WinsCell, WinsHeader } from './Leaderboard.styles';

/** Number of highlighted top ranks. */
const TOP_THREE_COUNT = 3;

/** Formats a zero-based index as a two-digit rank ("01", "02", ...). */
function formatRank(index: number): string {
  return String(index + 1).padStart(2, '0');
}

interface LeaderboardPageProps {
  children: ReactNode;
}

/** Hero plus the card frame shared by the loading and loaded states. */
const LeaderboardPage = ({ children }: LeaderboardPageProps): ReactElement => (
  <Page>
    <Hero>
      <Eyebrow>Hall of fame</Eyebrow>
      <HeroTitle>
        The <HeroTitleAccent>Leaderboard.</HeroTitleAccent>
      </HeroTitle>
      <HeroLead>The sharpest eyes on the floor, ranked by every five-in-a-row they called.</HeroLead>
    </Hero>
    <LeaderboardCard aria-labelledby="leaderboard-title">{children}</LeaderboardCard>
  </Page>
);
LeaderboardPage.displayName = 'LeaderboardPage';

/**
 * The top-20 leaderboard. Only the initial load shows a loading state; refreshes keep the
 * table visible, and a failed fetch shows an error instead of the empty message.
 */
const Leaderboard = (): ReactElement => {
  const { data: entries, loading, error, refetch } = useLeaderboard();

  if (loading) {
    return (
      <LeaderboardPage>
        <CardTitle id="leaderboard-title">Top Players</CardTitle>
        <CardLoading role="status" aria-live="polite">
          Loading leaderboard...
        </CardLoading>
      </LeaderboardPage>
    );
  }

  return (
    <LeaderboardPage>
      <CardHeader>
        <div>
          <CardTitle id="leaderboard-title">Top Players</CardTitle>
          <CardSubtitle>Top 20 by wins. Updates every 30 seconds.</CardSubtitle>
        </div>
        <Button type="button" $variant="secondary" $size="small" onClick={refetch}>
          Refresh
        </Button>
      </CardHeader>

      {error !== null && <ErrorMessage role="alert">{error}</ErrorMessage>}

      {entries !== null && entries.length === 0 && error === null && (
        <Callout>
          <CalloutTitle>No winners yet. Be the first!</CalloutTitle>
          <CalloutText>Get five in a row on the board and your name lands here.</CalloutText>
        </Callout>
      )}

      {entries !== null && entries.length > 0 && (
        <Table role="table" aria-label="Leaderboard">
          <div role="rowgroup">
            <HeaderRow role="row">
              <span role="columnheader">Rank</span>
              <span role="columnheader">Player</span>
              <WinsHeader role="columnheader">Wins</WinsHeader>
            </HeaderRow>
          </div>
          <div role="rowgroup">
            {entries.map((entry, index) => {
              const isTopThree = index < TOP_THREE_COUNT;
              return (
                <Row key={entry.id} role="row" $isTopThree={isTopThree}>
                  <RankCell role="cell" aria-label={`Rank ${index + 1}`} $isTopThree={isTopThree}>
                    {formatRank(index)}
                  </RankCell>
                  <NameCell role="cell" $isTopThree={isTopThree}>
                    {entry.playerName}
                  </NameCell>
                  <WinsCell role="cell">{entry.wins}</WinsCell>
                </Row>
              );
            })}
          </div>
        </Table>
      )}
    </LeaderboardPage>
  );
};
Leaderboard.displayName = 'Leaderboard';

export default Leaderboard;
