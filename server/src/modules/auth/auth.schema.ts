import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters');

const phone = z
  .string()
  .regex(/^09\d{8}$/, 'Phone must be a Taiwanese mobile number, e.g. 0912345678');

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password,
  name: z.string().min(1).max(50).trim(),
  phone,
  address: z.string().min(1).max(255).trim(),
  birthDate: z.string().date('Birth date must be YYYY-MM-DD'),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  phone: phone.optional(),
  address: z.string().min(1).max(255).trim().optional(),
  birthDate: z.string().date().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
