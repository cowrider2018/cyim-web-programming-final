/**
 * The session, for the static demo.
 *
 * The real server mints a JWT and puts it in an httpOnly cookie, which is only
 * meaningful because the token is signed somewhere the browser can't reach. In
 * a page with no server, both halves of that are theatre: any secret shipped to
 * the client is public, so a signed token would prove nothing. This stores the
 * user id instead and re-reads the user from the database on every request —
 * the same rule the real middleware follows, so a role change or a deleted
 * account takes effect immediately rather than riding on a stale token.
 */
import { eq } from 'drizzle-orm';
import { users, type UserRole } from '@server/db/schema.js';
import { db } from './client';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

const KEY = 'maisie-demo-session';

export function setSession(userId: number): void {
  try {
    localStorage.setItem(KEY, String(userId));
  } catch {
    // Storage can be unavailable; the session then lasts until reload.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}

/** Resolves the stored id to a user, or undefined when signed out. */
export function getSessionUser(): AuthUser | undefined {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return undefined;
  }
  if (!raw) return undefined;

  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return undefined;

  const [user] = db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .all();

  if (!user) clearSession();
  return user;
}
