import type {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import {
  ADMIN_SESSION_KEY_PURPOSE,
  ADMIN_SESSION_TTL_MS,
  ADMIN_USER_HANDLE,
  ANALYTICS_TIME_ZONE,
  WEBAUTHN_CHALLENGE_KEY_PURPOSE,
  WEBAUTHN_CHALLENGE_TTL_MS,
  WEBAUTHN_RP_NAME,
} from '../../constants';
import { createLogger } from '../../logger';
import { getKeysMatch } from '../../middleware/requireAdmin';
import type { AdminPasskeyRepository } from '../../repositories/repositoryTypes';
import type { StoredAdminPasskey } from '../../types';
import { type ChallengePurpose, challengePayloadSchema, credentialIdSchema, sessionPayloadSchema } from './adminAuthSchemas';
import { deriveSigningKey, readToken, signToken } from './signedToken';
import type { WebAuthnAdapter } from './webAuthnAdapter';

const logger = createLogger('adminAuthService');

/** The passkey shape returned to clients; never includes the public key, counter or transports. */
export type AdminPasskey = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
};

/** WebAuthn options plus the signed challenge cookie value to set alongside them. */
export type CeremonyOptions<Options> = {
  options: Options;
  challengeToken: string;
};

export type AdminAuthServiceDependencies = {
  repository: AdminPasskeyRepository;
  webAuthn: WebAuthnAdapter;
  /** Empty or undefined means admin access is not configured; the routes fail closed before reaching the service. */
  adminKey: string | undefined;
  rpId: string;
  origins: string[];
  getNow?: () => Date;
};

export type AdminAuthService = ReturnType<typeof createAdminAuthService>;

/** Maps a stored passkey to the public shape. */
export function toAdminPasskey(passkey: StoredAdminPasskey): AdminPasskey {
  return { id: passkey.id, name: passkey.name, createdAt: passkey.createdAt, lastUsedAt: passkey.lastUsedAt };
}

/** Default passkey name: `Passkey added <Mon D, YYYY>` using the America/Los_Angeles date. */
export function getDefaultPasskeyName(now: Date): string {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    timeZone: ANALYTICS_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(now);
  return `Passkey added ${formattedDate}`;
}

/**
 * Admin sign-in rules: key sign-in, passkey authentication, passkey registration and session reads.
 * Methods return plain results (including signed cookie values); handlers set the cookies.
 */
export function createAdminAuthService(dependencies: AdminAuthServiceDependencies) {
  const { repository, webAuthn, rpId, origins } = dependencies;
  const adminKey = dependencies.adminKey ?? '';
  const getNow = dependencies.getNow ?? ((): Date => new Date());
  const sessionKey = deriveSigningKey(adminKey, ADMIN_SESSION_KEY_PURPOSE);
  const challengeKey = deriveSigningKey(adminKey, WEBAUTHN_CHALLENGE_KEY_PURPOSE);

  /** Signs a session cookie value bound to `credentialId` (null for key sign-in). */
  function issueSessionToken(credentialId: string | null): string {
    return signToken({ credentialId, expiresAt: getNow().getTime() + ADMIN_SESSION_TTL_MS }, sessionKey);
  }

  /** Signs a challenge cookie value for the given ceremony. */
  function issueChallengeToken(challenge: string, purpose: ChallengePurpose): string {
    return signToken({ challenge, purpose, expiresAt: getNow().getTime() + WEBAUTHN_CHALLENGE_TTL_MS }, challengeKey);
  }

  /** Returns the challenge when the cookie is valid, unexpired and issued for `purpose`; otherwise null. */
  function readChallenge(challengeCookie: unknown, purpose: ChallengePurpose): string | null {
    const payload = readToken(challengeCookie, challengeKey, challengePayloadSchema, getNow().getTime());
    if (payload === null) {
      logger.warn({ purpose }, 'Missing, invalid or expired WebAuthn challenge');
      return null;
    }
    if (payload.purpose !== purpose) {
      logger.warn({ purpose, issuedFor: payload.purpose }, 'WebAuthn challenge issued for a different purpose');
      return null;
    }
    return payload.challenge;
  }

  /** Verifies the admin key in constant time; returns a session token or null. */
  function signInWithKey(providedKey: string): string | null {
    if (adminKey === '' || !getKeysMatch(providedKey, adminKey)) {
      return null;
    }
    return issueSessionToken(null);
  }

  /** Generates passkey sign-in options and the signed challenge cookie value. */
  async function createAuthenticationOptions(): Promise<CeremonyOptions<PublicKeyCredentialRequestOptionsJSON>> {
    const options = await webAuthn.generateAuthenticationOptions({ rpID: rpId, userVerification: 'required' });
    return { options, challengeToken: issueChallengeToken(options.challenge, 'authentication') };
  }

  /** Verifies a passkey assertion; returns a session token bound to the credential, or null on any failure. */
  async function verifyAuthentication(response: AuthenticationResponseJSON, challengeCookie: unknown): Promise<string | null> {
    const expectedChallenge = readChallenge(challengeCookie, 'authentication');
    if (expectedChallenge === null) {
      return null;
    }
    if (!credentialIdSchema.safeParse(response.id).success) {
      logger.warn({}, 'Passkey sign-in with a malformed credential ID');
      return null;
    }
    try {
      const stored = await repository.get(response.id);
      if (stored === null) {
        logger.warn({}, 'Passkey sign-in with an unknown credential');
        return null;
      }
      const verification = await webAuthn.verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpId,
        requireUserVerification: true,
        credential: {
          id: stored.id,
          publicKey: Buffer.from(stored.publicKey, 'base64url'),
          counter: stored.counter,
          transports: stored.transports as AuthenticatorTransport[],
        },
      });
      if (!verification.verified) {
        logger.warn({ credentialId: stored.id }, 'Passkey assertion was not verified');
        return null;
      }
      await repository.recordUse(stored.id, verification.authenticationInfo.newCounter, getNow());
      return issueSessionToken(stored.id);
    } catch (error) {
      logger.warn({ reason: error instanceof Error ? error.message : 'unknown' }, 'Passkey verification failed');
      return null;
    }
  }

  /** Generates passkey registration options, excluding stored credentials, and the signed challenge cookie value. */
  async function createRegistrationOptions(): Promise<CeremonyOptions<PublicKeyCredentialCreationOptionsJSON>> {
    const existing = await repository.list();
    const options = await webAuthn.generateRegistrationOptions({
      rpName: WEBAUTHN_RP_NAME,
      rpID: rpId,
      userName: 'admin',
      userDisplayName: 'admin',
      userID: ADMIN_USER_HANDLE,
      attestationType: 'none',
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      excludeCredentials: existing.map((passkey) => ({ id: passkey.id, transports: passkey.transports as AuthenticatorTransport[] })),
    });
    return { options, challengeToken: issueChallengeToken(options.challenge, 'registration') };
  }

  /** Verifies and stores a new passkey; returns it with a session token bound to it, or null on any failure. */
  async function registerPasskey(
    response: RegistrationResponseJSON,
    name: string | undefined,
    challengeCookie: unknown,
  ): Promise<{ passkey: AdminPasskey; sessionToken: string } | null> {
    const expectedChallenge = readChallenge(challengeCookie, 'registration');
    if (expectedChallenge === null) {
      return null;
    }
    try {
      const verification = await webAuthn.verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origins,
        expectedRPID: rpId,
        requireUserVerification: true,
      });
      if (!verification.verified || verification.registrationInfo === undefined) {
        logger.warn({}, 'Passkey registration was not verified');
        return null;
      }
      const { credential } = verification.registrationInfo;
      if (!credentialIdSchema.safeParse(credential.id).success) {
        logger.warn({}, 'Passkey registration with a malformed credential ID');
        return null;
      }
      if ((await repository.get(credential.id)) !== null) {
        logger.warn({ credentialId: credential.id }, 'Passkey registration for an already stored credential');
        return null;
      }
      const now = getNow();
      const created = await repository.create({
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        transports: credential.transports ?? [],
        name: name ?? getDefaultPasskeyName(now),
        createdAt: now.toISOString(),
        lastUsedAt: null,
      });
      return { passkey: toAdminPasskey(created), sessionToken: issueSessionToken(created.id) };
    } catch (error) {
      logger.warn({ reason: error instanceof Error ? error.message : 'unknown' }, 'Passkey registration failed');
      return null;
    }
  }

  /** Lists stored passkeys in their public shape. */
  async function listPasskeys(): Promise<AdminPasskey[]> {
    return (await repository.list()).map(toAdminPasskey);
  }

  /** Deletes a passkey; resolves false when it does not exist. */
  async function deletePasskey(id: string): Promise<boolean> {
    return repository.delete(id);
  }

  /** True when the cookie is a valid, unexpired session whose bound passkey (if any) still exists. */
  async function readSession(sessionCookie: unknown): Promise<boolean> {
    const payload = readToken(sessionCookie, sessionKey, sessionPayloadSchema, getNow().getTime());
    if (payload === null) {
      return false;
    }
    return payload.credentialId === null || (await repository.get(payload.credentialId)) !== null;
  }

  return {
    signInWithKey,
    createAuthenticationOptions,
    verifyAuthentication,
    createRegistrationOptions,
    registerPasskey,
    listPasskeys,
    deletePasskey,
    readSession,
  };
}
