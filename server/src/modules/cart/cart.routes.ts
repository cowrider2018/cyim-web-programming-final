import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  addToCartSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from './cart.schema.js';
import * as cartService from './cart.service.js';

export const cartRoutes = Router();

cartRoutes.use(requireAuth);

cartRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ cart: await cartService.getCart(req.user!.id) });
  }),
);

cartRoutes.post(
  '/items',
  validate(addToCartSchema),
  asyncHandler(async (req, res) => {
    const { variantId, quantity } = req.body;
    res.status(201).json({
      cart: await cartService.addItem(req.user!.id, variantId, quantity),
    });
  }),
);

cartRoutes.patch(
  '/items/:variantId',
  validate(cartItemParamsSchema, 'params'),
  validate(updateCartItemSchema),
  asyncHandler(async (req, res) => {
    const variantId = Number(req.params.variantId);
    res.json({
      cart: await cartService.updateItem(req.user!.id, variantId, req.body.quantity),
    });
  }),
);

cartRoutes.delete(
  '/items/:variantId',
  validate(cartItemParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    const variantId = Number(req.params.variantId);
    res.json({ cart: await cartService.removeItem(req.user!.id, variantId) });
  }),
);

cartRoutes.delete(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ cart: await cartService.clearCart(req.user!.id) });
  }),
);
