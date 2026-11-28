import { useId, useRef, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { Button } from '../../styles/Button';
import { ErrorMessage, FieldLabel, TextInput } from '../../styles/Form';
import { ModalOverlay } from '../../styles/Modal';
import {
  OfferActions,
  OfferDialog,
  OfferError,
  OfferForm,
  OfferMessage,
  OfferTitle,
} from './AddPasskeyOffer.styles';

interface AddPasskeyOfferProps {
  /** Registers a passkey, with the optional name. */
  onAdd: (name?: string) => Promise<void>;
  /** Closes the dialog without adding a passkey. */
  onDismiss: () => void;
  isBusy: boolean;
  /** The latest add-passkey failure; null when there is none. */
  error: string | null;
}

/** Modal dialog that offers to add a passkey for this device right after an admin key sign-in. */
const AddPasskeyOffer = ({ onAdd, onDismiss, isBusy, error }: AddPasskeyOfferProps): ReactElement => {
  const [name, setName] = useState('');
  const inputId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleEscape = (): void => {
    if (!isBusy) {
      onDismiss();
    }
  };
  useFocusTrap(dialogRef, handleEscape);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isBusy) {
      return;
    }
    const trimmedName = name.trim();
    await onAdd(trimmedName === '' ? undefined : trimmedName);
  };

  return (
    <ModalOverlay>
      <OfferDialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <OfferTitle id={titleId}>Add a passkey for this device</OfferTitle>
        <OfferMessage>
          Next time, unlock with your fingerprint, face, or device PIN instead of the admin key.
        </OfferMessage>
        <OfferForm onSubmit={handleSubmit}>
          <div>
            <FieldLabel htmlFor={inputId}>Passkey name (optional)</FieldLabel>
            <TextInput id={inputId} type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          {error !== null && (
            <OfferError>
              <ErrorMessage role="alert">{error}</ErrorMessage>
            </OfferError>
          )}
          <OfferActions>
            <Button type="submit" disabled={isBusy}>
              Add passkey
            </Button>
            <Button type="button" $variant="secondary" disabled={isBusy} onClick={onDismiss}>
              Not now
            </Button>
          </OfferActions>
        </OfferForm>
      </OfferDialog>
    </ModalOverlay>
  );
};
AddPasskeyOffer.displayName = 'AddPasskeyOffer';

export default AddPasskeyOffer;
