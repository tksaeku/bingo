import { useState } from 'react';
import type { ReactElement } from 'react';
import AddPasskeyOffer from '../../components/AddPasskeyOffer/AddPasskeyOffer';
import AdminUnlock from '../../components/AdminUnlock/AdminUnlock';
import PasskeyList from '../../components/PasskeyList/PasskeyList';
import { useAdminSession } from '../../hooks/useAdminSession';
import { AdminBar } from '../../styles/AdminBar';
import { Button } from '../../styles/Button';
import { Card, CardLoading } from '../../styles/Card';
import { ErrorMessage } from '../../styles/Form';
import { Eyebrow, Hero, HeroLead, HeroTitle, HeroTitleAccent, Page } from '../../styles/PageHero';

/** Admin page for passkeys: the unlock screen until the session is unlocked, then the passkey list and the Lock button. */
const PasskeysPage = (): ReactElement => {
  const {
    status,
    isBusy,
    error,
    justSignedInWithKey,
    unlockWithPasskey,
    unlockWithKey,
    addPasskey,
    dismissAddPasskeyOffer,
    lock,
    markSessionEnded,
  } = useAdminSession();
  const [passkeyListVersion, setPasskeyListVersion] = useState(0);
  const [isRemovingPasskey, setIsRemovingPasskey] = useState(false);
  const isAnyActionBusy = isBusy || isRemovingPasskey;

  const handleAddPasskey = async (name?: string): Promise<void> => {
    if (await addPasskey(name)) {
      setPasskeyListVersion((version) => version + 1);
    }
  };

  return (
    <Page>
      <Hero>
        <Eyebrow>Behind the scenes</Eyebrow>
        <HeroTitle>
          The <HeroTitleAccent>Passkeys.</HeroTitleAccent>
        </HeroTitle>
        <HeroLead>The devices that can unlock the admin pages. Remove one to sign that device out.</HeroLead>
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
          description="Unlock to manage the admin passkeys."
        />
      )}
      {status === 'unlocked' && (
        <>
          <AdminBar>
            <Button type="button" $variant="secondary" $size="small" disabled={isAnyActionBusy} onClick={() => void lock()}>
              Lock
            </Button>
            {error !== null && <ErrorMessage role="alert">{error}</ErrorMessage>}
          </AdminBar>
          {justSignedInWithKey && (
            <AddPasskeyOffer
              onAdd={handleAddPasskey}
              onDismiss={dismissAddPasskeyOffer}
              isBusy={isAnyActionBusy}
              error={error}
            />
          )}
          <PasskeyList
            key={passkeyListVersion}
            isBusy={isAnyActionBusy}
            onAdd={addPasskey}
            onRemovingChange={setIsRemovingPasskey}
            onSessionEnded={markSessionEnded}
          />
        </>
      )}
    </Page>
  );
};
PasskeysPage.displayName = 'PasskeysPage';

export default PasskeysPage;
