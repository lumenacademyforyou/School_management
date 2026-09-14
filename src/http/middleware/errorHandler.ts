import type { NextFunction, Request, Response } from 'express';
import { AuthError } from '../../auth/authService.js';
import { HttpError } from '../errors.js';

export function errorHandler() {
  return (error: unknown, _req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof HttpError) {
      res.status(error.status).json({
        error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
      });
      return;
    }

    if (error instanceof AuthError) {
      res.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }

    // Never surface an internal message to the caller; it may quote SQL.
    console.error('Unhandled error', error);
    res.status(500).json({
      error: { code: 'internal_error', message: 'Something went wrong on our side' },
    });
  };
}
