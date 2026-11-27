import type { Request, Response } from 'express';

/** GET /api/health: liveness check; touches no dependencies. */
export function healthHandler(_req: Request, res: Response): void {
  res.json({ status: 'ok' });
}
