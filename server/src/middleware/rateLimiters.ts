import type { Request, Response } from 'express';
import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS } from '../constants';

/**
 * Creates a per-IP limiter allowing `limit` requests per minute.
 * Each call has its own counter store.
 */
export function createRateLimiter(limit: number): RateLimitRequestHandler {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req: Request, res: Response): void => {
      res.status(429).json({ error: 'Too many requests, please try again later' });
    },
  });
}

