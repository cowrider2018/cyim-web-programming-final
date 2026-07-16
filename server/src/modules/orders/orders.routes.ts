import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate, validateIdParam } from '../../middleware/validate.js';
import { checkoutSchema, listOrdersSchema } from './orders.schema.js';
import * as ordersService from './orders.service.js';

export const orderRoutes = Router();

orderRoutes.use(requireAuth);

orderRoutes.post(
  '/',
  validate(checkoutSchema),
  asyncHandler(async (req, res) => {
    const result = ordersService.checkout(req.user!.id, req.body);
    res.status(201).json(result);
  }),
);

orderRoutes.get(
  '/',
  validate(listOrdersSchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.listOrders(req.user!.id, req.query as never));
  }),
);

orderRoutes.get(
  '/reviewable',
  asyncHandler(async (req, res) => {
    res.json({ items: await ordersService.getReviewableItems(req.user!.id) });
  }),
);

orderRoutes.get(
  '/:id',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const order = await ordersService.getOrder(Number(req.params.id), req.user!);
    res.json({ order });
  }),
);

orderRoutes.post(
  '/:id/cancel',
  validateIdParam,
  asyncHandler(async (req, res) => {
    res.json(ordersService.cancelOrder(Number(req.params.id), req.user!.id));
  }),
);
