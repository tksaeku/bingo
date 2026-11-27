import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AnalyticsService } from './analyticsService';
import { createRecordEventsHandler } from './recordEventsHandler';
import { rejectBots } from './rejectBots';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type AnalyticsRouterDependencies = {
  service: AnalyticsService;
  requireAnalyticsEnabled: Middleware;
  ipLimiter: Middleware;
  visitorLimiter: Middleware;
};

/** Assembles the /api/analytics router: open ingestion behind kill switch, bot filter and rate limits. */
export function createAnalyticsRouter(dependencies: AnalyticsRouterDependencies): Router {
  const router = Router();

  router.post(
    '/events',
    dependencies.requireAnalyticsEnabled,
    rejectBots,
    dependencies.ipLimiter,
    dependencies.visitorLimiter,
    createRecordEventsHandler(dependencies.service),
  );

  return router;
}
