import type { Request, Response } from 'express';
import { parseInput } from '../../middleware/validate';
import { analyticsSummaryQuerySchema } from './analyticsSchemas';
import type { AnalyticsService } from './analyticsService';

/** Creates the GET /api/admin/analytics handler. */
export function createGetAnalyticsSummaryHandler(service: AnalyticsService): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    const { days } = parseInput(analyticsSummaryQuerySchema, req.query);
    res.json(await service.getSummary(days));
  };
}
