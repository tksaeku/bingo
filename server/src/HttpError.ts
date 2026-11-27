export type ErrorDetail = {
  path: string;
  message: string;
};

/** An error that maps directly to an HTTP response with a client-safe message. */
export class HttpError extends Error {
  readonly status: number;
  readonly details?: ErrorDetail[];

  constructor(status: number, message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}
