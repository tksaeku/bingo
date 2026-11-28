import type { Request, Response } from 'express';
import { HttpError } from '../../HttpError';
import { parseInput } from '../../middleware/validate';
import type { AdminAuthService } from './adminAuthService';
import { passkeyIdParamsSchema } from './adminAuthSchemas';

/** Creates the DELETE /api/admin/passkeys/:id handler (admin only). */
export function createDeletePasskeyHandler(service: AdminAuthService): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(passkeyIdParamsSchema, req.params);
    if (!(await service.deletePasskey(id))) {
      throw new HttpError(404, 'Passkey not found');
    }
    res.status(204).end();
  };
}
