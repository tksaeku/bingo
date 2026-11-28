import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AdminAuthService } from './adminAuthService';
import type { AdminCookies } from './adminCookies';
import { createDeletePasskeyHandler } from './deletePasskeyHandler';
import { createListPasskeysHandler } from './listPasskeysHandler';
import { createRegisterPasskeyHandler } from './registerPasskeyHandler';
import { createRegistrationOptionsHandler } from './registrationOptionsHandler';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type PasskeysRouterDependencies = {
  service: AdminAuthService;
  cookies: AdminCookies;
  adminLimiter: Middleware;
  requireAdmin: Middleware;
};

/** Assembles the /api/admin/passkeys router; every route requires admin auth. */
export function createPasskeysRouter(dependencies: PasskeysRouterDependencies): Router {
  const { service, cookies, adminLimiter, requireAdmin } = dependencies;
  const router = Router();

  router.use(adminLimiter, requireAdmin);
  router.post('/registration-options', createRegistrationOptionsHandler(service, cookies));
  router.post('/', createRegisterPasskeyHandler(service, cookies));
  router.get('/', createListPasskeysHandler(service));
  router.delete('/:id', createDeletePasskeyHandler(service));

  return router;
}
