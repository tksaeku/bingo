import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { deriveSigningKey, readToken, signToken } from './signedToken';

const schema = z.object({ credentialId: z.string().nullable(), expiresAt: z.number() });
const NOW = 1_000_000;

describe('signedToken', () => {
  describe('deriveSigningKey', () => {
    it('is deterministic per admin key and purpose', () => {
      expect(deriveSigningKey('key', 'a').equals(deriveSigningKey('key', 'a'))).toBe(true);
    });

    it('differs by purpose and by admin key', () => {
      expect(deriveSigningKey('key', 'a').equals(deriveSigningKey('key', 'b'))).toBe(false);
      expect(deriveSigningKey('key', 'a').equals(deriveSigningKey('other', 'a'))).toBe(false);
    });
  });

  describe('readToken', () => {
    const key = deriveSigningKey('key', 'session');

    it('round-trips a valid payload', () => {
      const payload = { credentialId: 'abc', expiresAt: NOW + 1 };
      expect(readToken(signToken(payload, key), key, schema, NOW)).toEqual(payload);
    });

    it('rejects a tampered payload', () => {
      const [, signature] = signToken({ credentialId: 'abc', expiresAt: NOW + 1 }, key).split('.');
      const forged = Buffer.from(JSON.stringify({ credentialId: 'evil', expiresAt: NOW + 1 })).toString('base64url');
      expect(readToken(`${forged}.${signature}`, key, schema, NOW)).toBeNull();
    });

    it('rejects a tampered signature', () => {
      const [payload] = signToken({ credentialId: 'abc', expiresAt: NOW + 1 }, key).split('.');
      expect(readToken(`${payload}.${Buffer.from('nope').toString('base64url')}`, key, schema, NOW)).toBeNull();
    });

    it('rejects a token signed with a different key', () => {
      const token = signToken({ credentialId: null, expiresAt: NOW + 1 }, deriveSigningKey('key', 'challenge'));
      expect(readToken(token, key, schema, NOW)).toBeNull();
    });

    it('rejects an expired payload, including at the exact expiry time', () => {
      const token = signToken({ credentialId: null, expiresAt: NOW }, key);
      expect(readToken(token, key, schema, NOW)).toBeNull();
      expect(readToken(token, key, schema, NOW + 1)).toBeNull();
    });

    it('rejects a validly signed payload that fails the schema', () => {
      expect(readToken(signToken({ credentialId: 5, expiresAt: NOW + 1 }, key), key, schema, NOW)).toBeNull();
    });

    it('rejects a validly signed payload that is not JSON', () => {
      const payloadSegment = Buffer.from('not json').toString('base64url');
      const signature = signToken('x', key).split('.')[1];
      const token = `${payloadSegment}.${signature}`;
      expect(readToken(token, key, schema, NOW)).toBeNull();
    });

    it.each([undefined, null, 42, '', 'garbage', 'a.b.c', '.', 'a.'])('rejects garbage input %j', (value) => {
      expect(readToken(value, key, schema, NOW)).toBeNull();
    });
  });
});
