import type { AuthenticatorTransport } from '@simplewebauthn/server';
import type { WebAuthnAdapter } from '../features/adminAuth/webAuthnAdapter';

export type FakeRegistrationResult = {
  credentialId: string;
  publicKey: Uint8Array;
  counter: number;
  transports?: string[];
};

export type FakeAuthenticationResult = {
  newCounter: number;
};

/** Test adapter returning canned options; tests choose verified or failed results and read call counters. */
export class FakeWebAuthnAdapter implements WebAuthnAdapter {
  static readonly CHALLENGE = 'fake-challenge';

  registrationResult: FakeRegistrationResult | null = {
    credentialId: 'fake-credential',
    publicKey: new Uint8Array([1, 2, 3]),
    counter: 0,
    transports: ['internal'],
  };
  authenticationResult: FakeAuthenticationResult | null = { newCounter: 1 };

  generateRegistrationOptionsCalls = 0;
  verifyRegistrationResponseCalls = 0;
  generateAuthenticationOptionsCalls = 0;
  verifyAuthenticationResponseCalls = 0;

  /** Arguments of the most recent call to each method. */
  lastGenerateRegistrationOptions: Parameters<WebAuthnAdapter['generateRegistrationOptions']>[0] | null = null;
  lastVerifyRegistrationResponse: Parameters<WebAuthnAdapter['verifyRegistrationResponse']>[0] | null = null;
  lastGenerateAuthenticationOptions: Parameters<WebAuthnAdapter['generateAuthenticationOptions']>[0] | null = null;
  lastVerifyAuthenticationResponse: Parameters<WebAuthnAdapter['verifyAuthenticationResponse']>[0] | null = null;

  readonly generateRegistrationOptions: WebAuthnAdapter['generateRegistrationOptions'] = async (options) => {
    this.generateRegistrationOptionsCalls += 1;
    this.lastGenerateRegistrationOptions = options;
    return {
      rp: { name: options.rpName, id: options.rpID },
      user: { id: 'fake-user-id', name: options.userName, displayName: options.userDisplayName ?? '' },
      challenge: FakeWebAuthnAdapter.CHALLENGE,
      pubKeyCredParams: [],
      excludeCredentials: options.excludeCredentials?.map((credential) => ({ ...credential, type: 'public-key' as const, transports: credential.transports })),
    };
  };

  readonly verifyRegistrationResponse: WebAuthnAdapter['verifyRegistrationResponse'] = async (options) => {
    this.verifyRegistrationResponseCalls += 1;
    this.lastVerifyRegistrationResponse = options;
    const result = this.registrationResult;
    if (result === null) {
      return { verified: false };
    }
    return {
      verified: true,
      registrationInfo: {
        fmt: 'none',
        aaguid: '00000000-0000-0000-0000-000000000000',
        credential: { id: result.credentialId, publicKey: result.publicKey as Uint8Array<ArrayBuffer>, counter: result.counter, transports: result.transports as AuthenticatorTransport[] | undefined },
        credentialType: 'public-key',
        attestationObject: new Uint8Array() as Uint8Array<ArrayBuffer>,
        userVerified: true,
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        origin: Array.isArray(options.expectedOrigin) ? options.expectedOrigin[0] : options.expectedOrigin,
      },
    };
  };

  readonly generateAuthenticationOptions: WebAuthnAdapter['generateAuthenticationOptions'] = async (options) => {
    this.generateAuthenticationOptionsCalls += 1;
    this.lastGenerateAuthenticationOptions = options;
    return { challenge: FakeWebAuthnAdapter.CHALLENGE, rpId: options.rpID, allowCredentials: options.allowCredentials?.map((credential) => ({ ...credential, type: 'public-key' as const, transports: credential.transports })) };
  };

  readonly verifyAuthenticationResponse: WebAuthnAdapter['verifyAuthenticationResponse'] = async (options) => {
    this.verifyAuthenticationResponseCalls += 1;
    this.lastVerifyAuthenticationResponse = options;
    const result = this.authenticationResult;
    return {
      verified: result !== null,
      authenticationInfo: {
        credentialID: options.credential.id,
        newCounter: result?.newCounter ?? options.credential.counter,
        userVerified: result !== null,
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        origin: Array.isArray(options.expectedOrigin) ? options.expectedOrigin[0] : options.expectedOrigin,
        rpID: Array.isArray(options.expectedRPID) ? options.expectedRPID[0] : options.expectedRPID,
      },
    };
  };
}
