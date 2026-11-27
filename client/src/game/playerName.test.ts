import { describe, expect, it } from 'vitest';
import { getIsValidPlayerName, normalizePlayerName } from './playerName';

describe('normalizePlayerName', () => {
  it('trims and collapses internal whitespace', () => {
    expect(normalizePlayerName('  Bob   the \t Builder ')).toBe('Bob the Builder');
  });
});

describe('getIsValidPlayerName', () => {
  it('rejects empty and whitespace-only names', () => {
    expect(getIsValidPlayerName('')).toBe(false);
    expect(getIsValidPlayerName('   ')).toBe(false);
  });

  it('accepts 1 to 20 characters after normalization', () => {
    expect(getIsValidPlayerName('a')).toBe(true);
    expect(getIsValidPlayerName('a'.repeat(20))).toBe(true);
    expect(getIsValidPlayerName('a'.repeat(21))).toBe(false);
  });
});
