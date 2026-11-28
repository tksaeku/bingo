import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AnalyticsService } from './analyticsService';
import { createGetAnalyticsSummaryHandler } from './getAnalyticsSummaryHandler';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type AnalyticsAdminRouterDependencies = {
  service: AnalyticsService;
  adminLimiter: Middleware;
  requireAdmin: Middleware;
};

/** Assembles the /api/admin/analytics router; the summary requires admin auth and stays available when collection is off. */
export function createAnalyticsAdminRouter(dependencies: AnalyticsAdminRouterDependencies): Router {
  const router = Router();

  router.use(dependencies.adminLimiter, dependencies.requireAdmin);
  router.get('/', createGetAnalyticsSummaryHandler(dependencies.service));

  return router;
}
