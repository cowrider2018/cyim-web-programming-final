import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env.js';
import { attachUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { cartRoutes } from './modules/cart/cart.routes.js';
import { catalogRoutes } from './modules/catalog/catalog.routes.js';
import { orderRoutes } from './modules/orders/orders.routes.js';
import { reviewRoutes } from './modules/reviews/reviews.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      // The session lives in a cookie, so the browser must be allowed to send it.
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use(attachUser);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api', reviewRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
