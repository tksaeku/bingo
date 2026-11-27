import type { Request, Response } from 'express';
import type { LeaderboardService } from './leaderboardService';

/** Creates the GET /api/leaderboard handler. */
export function createGetLeaderboardHandler(service: LeaderboardService): (req: Request, res: Response) => Promise<void> {
  return async (_req: Request, res: Response): Promise<void> => {
    res.json(await service.getLeaderboard());
  };
}
