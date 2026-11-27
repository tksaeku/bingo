import { Router } from 'express';
import { healthHandler } from './healthHandler';

/** Assembles the /api/health router. */
export function createHealthRouter(): Router {
  const router = Router();
  router.get('/', healthHandler);
  return router;
}
