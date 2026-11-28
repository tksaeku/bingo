import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { Request, Response } from 'express';
import { WEBAUTHN_CHALLENGE_COOKIE } from '../../constants';
import { HttpError } from '../../HttpError';
import { parseInput } from '../../middleware/validate';
import type { AdminAuthService } from './adminAuthService';
import { passkeyVerifyBodySchema } from './adminAuthSchemas';
import type { AdminCookies } from './adminCookies';

/** Creates the POST /api/auth/passkey/verify handler; every failure is the same generic 401. */
export function createPasskeyVerifyHandler(service: AdminAuthService, cookies: AdminCookies): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    const challengeCookie: unknown = req.cookies?.[WEBAUTHN_CHALLENGE_COOKIE];
    cookies.clearChallenge(res);
    const { response } = parseInput(passkeyVerifyBodySchema, req.body);
    const sessionToken = await service.verifyAuthentication(response as unknown as AuthenticationResponseJSON, challengeCookie);
    if (sessionToken === null) {
      throw new HttpError(401, 'Passkey sign-in failed');
    }
    cookies.setSession(res, sessionToken);
    res.status(204).end();
  };
}
