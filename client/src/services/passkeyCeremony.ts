import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import { authApi, passkeysApi } from './api';
import { PasskeyAlreadyRegisteredError } from './PasskeyAlreadyRegisteredError';
import { PasskeyDismissedError } from './PasskeyDismissedError';

/** Browser error names that mean "the prompt went away", not "something broke". */
const DISMISSAL_ERROR_NAMES = new Set(['NotAllowedError', 'AbortError']);

/** Browser error name for a registration blocked by `excludeCredentials`: the device already holds a listed passkey. */
const ALREADY_REGISTERED_ERROR_NAME = 'InvalidStateError';

/** Runs a browser ceremony, mapping a dismissed prompt to PasskeyDismissedError. */
async function runCeremony<Result>(ceremony: () => Promise<Result>): Promise<Result> {
  try {
    return await ceremony();
  } catch (error) {
    if (error instanceof Error && DISMISSAL_ERROR_NAMES.has(error.name)) {
      throw new PasskeyDismissedError();
    }
    throw error;
  }
}

/** True when this browser can run WebAuthn ceremonies. */
export function getSupportsPasskeys(): boolean {
  return browserSupportsWebAuthn();
}

/** Signs in with a passkey: server options, browser prompt, server verification. */
export async function unlockWithPasskey(): Promise<void> {
  const optionsJSON = await authApi.getPasskeyOptions();
  const response = await runCeremony(() => startAuthentication({ optionsJSON }));
  await authApi.verifyPasskey(response);
}

/** Registers a passkey for this device: server options, browser prompt, server registration. */
export async function createPasskey(name?: string): Promise<void> {
  const optionsJSON = await passkeysApi.getRegistrationOptions();
  const response = await runCeremony(async () => {
    try {
      return await startRegistration({ optionsJSON });
    } catch (error) {
      if (error instanceof Error && error.name === ALREADY_REGISTERED_ERROR_NAME) {
        throw new PasskeyAlreadyRegisteredError();
      }
      throw error;
    }
  });
  await passkeysApi.register(response, name);
}
