import { Router, type NextFunction, type Request, type Response } from 'express';
import type { AdminAuthService } from './adminAuthService';
import type { AdminCookies } from './adminCookies';
import { createCreateSessionHandler } from './createSessionHandler';
import { createDeleteSessionHandler } from './deleteSessionHandler';
import { createPasskeyOptionsHandler } from './passkeyOptionsHandler';
import { createPasskeyVerifyHandler } from './passkeyVerifyHandler';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

type AuthRouterDependencies = {
  service: AdminAuthService;
  cookies: AdminCookies;
  authLimiter: Middleware;
  requireAdminConfigured: Middleware;
};

/** Assembles the /api/auth router: public sign-in endpoints, all rate limited before any check. */
export function createAuthRouter(dependencies: AuthRouterDependencies): Router {
  const { service, cookies, authLimiter, requireAdminConfigured } = dependencies;
  const router = Router();

  router.use(authLimiter);
  router.delete('/session', createDeleteSessionHandler(cookies));

  // Everything below needs ADMIN_KEY configured (fail closed with 503).
  router.use(requireAdminConfigured);
  router.post('/session', createCreateSessionHandler(service, cookies));
  router.post('/passkey/options', createPasskeyOptionsHandler(service, cookies));
  router.post('/passkey/verify', createPasskeyVerifyHandler(service, cookies));

  return router;
}
