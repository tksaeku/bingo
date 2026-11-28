import type { Request, Response } from 'express';
import { HttpError } from '../../HttpError';
import { parseInput } from '../../middleware/validate';
import type { AdminAuthService } from './adminAuthService';
import { keySignInBodySchema } from './adminAuthSchemas';
import type { AdminCookies } from './adminCookies';

/** Creates the POST /api/auth/session handler: admin key in, session cookie out. */
export function createCreateSessionHandler(service: AdminAuthService, cookies: AdminCookies): (req: Request, res: Response) => void {
  return (req: Request, res: Response): void => {
    const { adminKey } = parseInput(keySignInBodySchema, req.body);
    const sessionToken = service.signInWithKey(adminKey);
    if (sessionToken === null) {
      throw new HttpError(401, 'Invalid admin key');
    }
    cookies.setSession(res, sessionToken);
    res.status(204).end();
  };
}
