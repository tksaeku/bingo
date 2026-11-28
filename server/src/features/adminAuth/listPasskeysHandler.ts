import type { Request, Response } from 'express';
import type { AdminAuthService } from './adminAuthService';

/** Creates the GET /api/admin/passkeys handler (admin only). */
export function createListPasskeysHandler(service: AdminAuthService): (req: Request, res: Response) => Promise<void> {
  return async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(await service.listPasskeys());
  };
}
