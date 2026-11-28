import { useId, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { getSupportsPasskeys } from '../../services/passkeyCeremony';
import { Button } from '../../styles/Button';
import { CardHeader, CardSubtitle, CardTitle } from '../../styles/Card';
import { ErrorMessage, FieldLabel, TextInput } from '../../styles/Form';
import { Actions, Form, KeyCard, KeyDisclosure, KeyDisclosureSummary, StatusText } from './AdminUnlock.styles';

interface AdminUnlockProps {
  /** Starts the passkey sign-in; called from a click so the browser allows the prompt. */
  onUnlockWithPasskey: () => Promise<void>;
  /** Signs in with the entered key; resolves true when accepted. */
  onUnlockWithKey: (candidateKey: string) => Promise<boolean>;
  isBusy: boolean;
  errorMessage: string | null;
  /** One line under the title saying what unlocking opens on this page. */
  description: string;
}

/** Unlock screen: a passkey button first, with the admin key form as the fallback. */
const AdminUnlock = ({
  onUnlockWithPasskey,
  onUnlockWithKey,
  isBusy,
  errorMessage,
  description,
}: AdminUnlockProps): ReactElement => {
  const [supportsPasskeys] = useState(getSupportsPasskeys);
  const [isKeyFormOpen, setIsKeyFormOpen] = useState(!supportsPasskeys);
  const [candidateKey, setCandidateKey] = useState('');
  const inputId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isBusy) {
      return;
    }
    const submittedKey = candidateKey;
    setCandidateKey('');
    await onUnlockWithKey(submittedKey);
  };

  return (
    <KeyCard aria-labelledby="admin-unlock-title">
      <CardHeader>
        <div>
          <CardTitle id="admin-unlock-title">Admin</CardTitle>
          <CardSubtitle>{description}</CardSubtitle>
        </div>
      </CardHeader>
      <Actions>
        {supportsPasskeys && (
          <Button type="button" disabled={isBusy} onClick={() => void onUnlockWithPasskey()}>
            Unlock with passkey
          </Button>
        )}
        <StatusText aria-live="polite">{isBusy && 'Working...'}</StatusText>
        {errorMessage !== null && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
      </Actions>
      <KeyDisclosure open={isKeyFormOpen} onToggle={(event) => setIsKeyFormOpen(event.currentTarget.open)}>
        <KeyDisclosureSummary>Use the admin key</KeyDisclosureSummary>
        <Form onSubmit={handleSubmit}>
          <div>
            <FieldLabel htmlFor={inputId}>Admin key</FieldLabel>
            <TextInput
              id={inputId}
              type="password"
              value={candidateKey}
              onChange={(event) => setCandidateKey(event.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={isBusy}>
            Sign in
          </Button>
        </Form>
      </KeyDisclosure>
    </KeyCard>
  );
};
AdminUnlock.displayName = 'AdminUnlock';

export default AdminUnlock;
