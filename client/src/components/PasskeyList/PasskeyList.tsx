import { useState } from 'react';
import type { ReactElement } from 'react';
import { usePasskeys } from '../../hooks/usePasskeys';
import { getErrorMessage, getIsUnauthorized } from '../../services/apiErrors';
import { getSupportsPasskeys } from '../../services/passkeyCeremony';
import { Button } from '../../styles/Button';
import { Card, CardLoading, CardSubtitle, CardTitle } from '../../styles/Card';
import { ErrorMessage } from '../../styles/Form';
import { ConfirmText, List, PasskeyMeta, PasskeyName, Row, RowActions, TextButton } from './PasskeyList.styles';

/** Formats an ISO timestamp as a short date, e.g. "Mar 4". */
function formatShortDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface PasskeyListProps {
  /** True while any admin action on the page is in flight; disables every button here. */
  isBusy: boolean;
  /** Registers a passkey for this device. Resolves true when created. */
  onAdd: (name?: string) => Promise<boolean>;
  /** Called with true while a remove request is in flight, and false when it settles. */
  onRemovingChange: (isRemoving: boolean) => void;
  /** Called when a passkey request answers 401. */
  onSessionEnded: () => void;
}

/** Admin section on /cards: the stored passkeys, with remove (confirmed in the page) and add. */
const PasskeyList = ({ isBusy, onAdd, onRemovingChange, onSessionEnded }: PasskeyListProps): ReactElement => {
  const { data: passkeys, loading, error: loadError, refetch, remove } = usePasskeys(onSessionEnded);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const handleConfirmRemove = async (passkeyId: string): Promise<void> => {
    if (isBusy) {
      return;
    }
    onRemovingChange(true);
    setRemoveError(null);
    try {
      await remove(passkeyId);
      setPendingRemoveId(null);
    } catch (error) {
      if (getIsUnauthorized(error)) {
        onSessionEnded();
        return;
      }
      setRemoveError(getErrorMessage(error, 'Failed to remove the passkey.'));
    } finally {
      onRemovingChange(false);
    }
  };

  const handleAdd = async (): Promise<void> => {
    setRemoveError(null);
    if (await onAdd()) {
      refetch();
    }
  };

  const errorMessage = removeError ?? loadError;

  return (
    <Card aria-labelledby="passkeys-title">
      <CardTitle id="passkeys-title">Passkeys</CardTitle>
      <CardSubtitle>Devices that can unlock the admin pages without the admin key.</CardSubtitle>
      {loading ? (
        <CardLoading role="status" aria-live="polite">
          Loading passkeys...
        </CardLoading>
      ) : (
        <>
          {errorMessage !== null && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
          {passkeys !== null && passkeys.length === 0 && <CardSubtitle>No passkeys yet.</CardSubtitle>}
          {passkeys !== null && passkeys.length > 0 && (
            <List>
              {passkeys.map((passkey) => (
                <Row key={passkey.id} $isConfirming={pendingRemoveId === passkey.id}>
                  <div>
                    <PasskeyName>{passkey.name}</PasskeyName>
                    <PasskeyMeta>
                      Added {formatShortDate(passkey.createdAt)} ·{' '}
                      {passkey.lastUsedAt === null ? 'Never used' : `Last used ${formatShortDate(passkey.lastUsedAt)}`}
                    </PasskeyMeta>
                  </div>
                  {pendingRemoveId === passkey.id ? (
                    <RowActions>
                      <ConfirmText>Remove this passkey?</ConfirmText>
                      <Button
                        type="button"
                        $variant="danger"
                        $size="small"
                        disabled={isBusy}
                        onClick={() => handleConfirmRemove(passkey.id)}
                      >
                        Confirm remove
                      </Button>
                      <TextButton type="button" disabled={isBusy} onClick={() => setPendingRemoveId(null)}>
                        Cancel
                      </TextButton>
                    </RowActions>
                  ) : (
                    <RowActions>
                      <TextButton
                        type="button"
                        disabled={isBusy}
                        aria-label={`Remove ${passkey.name}`}
                        onClick={() => setPendingRemoveId(passkey.id)}
                      >
                        Remove
                      </TextButton>
                    </RowActions>
                  )}
                </Row>
              ))}
            </List>
          )}
          {getSupportsPasskeys() && (
            <Button type="button" disabled={isBusy} onClick={handleAdd}>
              Add a passkey
            </Button>
          )}
        </>
      )}
    </Card>
  );
};
PasskeyList.displayName = 'PasskeyList';

export default PasskeyList;
