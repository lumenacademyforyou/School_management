/**
 * One error shape for every route.
 *
 *   { "error": { "code": "forbidden", "message": "...", "details"?: ... } }
 *
 * The gateway story widens this with a request id; the shape itself stays as
 * it is so clients written against it today keep working.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const unauthorized = (message = 'Authentication required') =>
  new HttpError(401, 'unauthorized', message);

export const forbidden = (message = 'You do not have access to this resource') =>
  new HttpError(403, 'forbidden', message);

export const notFound = (message = 'Not found') => new HttpError(404, 'not_found', message);

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, 'bad_request', message, details);
