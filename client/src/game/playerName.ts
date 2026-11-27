import { PLAYER_NAME_MAX_LENGTH } from '../constants';

/** Trims the name and collapses internal whitespace to single spaces. */
export function normalizePlayerName(rawName: string): string {
  return rawName.trim().replace(/\s+/g, ' ');
}

/** True when the normalized name is 1 to PLAYER_NAME_MAX_LENGTH characters. */
export function getIsValidPlayerName(rawName: string): boolean {
  const normalized = normalizePlayerName(rawName);
  return normalized.length >= 1 && normalized.length <= PLAYER_NAME_MAX_LENGTH;
}
