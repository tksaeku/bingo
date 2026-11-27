import { describe, expect, it } from 'vitest';
import { parseCorsOrigins, parsePort, parseTrustedProxyHops } from './config';
import { DEFAULT_CORS_ORIGINS } from './constants';

describe('config', () => {
  describe('parseCorsOrigins', () => {
    it('splits and trims a comma-separated list', () => {
      expect(parseCorsOrigins(' https://a.example , https://b.example ,')).toEqual(['https://a.example', 'https://b.example']);
    });

    it('falls back to the defaults when unset or empty', () => {
      expect(parseCorsOrigins(undefined)).toEqual([...DEFAULT_CORS_ORIGINS]);
      expect(parseCorsOrigins('  ')).toEqual([...DEFAULT_CORS_ORIGINS]);
    });
  });

  describe('parsePort', () => {
    it('uses a valid PORT and defaults otherwise', () => {
      expect(parsePort('8080')).toBe(8080);
      expect(parsePort(undefined)).toBe(5174);
      expect(parsePort('nope')).toBe(5174);
    });
  });
});

describe('parseTrustedProxyHops', () => {
  it('parses a non-negative integer', () => {
    expect(parseTrustedProxyHops('2')).toBe(2);
    expect(parseTrustedProxyHops('0')).toBe(0);
  });

  it('defaults to 1 when unset, empty, negative, fractional or not a number', () => {
    expect(parseTrustedProxyHops(undefined)).toBe(1);
    expect(parseTrustedProxyHops('')).toBe(1);
    expect(parseTrustedProxyHops('-1')).toBe(1);
    expect(parseTrustedProxyHops('1.5')).toBe(1);
    expect(parseTrustedProxyHops('abc')).toBe(1);
  });
});
