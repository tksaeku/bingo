import type { NextFunction, Request, Response } from 'express';
import { getIsBot } from './userAgent';

/** Answers 204 without storing anything when the User-Agent is missing or looks like a bot. */
export function rejectBots(req: Request, res: Response, next: NextFunction): void {
  if (getIsBot(req.get('user-agent'))) {
    res.status(204).end();
    return;
  }
  next();
}
