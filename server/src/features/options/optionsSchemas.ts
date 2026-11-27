import { z } from 'zod';
import { MAX_OPTION_LENGTH } from '../../constants';
import { getIsWellFormed } from '../../utils/normalize';

/** Body of POST /api/options: trimmed, well-formed text of 1 to 100 characters. */
export const createOptionBodySchema = z.object({
  text: z
    .string()
    .refine(getIsWellFormed, 'Text contains invalid characters')
    .trim().min(1, 'Text is required').max(MAX_OPTION_LENGTH, `Text must be at most ${MAX_OPTION_LENGTH} characters`),
});

/** Params of DELETE /api/options/:id: a Firestore-safe document id. */
export const optionIdParamsSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, 'Invalid id'),
});
