import { describe, expect, it } from 'vitest';
import { collapseWhitespace, getIsWellFormed, getLeaderboardDocumentId, getOptionDedupeKey, getPlayerKey } from './normalize';

describe('normalize', () => {
  describe('collapseWhitespace', () => {
    it('trims and collapses internal whitespace', () => {
      expect(collapseWhitespace('  Bob \t  Smith \n')).toBe('Bob Smith');
    });
  });

  describe('getPlayerKey', () => {
    it('treats Bob, "bob " and " BOB" as the same player', () => {
      expect(getPlayerKey('Bob')).toBe('bob');
      expect(getPlayerKey('bob ')).toBe('bob');
      expect(getPlayerKey(' BOB')).toBe('bob');
    });
  });

  describe('getOptionDedupeKey', () => {
    it('is case-insensitive and trimmed', () => {
      expect(getOptionDedupeKey('  Gold  Costume ')).toBe(getOptionDedupeKey('gold costume'));
    });
  });

  describe('getLeaderboardDocumentId', () => {
    it('lowercases the normalized name', () => {
      expect(getLeaderboardDocumentId('  Ann   Lee ')).toBe('ann%20lee');
    });

    it('never contains slashes, dots or underscores', () => {
      const documentId = getLeaderboardDocumentId('a/b.._c__');
      expect(documentId).not.toMatch(/[/._]/);
    });

    it('gives distinct IDs to distinct names', () => {
      expect(getLeaderboardDocumentId('a.b')).not.toBe(getLeaderboardDocumentId('a_b'));
    });
  });
});

describe('getIsWellFormed', () => {
  it('accepts normal text and valid surrogate pairs', () => {
    expect(getIsWellFormed('Bob')).toBe(true);
    expect(getIsWellFormed('party \u{1F389}')).toBe(true);
  });

  it('rejects lone high and low surrogates', () => {
    expect(getIsWellFormed('a\uD800b')).toBe(false);
    expect(getIsWellFormed('a\uDC00b')).toBe(false);
    expect(getIsWellFormed('trailing\uD83C')).toBe(false);
  });
});
