import type { ReactElement } from 'react';
import AddPasskeyOffer from '../../components/AddPasskeyOffer/AddPasskeyOffer';
import AdminUnlock from '../../components/AdminUnlock/AdminUnlock';
import StatsDashboard from '../../components/StatsDashboard/StatsDashboard/StatsDashboard';
import { useAdminSession } from '../../hooks/useAdminSession';
import { Card, CardLoading } from '../../styles/Card';
import { Eyebrow, Hero, HeroLead, HeroTitle, HeroTitleAccent, Page } from '../../styles/PageHero';

/** Admin page for usage stats: the unlock screen until the session is unlocked, then the dashboard. */
const StatsPage = (): ReactElement => {
  const {
    status,
    isBusy,
    error,
    justSignedInWithKey,
    unlockWithPasskey,
    unlockWithKey,
    addPasskey,
    dismissAddPasskeyOffer,
    markSessionEnded,
  } = useAdminSession();

  const handleAddPasskey = async (name?: string): Promise<void> => {
    await addPasskey(name);
  };

  return (
    <Page>
      <Hero>
        <Eyebrow>Behind the scenes</Eyebrow>
        <HeroTitle>
          The <HeroTitleAccent>Stats.</HeroTitleAccent>
        </HeroTitle>
        <HeroLead>Anonymous usage numbers for the game: who plays, how far they get, and when.</HeroLead>
      </Hero>
      {status === 'checking' && (
        <Card>
          <CardLoading role="status" aria-live="polite">
            Checking admin session...
          </CardLoading>
        </Card>
      )}
      {status === 'locked' && (
        <AdminUnlock
          onUnlockWithPasskey={unlockWithPasskey}
          onUnlockWithKey={unlockWithKey}
          isBusy={isBusy}
          errorMessage={error}
          description="Unlock to view the usage stats."
        />
      )}
      {status === 'unlocked' && (
        <>
          {justSignedInWithKey && (
            <AddPasskeyOffer
              onAdd={handleAddPasskey}
              onDismiss={dismissAddPasskeyOffer}
              isBusy={isBusy}
              error={error}
            />
          )}
          <StatsDashboard onUnauthorized={markSessionEnded} />
        </>
      )}
    </Page>
  );
};
StatsPage.displayName = 'StatsPage';

export default StatsPage;
