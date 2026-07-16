import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users, type UserRole } from '../db/schema.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import { SESSION_COOKIE, verifySessionToken } from '../lib/tokens.js';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Resolves the session cookie to a user without failing the request, so public
 * routes can vary their response for signed-in visitors.
 */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return next();

    const payload = verifySessionToken(token);
    if (!payload) return next();

    // Re-read the user each request: a token minted before a role change or
    // account deletion must not keep working.
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (user) req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  if (req.user.role !== 'admin') return next(new ForbiddenError('Admin access required'));
  next();
}
