import { z } from 'zod';
import { MAX_PLAYER_NAME_LENGTH } from '../../constants';
import { collapseWhitespace, getIsWellFormed } from '../../utils/normalize';

/** Body of POST /api/leaderboard: well-formed name of 1 to 20 characters after whitespace collapse. */
export const submitWinBodySchema = z.object({
  playerName: z
    .string()
    .refine(getIsWellFormed, 'Player name contains invalid characters')
    .transform(collapseWhitespace)
    .pipe(
      z
        .string()
        .min(1, 'Player name is required')
        .max(MAX_PLAYER_NAME_LENGTH, `Player name must be at most ${MAX_PLAYER_NAME_LENGTH} characters`),
    ),
});
