import type { Request, Response } from 'express';
import type { AdminAuthService } from './adminAuthService';
import type { AdminCookies } from './adminCookies';

/** Creates the POST /api/admin/passkeys/registration-options handler (admin only). */
export function createRegistrationOptionsHandler(service: AdminAuthService, cookies: AdminCookies): (req: Request, res: Response) => Promise<void> {
  return async (_req: Request, res: Response): Promise<void> => {
    const { options, challengeToken } = await service.createRegistrationOptions();
    cookies.setChallenge(res, challengeToken);
    res.status(200).json(options);
  };
}
