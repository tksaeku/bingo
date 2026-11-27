import type { Request, Response } from 'express';
import { ipKeyGenerator, rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, VISITOR_ID_PATTERN } from '../constants';

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


/**
 * Creates a limiter allowing `limit` requests per minute per key. Each call has its own counter store.
 * The key generator decides who shares a counter (an IP, a visitor ID, ...).
 */
export function createKeyedRateLimiter(limit: number, keyGenerator: (req: Request) => string): RateLimitRequestHandler {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator,
    handler: (_req: Request, res: Response): void => {
      res.status(429).json({ error: 'Too many requests, please try again later' });
    },
  });
}

/** Rate-limit key for a client IP; IPv6 addresses are grouped by subnet. */
export function getIpRateLimitKey(req: Request): string {
  return ipKeyGenerator(req.ip ?? '');
}

/**
 * Rate-limit key for an analytics visitor: `visitor:<id>` when the parsed body carries a valid
 * UUID v4 visitor ID, otherwise the IP key so a malformed body cannot skip the limiter.
 */
export function getVisitorRateLimitKey(req: Request): string {
  const visitorId: unknown = req.body?.visitorId;
  if (typeof visitorId === 'string' && VISITOR_ID_PATTERN.test(visitorId)) {
    return `visitor:${visitorId}`;
  }
  return getIpRateLimitKey(req);
}
