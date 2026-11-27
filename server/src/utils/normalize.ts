const ILL_FORMED_UTF16 = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** Returns false when the string contains a lone UTF-16 surrogate (which cannot be URI-encoded). */
export function getIsWellFormed(value: string): boolean {
  return !ILL_FORMED_UTF16.test(value);
}

/** Trims and collapses internal whitespace runs to single spaces. */
export function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** Case-insensitive key used to detect duplicate options. */
export function getOptionDedupeKey(text: string): string {
  return collapseWhitespace(text).toLowerCase();
}

/** Case-insensitive key identifying a player. */
export function getPlayerKey(playerName: string): string {
  return collapseWhitespace(playerName).toLowerCase();
}

/**
 * Builds the leaderboard document ID from a player name: the normalized
 * lowercase name, percent-encoded so it is always a valid Firestore document ID
 * (no slashes, no dots, no leading/trailing double underscores).
 */
export function getLeaderboardDocumentId(playerName: string): string {
  return encodeURIComponent(getPlayerKey(playerName)).replace(/\./g, '%2E').replace(/_/g, '%5F');
}
