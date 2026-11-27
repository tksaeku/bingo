import { AxiosError } from 'axios';
import type { AxiosResponse } from 'axios';

/** Builds an axios error carrying an HTTP status and the API's `{ error }` body. */
export function createAxiosError(status: number, message: string): AxiosError {
  const response = { status, data: { error: message } } as AxiosResponse;
  return new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, response);
}
