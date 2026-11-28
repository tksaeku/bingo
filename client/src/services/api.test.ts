import type { CreateAxiosDefaults } from 'axios';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '../types';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  client: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  createdConfig: undefined as CreateAxiosDefaults | undefined,
}));

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: (config: CreateAxiosDefaults) => {
        mocks.createdConfig = config;
        return mocks.client;
      },
    },
  };
});

let api: typeof import('./api');

beforeAll(async () => {
  api = await import('./api');
});

describe('api client configuration', () => {
  it('uses a JSON content type and an /api base URL', () => {
    expect(mocks.createdConfig?.baseURL).toMatch(/\/api$/);
    expect((mocks.createdConfig?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json'
    );
  });
});

describe('optionsApi', () => {
  it('gets all options without an admin key and returns the body', async () => {
    const signal = new AbortController().signal;
    mocks.client.get.mockResolvedValue({ data: [{ id: 'a' }] });

    await expect(api.optionsApi.getAll(signal)).resolves.toEqual([{ id: 'a' }]);
    expect(mocks.client.get).toHaveBeenCalledWith('/options', { signal });
  });

  it('creates an option without an x-admin-key header', async () => {
    mocks.client.post.mockResolvedValue({ data: { id: 'a', text: 'Hi' } });

    await expect(api.optionsApi.create('Hi')).resolves.toEqual({ id: 'a', text: 'Hi' });
    expect(mocks.client.post).toHaveBeenCalledWith('/options', { text: 'Hi' });
  });

  it('deletes an option by encoded id', async () => {
    mocks.client.delete.mockResolvedValue({ status: 204 });

    await expect(api.optionsApi.delete('a/b c')).resolves.toBeUndefined();
    expect(mocks.client.delete).toHaveBeenCalledWith('/options/a%2Fb%20c');
  });
});

describe('leaderboardApi', () => {
  it('gets the leaderboard', async () => {
    mocks.client.get.mockResolvedValue({ data: [] });

    await expect(api.leaderboardApi.getAll()).resolves.toEqual([]);
    expect(mocks.client.get).toHaveBeenCalledWith('/leaderboard', { signal: undefined });
  });

  it('submits a win with only the player name', async () => {
    mocks.client.post.mockResolvedValue({ data: { id: 'bob', wins: 1 } });

    await expect(api.leaderboardApi.submitWin('Bob')).resolves.toEqual({ id: 'bob', wins: 1 });
    expect(mocks.client.post).toHaveBeenCalledWith('/leaderboard', { playerName: 'Bob' });
  });
});

describe('adminApi', () => {
  it('verifies the session against /admin/verify', async () => {
    const signal = new AbortController().signal;
    mocks.client.get.mockResolvedValue({ status: 204 });

    await expect(api.adminApi.verify(signal)).resolves.toBeUndefined();
    expect(mocks.client.get).toHaveBeenCalledWith('/admin/verify', { signal });
  });
});

describe('authApi', () => {
  it('signs in with the admin key in the body', async () => {
    mocks.client.post.mockResolvedValue({ status: 204 });

    await expect(api.authApi.signInWithKey('secret')).resolves.toBeUndefined();
    expect(mocks.client.post).toHaveBeenCalledWith('/auth/session', { adminKey: 'secret' });
  });

  it('signs out', async () => {
    mocks.client.delete.mockResolvedValue({ status: 204 });

    await expect(api.authApi.signOut()).resolves.toBeUndefined();
    expect(mocks.client.delete).toHaveBeenCalledWith('/auth/session');
  });

  it('gets passkey sign-in options', async () => {
    mocks.client.post.mockResolvedValue({ data: { challenge: 'c' } });

    await expect(api.authApi.getPasskeyOptions()).resolves.toEqual({ challenge: 'c' });
    expect(mocks.client.post).toHaveBeenCalledWith('/auth/passkey/options');
  });

  it('verifies a passkey response wrapped in { response }', async () => {
    const response = { id: 'cred' } as AuthenticationResponseJSON;
    mocks.client.post.mockResolvedValue({ status: 204 });

    await expect(api.authApi.verifyPasskey(response)).resolves.toBeUndefined();
    expect(mocks.client.post).toHaveBeenCalledWith('/auth/passkey/verify', { response });
  });
});

describe('passkeysApi', () => {
  it('gets registration options', async () => {
    mocks.client.post.mockResolvedValue({ data: { challenge: 'c' } });

    await expect(api.passkeysApi.getRegistrationOptions()).resolves.toEqual({ challenge: 'c' });
    expect(mocks.client.post).toHaveBeenCalledWith('/admin/passkeys/registration-options');
  });

  it('registers a passkey with its name', async () => {
    const response = { id: 'cred' } as RegistrationResponseJSON;
    mocks.client.post.mockResolvedValue({ data: { id: 'cred', name: 'Laptop' } });

    await expect(api.passkeysApi.register(response, 'Laptop')).resolves.toEqual({
      id: 'cred',
      name: 'Laptop',
    });
    expect(mocks.client.post).toHaveBeenCalledWith('/admin/passkeys', { response, name: 'Laptop' });
  });

  it('lists passkeys', async () => {
    const signal = new AbortController().signal;
    mocks.client.get.mockResolvedValue({ data: [{ id: 'cred' }] });

    await expect(api.passkeysApi.list(signal)).resolves.toEqual([{ id: 'cred' }]);
    expect(mocks.client.get).toHaveBeenCalledWith('/admin/passkeys', { signal });
  });

  it('removes a passkey by encoded id', async () => {
    mocks.client.delete.mockResolvedValue({ status: 204 });

    await expect(api.passkeysApi.remove('a/b')).resolves.toBeUndefined();
    expect(mocks.client.delete).toHaveBeenCalledWith('/admin/passkeys/a%2Fb');
  });
});

describe('admin calls', () => {
  it('never send an x-admin-key header', async () => {
    mocks.client.get.mockResolvedValue({ data: [] });
    mocks.client.post.mockResolvedValue({ data: {} });
    mocks.client.delete.mockResolvedValue({});

    await api.optionsApi.create('Hi');
    await api.optionsApi.delete('a');
    await api.adminApi.verify();
    await api.analyticsApi.getSummary(7);
    await api.passkeysApi.list();
    await api.passkeysApi.remove('a');

    const allCalls = [
      ...mocks.client.get.mock.calls,
      ...mocks.client.post.mock.calls,
      ...mocks.client.delete.mock.calls,
    ];
    expect(JSON.stringify(allCalls).toLowerCase()).not.toContain('x-admin-key');
  });
});

describe('analyticsApi', () => {
  const batch = { visitorId: 'id', events: [{ name: 'bingo' as const, offsetMs: 5 }] };

  it('posts a batch through axios and resolves with the status', async () => {
    mocks.client.post.mockResolvedValue({ status: 410 });

    await expect(api.analyticsApi.sendEvents(batch, { keepalive: false })).resolves.toBe(410);
    expect(mocks.client.post).toHaveBeenCalledWith('/analytics/events', batch, {
      validateStatus: expect.any(Function),
    });
  });

  it('posts a keepalive batch with fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.analyticsApi.sendEvents(batch, { keepalive: true })).resolves.toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/analytics\/events$/),
      expect.objectContaining({ method: 'POST', keepalive: true, body: JSON.stringify(batch) })
    );
    vi.unstubAllGlobals();
  });

  it('gets the summary for the day range', async () => {
    const signal = new AbortController().signal;
    mocks.client.get.mockResolvedValue({ data: { uniqueVisitors: 3 } });

    await expect(api.analyticsApi.getSummary(7, signal)).resolves.toEqual({
      uniqueVisitors: 3,
    });
    expect(mocks.client.get).toHaveBeenCalledWith('/admin/analytics', {
      params: { days: 7 },
      signal,
    });
  });
});
