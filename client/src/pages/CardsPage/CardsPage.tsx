import type { ReactElement } from 'react';
import AdminKeyForm from '../../components/AdminKeyForm/AdminKeyForm';
import OptionsManager from '../../components/OptionsManager/OptionsManager';
import { useAdminKey } from '../../hooks/useAdminKey';
import { Eyebrow, Hero, HeroLead, HeroTitle, HeroTitleAccent, Page } from '../../styles/PageHero';

/** Shown on the key form after the server rejects the stored key. */
const KEY_REJECTED_MESSAGE = 'Your admin key was rejected. Enter it again.';

/** Admin page for the card deck: the admin-key form until a verified key is held, then the card editor. */
const CardsPage = (): ReactElement => {
  const { adminKey, isVerifying, error, verifyAndStore, clearAdminKey } = useAdminKey();

  return (
    <Page>
      <Hero>
        <Eyebrow>Behind the scenes</Eyebrow>
        <HeroTitle>
          The <HeroTitleAccent>Cards.</HeroTitleAccent>
        </HeroTitle>
        <HeroLead>Every square on every board is drawn from this deck. Add the moments worth spotting.</HeroLead>
      </Hero>
      {adminKey === null ? (
        <AdminKeyForm
          onVerify={verifyAndStore}
          isVerifying={isVerifying}
          errorMessage={error}
          description="Enter the admin key to manage the bingo cards."
        />
      ) : (
        <OptionsManager adminKey={adminKey} onUnauthorized={() => clearAdminKey(KEY_REJECTED_MESSAGE)} />
      )}
    </Page>
  );
};
CardsPage.displayName = 'CardsPage';

export default CardsPage;
