import type { ReactElement } from 'react';
import AdminKeyForm from '../../components/AdminKeyForm/AdminKeyForm';
import StatsDashboard from '../../components/StatsDashboard/StatsDashboard/StatsDashboard';
import { useAdminKey } from '../../hooks/useAdminKey';
import { Eyebrow, Hero, HeroLead, HeroTitle, HeroTitleAccent, Page } from '../../styles/PageHero';

/** Shown on the key form after the server rejects the stored key. */
const KEY_REJECTED_MESSAGE = 'Your admin key was rejected. Enter it again.';

/** Admin page for usage stats: the admin-key form until a verified key is held, then the dashboard. */
const StatsPage = (): ReactElement => {
  const { adminKey, isVerifying, error, verifyAndStore, clearAdminKey } = useAdminKey();

  return (
    <Page>
      <Hero>
        <Eyebrow>Behind the scenes</Eyebrow>
        <HeroTitle>
          The <HeroTitleAccent>Stats.</HeroTitleAccent>
        </HeroTitle>
        <HeroLead>Anonymous usage numbers for the game: who plays, how far they get, and when.</HeroLead>
      </Hero>
      {adminKey === null ? (
        <AdminKeyForm
          onVerify={verifyAndStore}
          isVerifying={isVerifying}
          errorMessage={error}
          description="Enter the admin key to view the usage stats."
        />
      ) : (
        <StatsDashboard adminKey={adminKey} onUnauthorized={() => clearAdminKey(KEY_REJECTED_MESSAGE)} />
      )}
    </Page>
  );
};
StatsPage.displayName = 'StatsPage';

export default StatsPage;
