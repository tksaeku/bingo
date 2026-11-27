import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../HttpError';

/** Creates the analytics kill switch: answers 410 on every request while collection is off. */
export function createRequireAnalyticsEnabled(isEnabled: boolean): (req: Request, res: Response, next: NextFunction) => void {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    if (!isEnabled) {
      next(new HttpError(410, 'Analytics collection is off'));
      return;
    }
    next();
  };
}
