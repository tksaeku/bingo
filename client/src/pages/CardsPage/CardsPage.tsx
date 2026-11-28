import type { ReactElement } from 'react';
import AddPasskeyOffer from '../../components/AddPasskeyOffer/AddPasskeyOffer';
import AdminUnlock from '../../components/AdminUnlock/AdminUnlock';
import OptionsManager from '../../components/OptionsManager/OptionsManager';
import { useAdminSession } from '../../hooks/useAdminSession';
import { Card, CardLoading } from '../../styles/Card';
import { Eyebrow, Hero, HeroLead, HeroTitle, HeroTitleAccent, Page } from '../../styles/PageHero';

/** Admin page for the card deck: the unlock screen until the session is unlocked, then the card editor. */
const CardsPage = (): ReactElement => {
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
          The <HeroTitleAccent>Cards.</HeroTitleAccent>
        </HeroTitle>
        <HeroLead>Every square on every board is drawn from this deck. Add the moments worth spotting.</HeroLead>
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
          description="Unlock to manage the bingo cards."
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
          <OptionsManager onUnauthorized={markSessionEnded} />
        </>
      )}
    </Page>
  );
};
CardsPage.displayName = 'CardsPage';

export default CardsPage;
