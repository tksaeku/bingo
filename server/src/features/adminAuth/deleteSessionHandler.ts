import type { Request, Response } from 'express';
import type { AdminCookies } from './adminCookies';

/** Creates the DELETE /api/auth/session handler: clears the session cookie, signed in or not. */
export function createDeleteSessionHandler(cookies: AdminCookies): (req: Request, res: Response) => void {
  return (_req: Request, res: Response): void => {
    cookies.clearSession(res);
    res.status(204).end();
  };
}
