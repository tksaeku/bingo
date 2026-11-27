import type { Request, Response } from 'express';

/** GET /api/admin/verify: reaching this handler means the admin gate passed. */
export function verifyHandler(_req: Request, res: Response): void {
  res.status(204).end();
}
