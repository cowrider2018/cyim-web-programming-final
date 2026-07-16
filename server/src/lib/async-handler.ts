import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 does not catch rejected promises from async handlers, so every
 * async route is wrapped to funnel failures into the error middleware.
 */
export function asyncHandler<T extends Request = Request>(
  handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req as T, res, next).catch(next);
  };
}
