import { useId, useRef, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { OPTION_TEXT_MAX_LENGTH, REQUIRED_OPTION_COUNT } from '../../constants';
import { useOptions } from '../../hooks/useOptions';
import { optionsApi } from '../../services/api';
import { getErrorMessage, getErrorStatus, getIsUnauthorized } from '../../services/apiErrors';
import { Button } from '../../styles/Button';
import {
  Callout,
  CalloutText,
  CalloutTitle,
  Card,
  CardHeader,
  CardLoading,
  CardSubtitle,
  CardTitle,
} from '../../styles/Card';
import { ErrorMessage, FieldLabel, TextInput } from '../../styles/Form';
import {
  AddButton,
  AddForm,
  CancelButton,
  ConfirmText,
  DeckCount,
  DeckCountLabel,
  DeckCountNumber,
  DeleteButton,
  InputGroup,
  ItemActions,
  List,
  ListHeading,
  ListItem,
  OptionText,
  WarningSpacer,
} from './OptionsManager.styles';

interface OptionsManagerProps {
  adminKey: string;
  /** Called when the server rejects the admin key (HTTP 401). */
  onUnauthorized: () => void;
}

/** Maps an add failure to the message shown to the admin. */
function getAddErrorMessage(error: unknown): string {
  if (getErrorStatus(error) === 409) {
    return 'That card already exists.';
  }
  return getErrorMessage(error, 'Failed to add card.');
}

/**
 * Admin editor for the card deck (the option pool). Mutations keep the list on screen, guard against
 * overlapping requests, and confirm deletes with an in-page control.
 */
const OptionsManager = ({ adminKey, onUnauthorized }: OptionsManagerProps): ReactElement => {
  const { data: options, loading, error: loadError, refetch } = useOptions();
  const [newOptionText, setNewOptionText] = useState('');
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleMutationError = (error: unknown, message: string): void => {
    if (getIsUnauthorized(error)) {
      onUnauthorized();
      return;
    }
    setActionError(message);
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const text = newOptionText.trim();
    if (isMutating || text === '') {
      return;
    }
    setIsMutating(true);
    setActionError(null);
    try {
      await optionsApi.create(text, adminKey);
      setNewOptionText('');
      refetch();
      inputRef.current?.focus();
    } catch (error) {
      handleMutationError(error, getAddErrorMessage(error));
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmDelete = async (optionId: string): Promise<void> => {
    if (isMutating) {
      return;
    }
    setIsMutating(true);
    setActionError(null);
    try {
      await optionsApi.delete(optionId, adminKey);
      setPendingDeleteId(null);
      refetch();
      inputRef.current?.focus();
    } catch (error) {
      handleMutationError(error, getErrorMessage(error, 'Failed to delete card.'));
    } finally {
      setIsMutating(false);
    }
  };

  if (loading) {
    return (
      <Card aria-labelledby="options-title">
        <CardTitle id="options-title">The Deck</CardTitle>
        <CardLoading role="status" aria-live="polite">
          Loading cards...
        </CardLoading>
      </Card>
    );
  }

  return (
    <Card aria-labelledby="options-title">
      <CardHeader>
        <div>
          <CardTitle id="options-title">The Deck</CardTitle>
          <CardSubtitle>
            Each board draws {REQUIRED_OPTION_COUNT} cards at random, plus the free center square.
          </CardSubtitle>
        </div>
        {options !== null && (
          <DeckCount>
            <DeckCountNumber>{options.length}</DeckCountNumber>
            <DeckCountLabel>Cards in the deck</DeckCountLabel>
          </DeckCount>
        )}
      </CardHeader>

      <AddForm onSubmit={handleAdd}>
        <InputGroup>
          <FieldLabel htmlFor={inputId}>New card</FieldLabel>
          <TextInput
            id={inputId}
            ref={inputRef}
            type="text"
            placeholder="Describe a moment worth spotting..."
            value={newOptionText}
            onChange={(event) => setNewOptionText(event.target.value)}
            maxLength={OPTION_TEXT_MAX_LENGTH}
          />
        </InputGroup>
        <AddButton type="submit" disabled={isMutating || newOptionText.trim() === ''}>
          Add Card
        </AddButton>
      </AddForm>

      {loadError !== null && <ErrorMessage role="alert">{loadError}</ErrorMessage>}
      {loadError !== null && options === null && (
        <Button type="button" onClick={refetch}>
          Retry
        </Button>
      )}
      {actionError !== null && <ErrorMessage role="alert">{actionError}</ErrorMessage>}

      {options !== null && options.length < REQUIRED_OPTION_COUNT && (
        <WarningSpacer>
          <Callout>
            <CalloutTitle>Not enough cards to play</CalloutTitle>
            <CalloutText>
              Boards need at least {REQUIRED_OPTION_COUNT} cards. Add {REQUIRED_OPTION_COUNT - options.length} more to
              start playing.
            </CalloutText>
          </Callout>
        </WarningSpacer>
      )}

      {options !== null && (
        <section aria-labelledby="options-list-title">
          <ListHeading id="options-list-title">Current Cards ({options.length})</ListHeading>
          {options.length === 0 ? (
            <CardSubtitle>No cards yet. Add your first one above!</CardSubtitle>
          ) : (
            <List>
              {options.map((option) => (
                <ListItem key={option.id} $isConfirming={pendingDeleteId === option.id}>
                  <OptionText>{option.text}</OptionText>
                  {pendingDeleteId === option.id ? (
                    <ItemActions>
                      <ConfirmText>Delete this card?</ConfirmText>
                      <Button
                        type="button"
                        $variant="danger"
                        $size="small"
                        disabled={isMutating}
                        onClick={() => handleConfirmDelete(option.id)}
                      >
                        Confirm delete
                      </Button>
                      <CancelButton type="button" disabled={isMutating} onClick={() => setPendingDeleteId(null)}>
                        Cancel
                      </CancelButton>
                    </ItemActions>
                  ) : (
                    <ItemActions>
                      <DeleteButton
                        type="button"
                        disabled={isMutating}
                        aria-label={`Delete ${option.text}`}
                        onClick={() => setPendingDeleteId(option.id)}
                      >
                        Delete
                      </DeleteButton>
                    </ItemActions>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </section>
      )}
    </Card>
  );
};
OptionsManager.displayName = 'OptionsManager';

export default OptionsManager;
