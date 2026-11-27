import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../HttpError';
import { createLogger } from '../logger';

const logger = createLogger('errorHandler');

type ClientError = {
  status: number;
  type?: string;
};

/** True for any error carrying a numeric 4xx status (body-parser failures, undecodable URL params, ...). */
function getIsClientError(error: unknown): error is ClientError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number' &&
    error.status >= 400 &&
    error.status < 500
  );
}

/** Responds to unmatched routes with a JSON 404. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}

/**
 * Single error middleware: maps HttpError and body-parser failures to client
 * errors and everything else to a generic 500, logging unexpected errors.
 */
export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json(error.details ? { error: error.message, details: error.details } : { error: error.message });
    return;
  }
  if (getIsClientError(error)) {
    if (error.type === 'entity.too.large') {
      res.status(413).json({ error: 'Request body too large' });
      return;
    }
    res.status(error.status).json({ error: error.type === 'entity.parse.failed' ? 'Malformed JSON' : 'Bad request' });
    return;
  }
  logger.error(error, `Unhandled error on ${req.method} ${req.path}`);
  res.status(500).json({ error: 'Internal server error' });
}
