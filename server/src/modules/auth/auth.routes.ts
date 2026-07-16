import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSessionToken,
} from '../../lib/tokens.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from './auth.schema.js';
import * as authService from './auth.service.js';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    res.cookie(
      SESSION_COOKIE,
      signSessionToken({ sub: user.id, role: user.role }),
      sessionCookieOptions(),
    );
    res.status(201).json({ user });
  }),
);

authRoutes.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.login(req.body);
    res.cookie(
      SESSION_COOKIE,
      signSessionToken({ sub: user.id, role: user.role }),
      sessionCookieOptions(),
    );
    res.json({ user });
  }),
);

authRoutes.post('/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
  res.status(204).end();
});

authRoutes.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: await authService.getById(req.user!.id) });
  }),
);

authRoutes.patch(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => {
    res.json({ user: await authService.updateProfile(req.user!.id, req.body) });
  }),
);

authRoutes.post(
  '/me/password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body);
    res.status(204).end();
  }),
);
