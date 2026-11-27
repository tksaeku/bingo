import { useId, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { Button } from '../../styles/Button';
import { CardHeader, CardSubtitle, CardTitle } from '../../styles/Card';
import { ErrorMessage, FieldLabel, TextInput } from '../../styles/Form';
import { Form, KeyCard, StatusText } from './AdminKeyForm.styles';

interface AdminKeyFormProps {
  /** Verifies the entered key with the server; resolves true when accepted. */
  onVerify: (candidateKey: string) => Promise<boolean>;
  isVerifying: boolean;
  errorMessage: string | null;
}

/** Prompts for the admin key. The parent stores the key only after the server accepts it. */
const AdminKeyForm = ({ onVerify, isVerifying, errorMessage }: AdminKeyFormProps): ReactElement => {
  const [candidateKey, setCandidateKey] = useState('');
  const inputId = useId();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isVerifying) {
      return;
    }
    await onVerify(candidateKey);
  };

  return (
    <KeyCard aria-labelledby="admin-key-title">
      <CardHeader>
        <div>
          <CardTitle id="admin-key-title">Admin Access</CardTitle>
          <CardSubtitle>Enter the admin key to manage the bingo cards.</CardSubtitle>
        </div>
      </CardHeader>
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
        <StatusText aria-live="polite">{isVerifying && 'Verifying...'}</StatusText>
        {errorMessage !== null && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
        <Button type="submit" disabled={isVerifying}>
          {isVerifying ? 'Verifying...' : 'Unlock'}
        </Button>
      </Form>
    </KeyCard>
  );
};
AdminKeyForm.displayName = 'AdminKeyForm';

export default AdminKeyForm;
