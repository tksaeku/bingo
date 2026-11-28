import { describe, expect, it } from 'vitest';
import { FakeAdminPasskeyRepository } from '../../testSupport/FakeAdminPasskeyRepository';
import { FakeWebAuthnAdapter } from '../../testSupport/FakeWebAuthnAdapter';
import type { StoredAdminPasskey } from '../../types';
import { createAdminAuthService, getDefaultPasskeyName } from './adminAuthService';

const ADMIN_KEY = 'service-admin-key';
const NOW = new Date('2026-06-01T12:00:00.000Z');

function buildPasskey(overrides: Partial<StoredAdminPasskey> = {}): StoredAdminPasskey {
  return {
    id: 'credential-1',
    publicKey: 'AQID',
    counter: 3,
    transports: ['internal'],
    name: 'Laptop',
    createdAt: '2026-05-01T00:00:00.000Z',
    lastUsedAt: null,
    ...overrides,
  };
}

function setup(passkeys: StoredAdminPasskey[] = [], adminKey: string = ADMIN_KEY) {
  const clock = { now: NOW };
  const repository = new FakeAdminPasskeyRepository(passkeys);
  const webAuthn = new FakeWebAuthnAdapter();
  const service = createAdminAuthService({
    repository,
    webAuthn,
    adminKey,
    rpId: 'example.test',
    origins: ['https://example.test'],
    getNow: () => clock.now,
  });
  return { service, repository, webAuthn, clock };
}

const assertion: any = { id: 'credential-1', rawId: 'credential-1', type: 'public-key', response: {} };

describe('adminAuthService', () => {
  describe('signInWithKey (AC-P2)', () => {
    it('returns a session token for the correct key that reads as a valid session', async () => {
      const { service } = setup();
      const token = service.signInWithKey(ADMIN_KEY);
      expect(token).not.toBeNull();
      expect(await service.readSession(token)).toBe(true);
    });

    it('returns null for a wrong key', () => {
      const { service } = setup();
      expect(service.signInWithKey('wrong')).toBeNull();
    });

    it('returns null when no admin key is configured', () => {
      const { service } = setup([], '');
      expect(service.signInWithKey('')).toBeNull();
    });
  });

  describe('passkey sign-in (AC-P3, AC-P5, AC-P8)', () => {
    it('issues authentication options requiring user verification with no allowCredentials', async () => {
      const { service, webAuthn } = setup();
      const { options, challengeToken } = await service.createAuthenticationOptions();
      expect(options.challenge).toBe(FakeWebAuthnAdapter.CHALLENGE);
      expect(typeof challengeToken).toBe('string');
      expect(webAuthn.lastGenerateAuthenticationOptions).toEqual({ rpID: 'example.test', userVerification: 'required' });
    });

    it('verifies, records the new counter and lastUsedAt, and returns a session bound to the credential', async () => {
      const { service, repository, webAuthn } = setup([buildPasskey()]);
      const { challengeToken } = await service.createAuthenticationOptions();
      const token = await service.verifyAuthentication(assertion, challengeToken);
      expect(token).not.toBeNull();
      expect(await service.readSession(token)).toBe(true);
      expect(await repository.get('credential-1')).toMatchObject({ counter: 1, lastUsedAt: NOW.toISOString() });
      expect(webAuthn.lastVerifyAuthenticationResponse).toMatchObject({
        expectedChallenge: FakeWebAuthnAdapter.CHALLENGE,
        expectedOrigin: ['https://example.test'],
        expectedRPID: 'example.test',
        requireUserVerification: true,
      });
    });

    it('fails identically for a missing challenge, expired challenge, wrong purpose, unknown credential, failed verification and counter regression', async () => {
      const failures: Array<string | null> = [];

      const missing = setup([buildPasskey()]);
      failures.push(await missing.service.verifyAuthentication(assertion, undefined));

      const expired = setup([buildPasskey()]);
      const expiredChallenge = (await expired.service.createAuthenticationOptions()).challengeToken;
      expired.clock.now = new Date(NOW.getTime() + 300_001);
      failures.push(await expired.service.verifyAuthentication(assertion, expiredChallenge));

      const wrongPurpose = setup([buildPasskey()]);
      const registrationChallenge = (await wrongPurpose.service.createRegistrationOptions()).challengeToken;
      failures.push(await wrongPurpose.service.verifyAuthentication(assertion, registrationChallenge));

      const unknown = setup();
      failures.push(await unknown.service.verifyAuthentication(assertion, (await unknown.service.createAuthenticationOptions()).challengeToken));

      const failed = setup([buildPasskey()]);
      failed.webAuthn.authenticationResult = null;
      failures.push(await failed.service.verifyAuthentication(assertion, (await failed.service.createAuthenticationOptions()).challengeToken));

      const regression = setup([buildPasskey()]);
      (regression.webAuthn as any).verifyAuthenticationResponse = async () => {
        throw new Error('Response counter value 1 was lower than expected 3');
      };
      failures.push(await regression.service.verifyAuthentication(assertion, (await regression.service.createAuthenticationOptions()).challengeToken));

      expect(failures).toEqual([null, null, null, null, null, null]);
      expect((await regression.repository.get('credential-1'))?.counter).toBe(3);
      expect((await failed.repository.get('credential-1'))?.lastUsedAt).toBeNull();
    });

    it('rejects a challenge signed for another admin key', async () => {
      const other = setup([buildPasskey()], 'another-key');
      const { service } = setup([buildPasskey()]);
      const foreignChallenge = (await other.service.createAuthenticationOptions()).challengeToken;
      expect(await service.verifyAuthentication(assertion, foreignChallenge)).toBeNull();
    });
  });

  describe('registration (AC-P4, AC-P5, AC-P9)', () => {
    const attestation: any = { id: 'fake-credential', rawId: 'fake-credential', type: 'public-key', response: {} };

    it('requires a resident key and user verification and excludes stored passkeys', async () => {
      const { service, webAuthn } = setup([buildPasskey()]);
      await service.createRegistrationOptions();
      expect(webAuthn.lastGenerateRegistrationOptions).toMatchObject({
        rpName: 'Bingo admin',
        rpID: 'example.test',
        userName: 'admin',
        userDisplayName: 'admin',
        attestationType: 'none',
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        excludeCredentials: [{ id: 'credential-1', transports: ['internal'] }],
      });
    });

    it('stores the verified passkey with the given name and returns a bound session without key material', async () => {
      const { service, repository } = setup();
      const { challengeToken } = await service.createRegistrationOptions();
      const result = await service.registerPasskey(attestation, 'My phone', challengeToken);
      expect(result?.passkey).toEqual({ id: 'fake-credential', name: 'My phone', createdAt: NOW.toISOString(), lastUsedAt: null });
      expect(Object.keys(result?.passkey ?? {}).sort()).toEqual(['createdAt', 'id', 'lastUsedAt', 'name']);
      expect(await repository.get('fake-credential')).toMatchObject({ publicKey: 'AQID', counter: 0, transports: ['internal'] });
      expect(await service.readSession(result?.sessionToken)).toBe(true);
    });

    it('uses the default name when none is given', async () => {
      const { service } = setup();
      const { challengeToken } = await service.createRegistrationOptions();
      const result = await service.registerPasskey(attestation, undefined, challengeToken);
      expect(result?.passkey.name).toBe('Passkey added Jun 1, 2026');
    });

    it('formats the default name in the America/Los_Angeles date', () => {
      expect(getDefaultPasskeyName(new Date('2026-01-01T03:00:00.000Z'))).toBe('Passkey added Dec 31, 2025');
    });

    it('fails for a wrong-purpose or expired challenge, failed verification and an already stored credential', async () => {
      const wrongPurpose = setup();
      const authChallenge = (await wrongPurpose.service.createAuthenticationOptions()).challengeToken;
      expect(await wrongPurpose.service.registerPasskey(attestation, undefined, authChallenge)).toBeNull();

      const expired = setup();
      const expiredChallenge = (await expired.service.createRegistrationOptions()).challengeToken;
      expired.clock.now = new Date(NOW.getTime() + 300_001);
      expect(await expired.service.registerPasskey(attestation, undefined, expiredChallenge)).toBeNull();

      const failed = setup();
      failed.webAuthn.registrationResult = null;
      expect(await failed.service.registerPasskey(attestation, undefined, (await failed.service.createRegistrationOptions()).challengeToken)).toBeNull();

      const duplicate = setup([buildPasskey({ id: 'fake-credential' })]);
      expect(await duplicate.service.registerPasskey(attestation, undefined, (await duplicate.service.createRegistrationOptions()).challengeToken)).toBeNull();
      expect(duplicate.repository.passkeys).toHaveLength(1);
    });
  });

  describe('listPasskeys and deletePasskey (AC-P9)', () => {
    it('lists newest first without public keys', async () => {
      const { service } = setup([buildPasskey({ id: 'old' }), buildPasskey({ id: 'new', createdAt: '2026-05-20T00:00:00.000Z' })]);
      const list = await service.listPasskeys();
      expect(list.map((passkey) => passkey.id)).toEqual(['new', 'old']);
      expect(JSON.stringify(list)).not.toContain('publicKey');
      expect(JSON.stringify(list)).not.toContain('counter');
    });

    it('deletes an existing passkey and reports false for a missing one', async () => {
      const { service } = setup([buildPasskey()]);
      expect(await service.deletePasskey('credential-1')).toBe(true);
      expect(await service.deletePasskey('credential-1')).toBe(false);
    });
  });

  describe('readSession (AC-P6, AC-P7)', () => {
    it('rejects garbage, undefined and an expired session', async () => {
      const { service, clock } = setup();
      const token = service.signInWithKey(ADMIN_KEY);
      expect(await service.readSession('garbage')).toBe(false);
      expect(await service.readSession(undefined)).toBe(false);
      clock.now = new Date(NOW.getTime() + 43_200_000);
      expect(await service.readSession(token)).toBe(false);
    });

    it('is valid just before the 12 hour expiry', async () => {
      const { service, clock } = setup();
      const token = service.signInWithKey(ADMIN_KEY);
      clock.now = new Date(NOW.getTime() + 43_199_999);
      expect(await service.readSession(token)).toBe(true);
    });

    it('ends when the bound passkey is deleted', async () => {
      const { service } = setup([buildPasskey()]);
      const { challengeToken } = await service.createAuthenticationOptions();
      const token = await service.verifyAuthentication(assertion, challengeToken);
      expect(await service.readSession(token)).toBe(true);
      await service.deletePasskey('credential-1');
      expect(await service.readSession(token)).toBe(false);
    });

    it('does not accept a challenge token as a session', async () => {
      const { service } = setup();
      const { challengeToken } = await service.createAuthenticationOptions();
      expect(await service.readSession(challengeToken)).toBe(false);
    });
  });
});
