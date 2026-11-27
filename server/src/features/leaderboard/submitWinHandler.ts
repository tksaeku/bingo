import type { Request, Response } from 'express';
import { parseInput } from '../../middleware/validate';
import { submitWinBodySchema } from './leaderboardSchemas';
import type { LeaderboardService } from './leaderboardService';

/** Creates the POST /api/leaderboard handler. */
export function createSubmitWinHandler(service: LeaderboardService): (req: Request, res: Response) => Promise<void> {
  return async (req: Request, res: Response): Promise<void> => {
    const { playerName } = parseInput(submitWinBodySchema, req.body);
    res.json(await service.submitWin(playerName));
  };
}
