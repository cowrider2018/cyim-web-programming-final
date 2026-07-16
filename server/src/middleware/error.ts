import type { NextFunction, Request, Response } from 'express';
import { env } from '../env.js';
import { HttpError, NotFoundError } from '../lib/errors.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) return next(error);

  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  // Anything unrecognised is a bug: log it in full, tell the client nothing.
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
      ...(env.NODE_ENV === 'development' && error instanceof Error
        ? { details: error.message }
        : {}),
    },
  });
}
