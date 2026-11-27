import { VISITOR_ID_STORAGE_KEY } from '../constants';

/** Matches the lowercase UUID v4 format the server accepts. */
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** ID used for the page session when localStorage is unavailable. */
let inMemoryVisitorId: string | null = null;

/**
 * Returns the anonymous visitor ID, creating and persisting one on first use.
 * Falls back to an in-memory ID for the page session when storage throws.
 */
export function getVisitorId(): string {
  try {
    const storedId = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (storedId !== null && UUID_V4_PATTERN.test(storedId)) {
      return storedId;
    }
  } catch {
    // Storage blocked; fall through to the in-memory ID.
  }

  const visitorId = inMemoryVisitorId ?? crypto.randomUUID();
  try {
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    inMemoryVisitorId = null;
  } catch {
    inMemoryVisitorId = visitorId;
  }
  return visitorId;
}
