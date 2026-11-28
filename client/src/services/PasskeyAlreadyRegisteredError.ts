import { PASSKEY_ALREADY_REGISTERED_MESSAGE } from '../constants';

/** Thrown when the browser refuses to register because this device already holds one of the app's passkeys. */
export class PasskeyAlreadyRegisteredError extends Error {
  constructor() {
    super(PASSKEY_ALREADY_REGISTERED_MESSAGE);
    this.name = 'PasskeyAlreadyRegisteredError';
  }
}
