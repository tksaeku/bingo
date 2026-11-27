import type { z } from 'zod';
import { HttpError } from '../HttpError';

/**
 * Validates untrusted input against a Zod schema and returns the parsed value.
 * Throws a 400 HttpError (never echoing the input) when validation fails.
 */
export function parseInput<Schema extends z.ZodType>(schema: Schema, value: unknown): z.output<Schema> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new HttpError(400, 'Invalid request', details);
  }
  return result.data;
}
