import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { users, type UserRole } from '../../db/schema.js';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/errors.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from './auth.schema.js';

const publicColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  phone: users.phone,
  address: users.address,
  birthDate: users.birthDate,
  role: users.role,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  role: UserRole;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('That email is already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      address: input.address,
      birthDate: input.birthDate,
      role: 'customer',
      lastLoginAt: sql`(datetime('now'))`,
    })
    .returning(publicColumns);

  return user!;
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const [record] = await db
    .select({ ...publicColumns, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  // Hash a dummy value when the account is missing so response time does not
  // reveal which emails are registered.
  const hash = record?.passwordHash ?? '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
  const ok = await verifyPassword(input.password, hash);

  if (!record || !ok) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  await db
    .update(users)
    .set({ lastLoginAt: sql`(datetime('now'))` })
    .where(eq(users.id, record.id));

  const { passwordHash: _omit, ...user } = record;
  return user;
}

export async function getById(userId: number): Promise<PublicUser> {
  const [user] = await db
    .select(publicColumns)
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function updateProfile(
  userId: number,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const [user] = await db
    .update(users)
    .set({ ...input, updatedAt: sql`(datetime('now'))` })
    .where(eq(users.id, userId))
    .returning(publicColumns);

  if (!user) throw new NotFoundError('User not found');
  return user;
}

export async function changePassword(
  userId: number,
  input: ChangePasswordInput,
): Promise<void> {
  const [record] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!record) throw new NotFoundError('User not found');

  // Proving knowledge of the old password stops a hijacked session from
  // locking the real owner out.
  const ok = await verifyPassword(input.currentPassword, record.passwordHash);
  if (!ok) throw new UnauthorizedError('Current password is incorrect');

  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(input.newPassword),
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(users.id, userId));
}
