import type { Request, Response } from 'express';
import type { AdminAuthService } from './adminAuthService';
import type { AdminCookies } from './adminCookies';

/** Creates the POST /api/auth/passkey/options handler: authentication options plus a challenge cookie. */
export function createPasskeyOptionsHandler(service: AdminAuthService, cookies: AdminCookies): (req: Request, res: Response) => Promise<void> {
  return async (_req: Request, res: Response): Promise<void> => {
    const { options, challengeToken } = await service.createAuthenticationOptions();
    cookies.setChallenge(res, challengeToken);
    res.status(200).json(options);
  };
}
