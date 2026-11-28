import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import type { Request, Response } from 'express';
import { WEBAUTHN_CHALLENGE_COOKIE } from '../../constants';
import { HttpError } from '../../HttpError';
import { parseInput } from '../../middleware/validate';
import type { AdminAuthService } from './adminAuthService';
import { registerPasskeyBodySchema } from './adminAuthSchemas';
import type { AdminCookies } from './adminCookies';

/** Creates the POST /api/admin/passkeys handler (admin only): stores a verified passkey and re-issues the session bound to it. */
export function createRegisterPasskeyHandler(service: AdminAuthService, cookies: AdminCookies): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    const challengeCookie: unknown = req.cookies?.[WEBAUTHN_CHALLENGE_COOKIE];
    cookies.clearChallenge(res);
    const { response, name } = parseInput(registerPasskeyBodySchema, req.body);
    const result = await service.registerPasskey(response as unknown as RegistrationResponseJSON, name, challengeCookie);
    if (result === null) {
      throw new HttpError(400, 'Passkey registration failed');
    }
    cookies.setSession(res, result.sessionToken);
    res.status(201).json(result.passkey);
  };
}
