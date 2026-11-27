import { useId, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { Button } from '../../styles/Button';
import { ErrorMessage, FieldLabel, Panel } from '../../styles/Panel';
import { Description, Form, KeyInput, Title } from './AdminKeyForm.styles';

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
    <Panel aria-labelledby="admin-key-title">
      <Title id="admin-key-title">Admin Access</Title>
      <Description>Enter the admin key to manage bingo options.</Description>
      <Form onSubmit={handleSubmit}>
        <div>
          <FieldLabel htmlFor={inputId}>Admin key</FieldLabel>
          <KeyInput
            id={inputId}
            type="password"
            value={candidateKey}
            onChange={(event) => setCandidateKey(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div aria-live="polite">{isVerifying && 'Verifying...'}</div>
        {errorMessage !== null && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
        <Button type="submit" disabled={isVerifying}>
          {isVerifying ? 'Verifying...' : 'Unlock'}
        </Button>
      </Form>
    </Panel>
  );
};
AdminKeyForm.displayName = 'AdminKeyForm';

export default AdminKeyForm;
