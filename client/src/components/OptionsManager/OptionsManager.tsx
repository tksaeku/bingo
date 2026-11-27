import { useId, useRef, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { OPTION_TEXT_MAX_LENGTH } from '../../constants';
import { useOptions } from '../../hooks/useOptions';
import { optionsApi } from '../../services/api';
import { getErrorMessage, getErrorStatus, getIsUnauthorized } from '../../services/apiErrors';
import { Button } from '../../styles/Button';
import { EmptyMessage, ErrorMessage, FieldLabel, LoadingMessage, Panel, TextInput } from '../../styles/Panel';
import {
  AddButton,
  AddForm,
  ConfirmText,
  InputGroup,
  ItemActions,
  List,
  ListItem,
  OptionText,
  SubHeading,
  Title,
} from './OptionsManager.styles';

interface OptionsManagerProps {
  adminKey: string;
  /** Called when the server rejects the admin key (HTTP 401). */
  onUnauthorized: () => void;
}

/** Maps an add failure to the message shown to the admin. */
function getAddErrorMessage(error: unknown): string {
  if (getErrorStatus(error) === 409) {
    return 'That option already exists.';
  }
  return getErrorMessage(error, 'Failed to add option.');
}

/**
 * Admin editor for the option pool. Mutations keep the list on screen, guard against
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
      handleMutationError(error, getErrorMessage(error, 'Failed to delete option.'));
    } finally {
      setIsMutating(false);
    }
  };

  if (loading) {
    return (
      <Panel>
        <LoadingMessage role="status" aria-live="polite">
          Loading options...
        </LoadingMessage>
      </Panel>
    );
  }

  return (
    <Panel aria-labelledby="options-title">
      <Title id="options-title">Manage Bingo Options</Title>

      <AddForm onSubmit={handleAdd}>
        <InputGroup>
          <FieldLabel htmlFor={inputId}>New option</FieldLabel>
          <TextInput
            id={inputId}
            ref={inputRef}
            type="text"
            placeholder="Enter new bingo option..."
            value={newOptionText}
            onChange={(event) => setNewOptionText(event.target.value)}
            maxLength={OPTION_TEXT_MAX_LENGTH}
          />
        </InputGroup>
        <AddButton type="submit" disabled={isMutating || newOptionText.trim() === ''}>
          Add Option
        </AddButton>
      </AddForm>

      {loadError !== null && <ErrorMessage role="alert">{loadError}</ErrorMessage>}
      {loadError !== null && options === null && (
        <Button type="button" onClick={refetch}>
          Retry
        </Button>
      )}
      {actionError !== null && <ErrorMessage role="alert">{actionError}</ErrorMessage>}

      {options !== null && (
        <section aria-labelledby="options-list-title">
          <SubHeading id="options-list-title">Current Options ({options.length})</SubHeading>
          {options.length === 0 ? (
            <EmptyMessage>No options yet. Add your first one above!</EmptyMessage>
          ) : (
            <List>
              {options.map((option) => (
                <ListItem key={option.id}>
                  <OptionText>{option.text}</OptionText>
                  {pendingDeleteId === option.id ? (
                    <ItemActions>
                      <ConfirmText>Delete this option?</ConfirmText>
                      <Button
                        type="button"
                        $variant="danger"
                        $size="small"
                        disabled={isMutating}
                        onClick={() => handleConfirmDelete(option.id)}
                      >
                        Confirm delete
                      </Button>
                      <Button
                        type="button"
                        $variant="secondary"
                        $size="small"
                        disabled={isMutating}
                        onClick={() => setPendingDeleteId(null)}
                      >
                        Cancel
                      </Button>
                    </ItemActions>
                  ) : (
                    <Button
                      type="button"
                      $variant="danger"
                      $size="small"
                      disabled={isMutating}
                      aria-label={`Delete ${option.text}`}
                      onClick={() => setPendingDeleteId(option.id)}
                    >
                      Delete
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </section>
      )}
    </Panel>
  );
};
OptionsManager.displayName = 'OptionsManager';

export default OptionsManager;
