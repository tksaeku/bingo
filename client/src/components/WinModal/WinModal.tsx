import { useId, useRef, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { PLAYER_NAME_MAX_LENGTH } from '../../constants';
import { getIsValidPlayerName, normalizePlayerName } from '../../game/playerName';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { getErrorMessage } from '../../services/apiErrors';
import { Button } from '../../styles/Button';
import { ErrorMessage, FieldLabel, TextInput } from '../../styles/Form';
import { createConfettiPieces } from './confetti';
import {
  ButtonGroup,
  Confetti,
  ConfettiPiece,
  Confirmation,
  Dialog,
  DialogEyebrow,
  Form,
  Message,
  NameField,
  Overlay,
  StatusText,
  Title,
  TitleGlyph,
} from './WinModal.styles';

interface WinModalProps {
  /** Submits the normalized player name; rejects on failure. */
  onSubmit: (playerName: string) => Promise<void>;
  onClose: () => void;
  onPlayAgain: () => void;
}

/** Label for the submit button given the current submission state. */
function getSubmitLabel(isSubmitting: boolean, hasError: boolean): string {
  if (isSubmitting) {
    return 'Submitting...';
  }
  return hasError ? 'Try Again' : 'Submit Score';
}

/**
 * Accessible win dialog: collects the player name, shows pending and error states with retry,
 * then confirms and offers Play Again. Closes only via Close, Escape, or Play Again.
 */
const WinModal = ({ onSubmit, onClose, onPlayAgain }: WinModalProps): ReactElement => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [confettiPieces] = useState(createConfettiPieces);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const inputId = useId();
  useFocusTrap(dialogRef, onClose);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (isSubmitting || !getIsValidPlayerName(playerName)) {
      return;
    }
    const normalizedName = normalizePlayerName(playerName);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit(normalizedName);
      setSubmittedName(normalizedName);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Could not submit your score. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Overlay>
      <Dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <Confetti aria-hidden="true">
          {confettiPieces.map((piece, index) => (
            <ConfettiPiece
              key={index}
              style={{
                left: `${piece.leftPercent}%`,
                animationDelay: `${piece.delaySeconds}s`,
                backgroundColor: piece.color,
                borderRadius: piece.isRound ? '50%' : '1px',
              }}
            />
          ))}
        </Confetti>

        <DialogEyebrow>Five in a row</DialogEyebrow>
        <Title id={titleId}>
          <TitleGlyph aria-hidden="true">✦</TitleGlyph>
          Bingo!
          <TitleGlyph aria-hidden="true">✦</TitleGlyph>
        </Title>
        <Message>You called it. Add your name to the leaderboard.</Message>

        {submittedName === null ? (
          <Form onSubmit={handleSubmit}>
            <NameField>
              <FieldLabel htmlFor={inputId}>Your name</FieldLabel>
              <TextInput
                id={inputId}
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                maxLength={PLAYER_NAME_MAX_LENGTH}
                autoComplete="nickname"
              />
            </NameField>
            <StatusText aria-live="polite">{isSubmitting && 'Submitting your score...'}</StatusText>
            {errorMessage !== null && <ErrorMessage role="alert">{errorMessage}</ErrorMessage>}
            <ButtonGroup>
              <Button type="submit" disabled={isSubmitting || !getIsValidPlayerName(playerName)}>
                {getSubmitLabel(isSubmitting, errorMessage !== null)}
              </Button>
              <Button type="button" $variant="secondary" onClick={onClose}>
                Close
              </Button>
            </ButtonGroup>
          </Form>
        ) : (
          <>
            <Confirmation role="status">Score submitted! Good luck, {submittedName}!</Confirmation>
            <ButtonGroup>
              <Button type="button" onClick={onPlayAgain} autoFocus>
                Play Again
              </Button>
              <Button type="button" $variant="secondary" onClick={onClose}>
                Close
              </Button>
            </ButtonGroup>
          </>
        )}
      </Dialog>
    </Overlay>
  );
};
WinModal.displayName = 'WinModal';

export default WinModal;
