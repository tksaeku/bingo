import type { Request, Response } from 'express';
import { HttpError } from '../../HttpError';
import { parseInput } from '../../middleware/validate';
import { eventBatchSchema } from './analyticsSchemas';
import type { AnalyticsService } from './analyticsService';

/** Creates the POST /api/analytics/events handler: validate, record, 204 (or 429 past the visitor's daily cap). */
export function createRecordEventsHandler(service: AnalyticsService): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    const batch = parseInput(eventBatchSchema, req.body);
    const result = await service.recordEvents(batch, req.get('user-agent'));
    if (result === 'daily_cap_exceeded') {
      throw new HttpError(429, 'Daily analytics limit reached');
    }
    res.status(204).end();
  };
}
