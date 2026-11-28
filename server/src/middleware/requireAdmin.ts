import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { ADMIN_KEY_HEADER, ADMIN_SESSION_COOKIE } from '../constants';
import type { AdminCookies } from '../features/adminAuth/adminCookies';
import { HttpError } from '../HttpError';

/** SHA-256 digest used so both sides of the comparison have equal length. */
function hashKey(key: string): Buffer {
  return createHash('sha256').update(key).digest();
}

/** Compares two keys in constant time (digests are equal length, so no length leak). */
export function getKeysMatch(providedKey: string, expectedKey: string): boolean {
  return timingSafeEqual(hashKey(providedKey), hashKey(expectedKey));
}

type RequireAdminDependencies = {
  adminKey: string | undefined;
  /** Resolves true for a valid session cookie value (signature, expiry, bound passkey still stored). */
  readSession: (sessionCookie: unknown) => Promise<boolean>;
  cookies: Pick<AdminCookies, 'clearSession'>;
};

/**
 * Creates middleware that admits a request carrying a valid `x-admin-key` header or a valid admin
 * session cookie. Order: unset key fails closed with 503; a present header alone decides; then the
 * session cookie; otherwise 401 (clearing a cookie that was present but invalid).
 */
export function createRequireAdmin(
  dependencies: RequireAdminDependencies,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { adminKey, readSession, cookies } = dependencies;
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!adminKey) {
      next(new HttpError(503, 'Admin access is not configured'));
      return;
    }
    const providedKey = req.get(ADMIN_KEY_HEADER);
    if (typeof providedKey === 'string') {
      next(getKeysMatch(providedKey, adminKey) ? undefined : new HttpError(401, 'Invalid admin key'));
      return;
    }
    const sessionCookie: unknown = req.cookies?.[ADMIN_SESSION_COOKIE];
    if (sessionCookie !== undefined) {
      if (await readSession(sessionCookie)) {
        next();
        return;
      }
      cookies.clearSession(res);
    }
    next(new HttpError(401, 'Admin sign-in required'));
  };
}

/** Fails closed with 503 when no admin key is configured; used by the auth routes that need one. */
export function createRequireAdminConfigured(adminKey: string | undefined): (req: Request, res: Response, next: NextFunction) => void {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    next(adminKey ? undefined : new HttpError(503, 'Admin access is not configured'));
  };
}
