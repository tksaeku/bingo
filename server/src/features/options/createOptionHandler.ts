import type { Request, Response } from 'express';
import { parseInput } from '../../middleware/validate';
import { createOptionBodySchema } from './optionsSchemas';
import type { OptionsService } from './optionsService';

/** Creates the POST /api/options handler (admin only; mounted behind the admin gate). */
export function createCreateOptionHandler(service: OptionsService): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    const { text } = parseInput(createOptionBodySchema, req.body);
    res.status(201).json(await service.addOption(text));
  };
}
