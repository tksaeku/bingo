import { Router, type NextFunction, type Request, type Response } from 'express';
import { verifyHandler } from './verifyHandler';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type AdminRouterDependencies = {
  adminLimiter: Middleware;
  requireAdmin: Middleware;
};

/** Assembles the /api/admin router; every route requires admin auth. */
export function createAdminRouter(dependencies: AdminRouterDependencies): Router {
  const router = Router();

  router.use(dependencies.adminLimiter, dependencies.requireAdmin);
  router.get('/verify', verifyHandler);

  return router;
}
