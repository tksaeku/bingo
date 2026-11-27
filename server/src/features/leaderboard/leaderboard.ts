import { Router, type NextFunction, type Request, type Response } from 'express';
import { createGetLeaderboardHandler } from './getLeaderboardHandler';
import type { LeaderboardService } from './leaderboardService';
import { createSubmitWinHandler } from './submitWinHandler';

type LeaderboardRouterDependencies = {
  service: LeaderboardService;
  submitWinLimiter: (req: Request, res: Response, next: NextFunction) => void;
};

/** Assembles the /api/leaderboard router: open read, rate-limited open write. */
export function createLeaderboardRouter(dependencies: LeaderboardRouterDependencies): Router {
  const router = Router();

  router.get('/', createGetLeaderboardHandler(dependencies.service));
  router.post('/', dependencies.submitWinLimiter, createSubmitWinHandler(dependencies.service));

  return router;
}
