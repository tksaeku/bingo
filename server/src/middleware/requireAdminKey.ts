import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ADMIN_KEY_HEADER } from '../constants';
import { HttpError } from '../HttpError';

/** SHA-256 digest used so both sides of the comparison have equal length. */
function hashKey(key: string): Buffer {
  return createHash('sha256').update(key).digest();
}

/** Compares two keys in constant time (digests are equal length, so no length leak). */
export function getKeysMatch(providedKey: string, expectedKey: string): boolean {
  return timingSafeEqual(hashKey(providedKey), hashKey(expectedKey));
}

/**
 * Creates middleware that requires the `x-admin-key` header to match the
 * configured admin key. Fails closed with 503 when no admin key is configured.
 */
export function createRequireAdminKey(adminKey: string | undefined): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!adminKey) {
      next(new HttpError(503, 'Admin access is not configured'));
      return;
    }
    const providedKey = req.get(ADMIN_KEY_HEADER);
    if (typeof providedKey !== 'string' || !getKeysMatch(providedKey, adminKey)) {
      next(new HttpError(401, 'Invalid admin key'));
      return;
    }
    next();
  };
}
