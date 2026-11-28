import type { CookieOptions, Response } from 'express';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MS,
  WEBAUTHN_CHALLENGE_COOKIE,
  WEBAUTHN_CHALLENGE_TTL_MS,
} from '../../constants';

/** Sets and clears the admin session and WebAuthn challenge cookies with consistent flags. */
export type AdminCookies = {
  setSession: (res: Response, token: string) => void;
  clearSession: (res: Response) => void;
  setChallenge: (res: Response, token: string) => void;
  clearChallenge: (res: Response) => void;
};

/** Cookie path shared by both cookies; covers every `/api` route. */
const COOKIE_PATH = '/api';

/** `Secure` is on only when every allowed origin is https, so plain-http localhost keeps working. */
export function getIsSecureCookie(webAuthnOrigins: readonly string[]): boolean {
  return webAuthnOrigins.length > 0 && webAuthnOrigins.every((origin) => origin.startsWith('https:'));
}

/** Creates the cookie helpers for the configured WebAuthn origins. */
export function createAdminCookies(webAuthnOrigins: readonly string[]): AdminCookies {
  const baseOptions: CookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    path: COOKIE_PATH,
    secure: getIsSecureCookie(webAuthnOrigins),
  };
  return {
    setSession: (res, token): void => {
      res.cookie(ADMIN_SESSION_COOKIE, token, { ...baseOptions, maxAge: ADMIN_SESSION_TTL_MS });
    },
    clearSession: (res): void => {
      res.clearCookie(ADMIN_SESSION_COOKIE, baseOptions);
    },
    setChallenge: (res, token): void => {
      res.cookie(WEBAUTHN_CHALLENGE_COOKIE, token, { ...baseOptions, maxAge: WEBAUTHN_CHALLENGE_TTL_MS });
    },
    clearChallenge: (res): void => {
      res.clearCookie(WEBAUTHN_CHALLENGE_COOKIE, baseOptions);
    },
  };
}
