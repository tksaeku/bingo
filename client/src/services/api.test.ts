import type { CreateAxiosDefaults } from 'axios';
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
    expect((mocks.createdConfig?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });
});

describe('optionsApi', () => {
  it('gets all options without an admin key and returns the body', async () => {
    const signal = new AbortController().signal;
    mocks.client.get.mockResolvedValue({ data: [{ id: 'a' }] });

    await expect(api.optionsApi.getAll(signal)).resolves.toEqual([{ id: 'a' }]);
    expect(mocks.client.get).toHaveBeenCalledWith('/options', { signal });
  });

  it('creates an option with the x-admin-key header', async () => {
    mocks.client.post.mockResolvedValue({ data: { id: 'a', text: 'Hi' } });

    await expect(api.optionsApi.create('Hi', 'secret')).resolves.toEqual({ id: 'a', text: 'Hi' });
    expect(mocks.client.post).toHaveBeenCalledWith('/options', { text: 'Hi' }, { headers: { 'x-admin-key': 'secret' } });
  });

  it('deletes an option by encoded id with the x-admin-key header', async () => {
    mocks.client.delete.mockResolvedValue({ status: 204 });

    await expect(api.optionsApi.delete('a/b c', 'secret')).resolves.toBeUndefined();
    expect(mocks.client.delete).toHaveBeenCalledWith('/options/a%2Fb%20c', { headers: { 'x-admin-key': 'secret' } });
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
  it('verifies the key against /admin/verify with the x-admin-key header', async () => {
    const signal = new AbortController().signal;
    mocks.client.get.mockResolvedValue({ status: 204 });

    await expect(api.adminApi.verify('secret', signal)).resolves.toBeUndefined();
    expect(mocks.client.get).toHaveBeenCalledWith('/admin/verify', { headers: { 'x-admin-key': 'secret' }, signal });
  });
});
