import type { NextFunction, Request, Response } from 'express';
import { z, ZodError, type ZodTypeAny } from 'zod';
import { BadRequestError } from '../lib/errors.js';

type Source = 'body' | 'query' | 'params';

/**
 * Parses one part of the request and replaces it with the typed result, so
 * handlers never touch unvalidated input.
 */
export function validate<S extends ZodTypeAny>(schema: S, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]) as z.infer<S>;
      Object.defineProperty(req, source, { value: parsed, writable: true });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new BadRequestError(
            'Request validation failed',
            error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          ),
        );
        return;
      }
      next(error);
    }
  };
}

/** Rejects "abc" and "-1" before any query runs. */
export const positiveInt = z.coerce.number().int().positive();

export const idParamSchema = z.object({ id: positiveInt });

export const validateIdParam = validate(idParamSchema, 'params');
