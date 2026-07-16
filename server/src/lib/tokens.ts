import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../env.js';
import type { UserRole } from '../db/schema.js';

export const SESSION_COOKIE = 'maisie_session';

export interface SessionPayload {
  sub: number;
  role: UserRole;
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || typeof decoded.sub !== 'number') return null;
    return { sub: decoded.sub, role: decoded.role as UserRole };
  } catch {
    return null;
  }
}

/**
 * httpOnly keeps the token out of reach of XSS; sameSite=lax still allows the
 * normal top-level navigations a storefront needs.
 */
export function sessionCookieOptions() {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.NODE_ENV === 'production',
    maxAge: sevenDaysMs,
    path: '/',
  };
}
