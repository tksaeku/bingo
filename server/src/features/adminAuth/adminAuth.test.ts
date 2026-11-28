import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { FakeAdminPasskeyRepository } from '../../testSupport/FakeAdminPasskeyRepository';
import { createTestApp, TEST_ADMIN_KEY } from '../../testSupport/createTestApp';

const credential = { id: 'fake-credential', rawId: 'fake-credential', type: 'public-key', response: { clientDataJSON: 'x' } };

function getSetCookies(response: request.Response): string[] {
  return (response.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
}

function findCookie(response: request.Response, name: string): string {
  return getSetCookies(response).find((cookie) => cookie.startsWith(`${name}=`)) ?? '';
}

function buildStoredPasskey() {
  return {
    id: 'stored-1',
    publicKey: 'AQID',
    counter: 0,
    transports: ['internal'],
    name: 'Laptop',
    createdAt: '2026-05-01T00:00:00.000Z',
    lastUsedAt: null,
  };
}

describe('/api/auth', () => {
  describe('POST /session', () => {
    it('sets a session cookie with the documented flags and returns 204', async () => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/auth/session').send({ adminKey: TEST_ADMIN_KEY });
      expect(response.status).toBe(204);
      const cookie = findCookie(response, 'bingo_admin_session');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/api');
      expect(cookie).toContain('Max-Age=43200');
      expect(cookie).not.toContain('Secure');
    });

    it('marks the cookie Secure only when every WebAuthn origin is https', async () => {
      const secure = createTestApp({ webAuthnOrigins: ['https://bingo.example'] });
      const mixed = createTestApp({ webAuthnOrigins: ['https://bingo.example', 'http://localhost:5173'] });
      expect(findCookie(await request(secure.app).post('/api/auth/session').send({ adminKey: TEST_ADMIN_KEY }), 'bingo_admin_session')).toContain('Secure');
      expect(findCookie(await request(mixed.app).post('/api/auth/session').send({ adminKey: TEST_ADMIN_KEY }), 'bingo_admin_session')).not.toContain('Secure');
    });

    it('returns 401 and sets nothing for a wrong key', async () => {
      const { app } = createTestApp();
      const response = await request(app).post('/api/auth/session').send({ adminKey: 'wrong' });
      expect(response.status).toBe(401);
      expect(getSetCookies(response)).toEqual([]);
    });

    it.each([{}, { adminKey: '' }, { adminKey: 5 }, { adminKey: 'x'.repeat(201) }])('returns 400 for invalid body %j', async (body) => {
      const { app } = createTestApp();
      expect((await request(app).post('/api/auth/session').send(body)).status).toBe(400);
    });

    it('returns 503 when ADMIN_KEY is unset', async () => {
      const { app } = createTestApp({ adminKey: '' });
      const response = await request(app).post('/api/auth/session').send({ adminKey: 'x' });
      expect(response.status).toBe(503);
    });
  });

  describe('DELETE /session', () => {
    it('clears the cookie and returns 204 with or without a session, and even with ADMIN_KEY unset', async () => {
      const { app } = createTestApp({ adminKey: '' });
      const response = await request(app).delete('/api/auth/session');
      expect(response.status).toBe(204);
      expect(findCookie(response, 'bingo_admin_session')).toContain('Expires=Thu, 01 Jan 1970');
    });
  });

  describe('passkey sign-in', () => {
    it('sets a challenge cookie with options, then verifies into a session and clears the challenge', async () => {
      const { app, adminPasskeyRepository } = createTestApp({ adminPasskeyRepository: new FakeAdminPasskeyRepository([buildStoredPasskey()]) });
      const agent = request.agent(app);
      const options = await agent.post('/api/auth/passkey/options');
      expect(options.status).toBe(200);
      expect(options.body.challenge).toBe('fake-challenge');
      const challengeCookie = findCookie(options, 'bingo_webauthn_challenge');
      expect(challengeCookie).toContain('Max-Age=300');
      expect(challengeCookie).toContain('HttpOnly');

      const verify = await agent.post('/api/auth/passkey/verify').send({ response: { ...credential, id: 'stored-1' } });
      expect(verify.status).toBe(204);
      expect(findCookie(verify, 'bingo_admin_session')).toContain('Max-Age=43200');
      expect(findCookie(verify, 'bingo_webauthn_challenge')).toContain('Expires=Thu, 01 Jan 1970');
      expect((await adminPasskeyRepository.get('stored-1'))?.lastUsedAt).not.toBeNull();
      expect((await agent.get('/api/admin/verify')).status).toBe(204);
    });

    it('returns the same generic 401 for no challenge, unknown credential and failed verification, and clears the challenge', async () => {
      const noChallenge = createTestApp({ adminPasskeyRepository: new FakeAdminPasskeyRepository([buildStoredPasskey()]) });
      const first = await request(noChallenge.app).post('/api/auth/passkey/verify').send({ response: { ...credential, id: 'stored-1' } });

      const unknown = createTestApp();
      const unknownAgent = request.agent(unknown.app);
      await unknownAgent.post('/api/auth/passkey/options');
      const second = await unknownAgent.post('/api/auth/passkey/verify').send({ response: credential });

      const failing = createTestApp({ adminPasskeyRepository: new FakeAdminPasskeyRepository([buildStoredPasskey()]) });
      failing.webAuthn.authenticationResult = null;
      const failingAgent = request.agent(failing.app);
      await failingAgent.post('/api/auth/passkey/options');
      const third = await failingAgent.post('/api/auth/passkey/verify').send({ response: { ...credential, id: 'stored-1' } });

      for (const response of [first, second, third]) {
        expect(response.status).toBe(401);
        expect(response.body).toEqual({ error: 'Passkey sign-in failed' });
        expect(findCookie(response, 'bingo_webauthn_challenge')).toContain('Expires=Thu, 01 Jan 1970');
        expect(findCookie(response, 'bingo_admin_session')).toBe('');
      }
    });

    it.each(['a/b', '', 'x'.repeat(1024)])('returns the generic 401 without touching the repository for credential id %j', async (credentialId) => {
      const { app, adminPasskeyRepository } = createTestApp({ adminPasskeyRepository: new FakeAdminPasskeyRepository([buildStoredPasskey()]) });
      const getSpy = vi.spyOn(adminPasskeyRepository, 'get');
      const agent = request.agent(app);
      await agent.post('/api/auth/passkey/options');
      const response = await agent.post('/api/auth/passkey/verify').send({ response: { ...credential, id: credentialId } });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Passkey sign-in failed' });
      expect(getSpy).not.toHaveBeenCalled();
    });

    it.each([{}, { response: 'x' }, { response: { id: 'a', rawId: 'a', type: 'other', response: {} } }])('returns 400 for invalid body %j', async (body) => {
      const { app } = createTestApp();
      expect((await request(app).post('/api/auth/passkey/verify').send(body)).status).toBe(400);
    });

    it('returns 503 when ADMIN_KEY is unset', async () => {
      const { app } = createTestApp({ adminKey: '' });
      expect((await request(app).post('/api/auth/passkey/options')).status).toBe(503);
      expect((await request(app).post('/api/auth/passkey/verify').send({ response: credential })).status).toBe(503);
    });
  });

  describe('rate limit (AC-P12)', () => {
    it('returns 429 on the 11th request, counted before the key check', async () => {
      const { app } = createTestApp();
      const statuses: number[] = [];
      for (let attempt = 0; attempt < 11; attempt += 1) {
        statuses.push((await request(app).post('/api/auth/session').send({ adminKey: 'wrong' })).status);
      }
      expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
      expect(statuses[10]).toBe(429);
    });
  });
});

describe('/api/admin/passkeys', () => {
  describe('auth', () => {
    it('requires admin on every route: 401 without credentials, 503 with ADMIN_KEY unset', async () => {
      const { app } = createTestApp();
      expect((await request(app).post('/api/admin/passkeys/registration-options')).status).toBe(401);
      expect((await request(app).post('/api/admin/passkeys').send({ response: credential })).status).toBe(401);
      expect((await request(app).get('/api/admin/passkeys')).status).toBe(401);
      expect((await request(app).delete('/api/admin/passkeys/abc')).status).toBe(401);
      const unset = createTestApp({ adminKey: '' });
      expect((await request(unset.app).get('/api/admin/passkeys')).status).toBe(503);
    });

    it('clears an invalid session cookie on 401', async () => {
      const { app } = createTestApp();
      const response = await request(app).get('/api/admin/passkeys').set('Cookie', 'bingo_admin_session=garbage');
      expect(response.status).toBe(401);
      expect(findCookie(response, 'bingo_admin_session')).toContain('Expires=Thu, 01 Jan 1970');
    });
  });

  describe('GET /', () => {
    it('lists passkeys newest first without key material', async () => {
      const { app } = createTestApp({
        adminPasskeyRepository: new FakeAdminPasskeyRepository([buildStoredPasskey(), { ...buildStoredPasskey(), id: 'stored-2', createdAt: '2026-05-10T00:00:00.000Z' }]),
      });
      const response = await request(app).get('/api/admin/passkeys').set('x-admin-key', TEST_ADMIN_KEY);
      expect(response.status).toBe(200);
      expect(response.body.map((passkey: any) => passkey.id)).toEqual(['stored-2', 'stored-1']);
      expect(response.body[0]).toEqual({ id: 'stored-2', name: 'Laptop', createdAt: '2026-05-10T00:00:00.000Z', lastUsedAt: null });
    });
  });

  describe('POST /registration-options and POST /', () => {
    it('registers a passkey with the given name, returns 201 and re-issues the session', async () => {
      const { app, adminPasskeyRepository } = createTestApp();
      const agent = request.agent(app);
      const options = await agent.post('/api/admin/passkeys/registration-options').set('x-admin-key', TEST_ADMIN_KEY);
      expect(options.status).toBe(200);
      expect(findCookie(options, 'bingo_webauthn_challenge')).toContain('Max-Age=300');

      const created = await agent.post('/api/admin/passkeys').set('x-admin-key', TEST_ADMIN_KEY).send({ response: credential, name: '  My phone  ' });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ id: 'fake-credential', name: 'My phone', lastUsedAt: null });
      expect(findCookie(created, 'bingo_admin_session')).toContain('Max-Age=43200');
      expect(findCookie(created, 'bingo_webauthn_challenge')).toContain('Expires=Thu, 01 Jan 1970');
      expect(adminPasskeyRepository.passkeys).toHaveLength(1);
    });

    it('returns 400 and stores nothing when there is no challenge, verification fails or the credential exists', async () => {
      const noChallenge = createTestApp();
      const first = await request(noChallenge.app).post('/api/admin/passkeys').set('x-admin-key', TEST_ADMIN_KEY).send({ response: credential });

      const failing = createTestApp();
      failing.webAuthn.registrationResult = null;
      const failingAgent = request.agent(failing.app);
      await failingAgent.post('/api/admin/passkeys/registration-options').set('x-admin-key', TEST_ADMIN_KEY);
      const second = await failingAgent.post('/api/admin/passkeys').set('x-admin-key', TEST_ADMIN_KEY).send({ response: credential });

      const duplicate = createTestApp({ adminPasskeyRepository: new FakeAdminPasskeyRepository([{ ...buildStoredPasskey(), id: 'fake-credential' }]) });
      const duplicateAgent = request.agent(duplicate.app);
      await duplicateAgent.post('/api/admin/passkeys/registration-options').set('x-admin-key', TEST_ADMIN_KEY);
      const third = await duplicateAgent.post('/api/admin/passkeys').set('x-admin-key', TEST_ADMIN_KEY).send({ response: credential });

      for (const response of [first, second, third]) {
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Passkey registration failed' });
      }
      expect(noChallenge.adminPasskeyRepository.passkeys).toHaveLength(0);
      expect(failing.adminPasskeyRepository.passkeys).toHaveLength(0);
      expect(duplicate.adminPasskeyRepository.passkeys).toHaveLength(1);
    });

    it('rejects an authentication challenge used for registration', async () => {
      const { app } = createTestApp();
      const agent = request.agent(app);
      await agent.post('/api/auth/passkey/options');
      const response = await agent.post('/api/admin/passkeys').set('x-admin-key', TEST_ADMIN_KEY).send({ response: credential });
      expect(response.status).toBe(400);
    });

    it.each([{}, { response: credential, name: '' }, { response: credential, name: '   ' }, { response: credential, name: 'x'.repeat(41) }, { response: credential, name: 7 }])(
      'returns 400 for invalid body %j',
      async (body) => {
        const { app } = createTestApp();
        expect((await request(app).post('/api/admin/passkeys').set('x-admin-key', TEST_ADMIN_KEY).send(body)).status).toBe(400);
      },
    );
  });

  describe('DELETE /:id', () => {
    it('deletes with 204, returns 404 when missing and 400 for a bad id', async () => {
      const { app, adminPasskeyRepository } = createTestApp({ adminPasskeyRepository: new FakeAdminPasskeyRepository([buildStoredPasskey()]) });
      expect((await request(app).delete('/api/admin/passkeys/stored-1').set('x-admin-key', TEST_ADMIN_KEY)).status).toBe(204);
      expect(adminPasskeyRepository.passkeys).toHaveLength(0);
      expect((await request(app).delete('/api/admin/passkeys/stored-1').set('x-admin-key', TEST_ADMIN_KEY)).status).toBe(404);
      expect((await request(app).delete('/api/admin/passkeys/bad%20id').set('x-admin-key', TEST_ADMIN_KEY)).status).toBe(400);
    });
  });
});

describe('cookie session flow', () => {
  it('key sign-in, verify, register, delete that passkey, then the bound session is 401', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);

    expect((await agent.get('/api/admin/verify')).status).toBe(401);
    expect((await agent.post('/api/auth/session').send({ adminKey: TEST_ADMIN_KEY })).status).toBe(204);
    expect((await agent.get('/api/admin/verify')).status).toBe(204);

    expect((await agent.post('/api/admin/passkeys/registration-options')).status).toBe(200);
    const created = await agent.post('/api/admin/passkeys').send({ response: credential });
    expect(created.status).toBe(201);
    expect((await agent.get('/api/admin/verify')).status).toBe(204);

    expect((await agent.delete('/api/admin/passkeys/fake-credential')).status).toBe(204);
    const afterDelete = await agent.get('/api/admin/verify');
    expect(afterDelete.status).toBe(401);
    expect(findCookie(afterDelete, 'bingo_admin_session')).toContain('Expires=Thu, 01 Jan 1970');
  });

  it('lock clears the session', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/session').send({ adminKey: TEST_ADMIN_KEY });
    await agent.delete('/api/auth/session');
    expect((await agent.get('/api/admin/verify')).status).toBe(401);
  });

  it('a wrong x-admin-key header wins over a valid session cookie', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/session').send({ adminKey: TEST_ADMIN_KEY });
    expect((await agent.get('/api/admin/verify').set('x-admin-key', 'wrong')).status).toBe(401);
  });

  it('a session cookie admits option writes and analytics', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/session').send({ adminKey: TEST_ADMIN_KEY });
    expect((await agent.post('/api/options').send({ text: 'Via cookie' })).status).toBe(201);
    expect((await agent.get('/api/admin/analytics?days=7')).status).toBe(200);
  });
});
