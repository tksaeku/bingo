import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import { describe, expect, it, vi } from 'vitest';
import { PASSKEY_ALREADY_REGISTERED_MESSAGE, PASSKEY_DISMISSED_MESSAGE } from '../constants';
import type {
  AdminPasskey,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '../types';
import { authApi, passkeysApi } from './api';
import { PasskeyAlreadyRegisteredError } from './PasskeyAlreadyRegisteredError';
import { PasskeyDismissedError } from './PasskeyDismissedError';
import {
  createPasskey,
  getSupportsPasskeys,
  unlockWithPasskey,
} from './passkeyCeremony';

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: vi.fn(),
  startAuthentication: vi.fn(),
  startRegistration: vi.fn(),
}));
vi.mock('./api', () => ({
  authApi: { getPasskeyOptions: vi.fn(), verifyPasskey: vi.fn() },
  passkeysApi: { getRegistrationOptions: vi.fn(), register: vi.fn() },
}));

/** Builds a browser-style error with the given name. */
function createNamedError(name: string): Error {
  const error = new Error('browser said no');
  error.name = name;
  return error;
}

describe('passkeyCeremony', () => {
  describe('getSupportsPasskeys', () => {
    it('reflects browserSupportsWebAuthn', () => {
      vi.mocked(browserSupportsWebAuthn).mockReturnValue(true);
      expect(getSupportsPasskeys()).toBe(true);

      vi.mocked(browserSupportsWebAuthn).mockReturnValue(false);
      expect(getSupportsPasskeys()).toBe(false);
    });
  });

  describe('unlockWithPasskey', () => {
    it('fetches options, prompts the browser, then verifies the response in order', async () => {
      const callOrder: string[] = [];
      const optionsJSON = { challenge: 'c' } as PublicKeyCredentialRequestOptionsJSON;
      const response = { id: 'cred' } as AuthenticationResponseJSON;
      vi.mocked(authApi.getPasskeyOptions).mockImplementation(async () => {
        callOrder.push('options');
        return optionsJSON;
      });
      vi.mocked(startAuthentication).mockImplementation(async () => {
        callOrder.push('start');
        return response;
      });
      vi.mocked(authApi.verifyPasskey).mockImplementation(async () => {
        callOrder.push('verify');
      });

      await unlockWithPasskey();

      expect(callOrder).toEqual(['options', 'start', 'verify']);
      expect(startAuthentication).toHaveBeenCalledWith({ optionsJSON });
      expect(authApi.verifyPasskey).toHaveBeenCalledWith(response);
    });

    it.each(['NotAllowedError', 'AbortError'])('maps %s to PasskeyDismissedError', async (name) => {
      vi.mocked(authApi.getPasskeyOptions).mockResolvedValue(
        {} as PublicKeyCredentialRequestOptionsJSON
      );
      vi.mocked(startAuthentication).mockRejectedValue(createNamedError(name));

      const failure = await unlockWithPasskey().catch((error) => error);

      expect(failure).toBeInstanceOf(PasskeyDismissedError);
      expect(failure.message).toBe(PASSKEY_DISMISSED_MESSAGE);
      expect(authApi.verifyPasskey).not.toHaveBeenCalled();
    });

    it('rethrows other browser errors unchanged', async () => {
      const error = createNamedError('SecurityError');
      vi.mocked(authApi.getPasskeyOptions).mockResolvedValue(
        {} as PublicKeyCredentialRequestOptionsJSON
      );
      vi.mocked(startAuthentication).mockRejectedValue(error);

      await expect(unlockWithPasskey()).rejects.toBe(error);
    });

    it('propagates a server verification failure', async () => {
      const error = new Error('401');
      vi.mocked(authApi.getPasskeyOptions).mockResolvedValue(
        {} as PublicKeyCredentialRequestOptionsJSON
      );
      vi.mocked(startAuthentication).mockResolvedValue({} as AuthenticationResponseJSON);
      vi.mocked(authApi.verifyPasskey).mockRejectedValue(error);

      await expect(unlockWithPasskey()).rejects.toBe(error);
    });
  });

  describe('createPasskey', () => {
    it('fetches options, prompts the browser, then registers with the name', async () => {
      const callOrder: string[] = [];
      const optionsJSON = { challenge: 'c' } as PublicKeyCredentialCreationOptionsJSON;
      const response = { id: 'cred' } as RegistrationResponseJSON;
      vi.mocked(passkeysApi.getRegistrationOptions).mockImplementation(async () => {
        callOrder.push('options');
        return optionsJSON;
      });
      vi.mocked(startRegistration).mockImplementation(async () => {
        callOrder.push('start');
        return response;
      });
      vi.mocked(passkeysApi.register).mockImplementation(async () => {
        callOrder.push('register');
        return {} as AdminPasskey;
      });

      await createPasskey('Laptop');

      expect(callOrder).toEqual(['options', 'start', 'register']);
      expect(startRegistration).toHaveBeenCalledWith({ optionsJSON });
      expect(passkeysApi.register).toHaveBeenCalledWith(response, 'Laptop');
    });

    it('maps a dismissed prompt to PasskeyDismissedError', async () => {
      vi.mocked(passkeysApi.getRegistrationOptions).mockResolvedValue(
        {} as PublicKeyCredentialCreationOptionsJSON
      );
      vi.mocked(startRegistration).mockRejectedValue(createNamedError('NotAllowedError'));

      await expect(createPasskey()).rejects.toBeInstanceOf(PasskeyDismissedError);
      expect(passkeysApi.register).not.toHaveBeenCalled();
    });

    it('maps InvalidStateError to PasskeyAlreadyRegisteredError', async () => {
      vi.mocked(passkeysApi.getRegistrationOptions).mockResolvedValue(
        {} as PublicKeyCredentialCreationOptionsJSON
      );
      vi.mocked(passkeysApi.register).mockClear();
      vi.mocked(startRegistration).mockRejectedValue(createNamedError('InvalidStateError'));

      const failure = await createPasskey().catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(PasskeyAlreadyRegisteredError);
      expect((failure as Error).message).toBe(PASSKEY_ALREADY_REGISTERED_MESSAGE);
      expect(passkeysApi.register).not.toHaveBeenCalled();
    });
  });
});
