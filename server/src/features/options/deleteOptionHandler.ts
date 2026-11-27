import type { Request, Response } from 'express';
import { parseInput } from '../../middleware/validate';
import { optionIdParamsSchema } from './optionsSchemas';
import type { OptionsService } from './optionsService';

/** Creates the DELETE /api/options/:id handler (admin only; mounted behind the admin gate). */
export function createDeleteOptionHandler(service: OptionsService): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    const { id } = parseInput(optionIdParamsSchema, req.params);
    await service.removeOption(id);
    res.status(204).end();
  };
}
