import { Router, type NextFunction, type Request, type Response } from 'express';
import { createCreateOptionHandler } from './createOptionHandler';
import { createDeleteOptionHandler } from './deleteOptionHandler';
import { createListOptionsHandler } from './listOptionsHandler';
import type { OptionsService } from './optionsService';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type OptionsRouterDependencies = {
  service: OptionsService;
  adminWriteLimiter: Middleware;
  requireAdmin: Middleware;
};

/** Assembles the /api/options router: open read, admin-gated writes. */
export function createOptionsRouter(dependencies: OptionsRouterDependencies): Router {
  const router = Router();

  router.get('/', createListOptionsHandler(dependencies.service));

  // Everything below requires admin auth.
  router.use(dependencies.adminWriteLimiter, dependencies.requireAdmin);
  router.post('/', createCreateOptionHandler(dependencies.service));
  router.delete('/:id', createDeleteOptionHandler(dependencies.service));

  return router;
}
