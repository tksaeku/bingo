import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '../HttpError';
import { createRequireAdmin, createRequireAdminConfigured, getKeysMatch } from './requireAdmin';

function setup(options: { adminKey?: string; sessionValid?: boolean } = {}) {
  const readSession = vi.fn(async () => options.sessionValid ?? false);
  const clearSession = vi.fn();
  const middleware = createRequireAdmin({
    adminKey: 'adminKey' in options ? options.adminKey : 'secret',
    readSession,
    cookies: { clearSession },
  });
  const next = vi.fn();
  const run = async (headers: Record<string, string>, cookies?: Record<string, string>): Promise<void> => {
    const req = { get: (name: string) => headers[name.toLowerCase()], cookies } as unknown as Request;
    await middleware(req, {} as Response, next);
  };
  return { run, next, readSession, clearSession };
}

function getNextError(next: ReturnType<typeof vi.fn>): HttpError | undefined {
  return next.mock.calls[0][0];
}

describe('requireAdmin (AC-P1)', () => {
  it('fails closed with 503 when no admin key is configured, even with a header or session', async () => {
    const { run, next } = setup({ adminKey: '', sessionValid: true });
    await run({ 'x-admin-key': 'anything' }, { bingo_admin_session: 'x' });
    expect(getNextError(next)?.status).toBe(503);
  });

  it('admits a matching header', async () => {
    const { run, next } = setup();
    await run({ 'x-admin-key': 'secret' });
    expect(next).toHaveBeenCalledWith(undefined);
  });

  it('rejects a wrong header with 401 even when the session cookie is valid', async () => {
    const { run, next, readSession } = setup({ sessionValid: true });
    await run({ 'x-admin-key': 'wrong' }, { bingo_admin_session: 'valid' });
    expect(getNextError(next)?.status).toBe(401);
    expect(readSession).not.toHaveBeenCalled();
  });

  it('admits a valid session cookie', async () => {
    const { run, next, clearSession } = setup({ sessionValid: true });
    await run({}, { bingo_admin_session: 'valid' });
    expect(next).toHaveBeenCalledWith();
    expect(clearSession).not.toHaveBeenCalled();
  });

  it('rejects an invalid session cookie with 401 and clears it', async () => {
    const { run, next, clearSession } = setup({ sessionValid: false });
    await run({}, { bingo_admin_session: 'bad' });
    expect(getNextError(next)?.status).toBe(401);
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it('rejects a request with neither header nor cookie with 401 and clears nothing', async () => {
    const { run, next, clearSession } = setup();
    await run({}, {});
    expect(getNextError(next)?.status).toBe(401);
    expect(clearSession).not.toHaveBeenCalled();
  });
});

describe('createRequireAdminConfigured', () => {
  it('passes when a key is set and returns 503 otherwise', () => {
    const next = vi.fn();
    createRequireAdminConfigured('secret')({} as Request, {} as Response, next);
    expect(next).toHaveBeenCalledWith(undefined);
    const failing = vi.fn();
    createRequireAdminConfigured(undefined)({} as Request, {} as Response, failing);
    expect(failing.mock.calls[0][0].status).toBe(503);
  });
});

describe('getKeysMatch', () => {
  it('matches equal keys only', () => {
    expect(getKeysMatch('a', 'a')).toBe(true);
    expect(getKeysMatch('a', 'ab')).toBe(false);
  });
});
