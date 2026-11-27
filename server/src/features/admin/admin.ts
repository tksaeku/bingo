import { Router, type NextFunction, type Request, type Response } from 'express';
import { verifyHandler } from './verifyHandler';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type AdminRouterDependencies = {
  adminLimiter: Middleware;
  requireAdminKey: Middleware;
};

/** Assembles the /api/admin router; every route requires the admin key. */
export function createAdminRouter(dependencies: AdminRouterDependencies): Router {
  const router = Router();

  router.use(dependencies.adminLimiter, dependencies.requireAdminKey);
  router.get('/verify', verifyHandler);

  return router;
}
