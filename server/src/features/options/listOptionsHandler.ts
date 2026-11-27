import type { Request, Response } from 'express';
import type { OptionsService } from './optionsService';

/** Creates the GET /api/options handler. */
export function createListOptionsHandler(service: OptionsService): (req: Request, res: Response) => Promise<void> {
  return async (_req: Request, res: Response): Promise<void> => {
    res.json(await service.listOptions());
  };
}
