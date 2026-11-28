import { PASSKEY_DISMISSED_MESSAGE } from '../constants';

/** Thrown when the user cancels or the browser times out the passkey prompt. */
export class PasskeyDismissedError extends Error {
  constructor() {
    super(PASSKEY_DISMISSED_MESSAGE);
    this.name = 'PasskeyDismissedError';
  }
}
