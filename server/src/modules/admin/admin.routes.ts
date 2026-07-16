import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAdmin } from '../../middleware/auth.js';
import { validate, validateIdParam } from '../../middleware/validate.js';
import {
  listOrdersSchema,
  updateOrderStatusSchema,
} from '../orders/orders.schema.js';
import * as ordersService from '../orders/orders.service.js';
import {
  createProductSchema,
  listAdminProductsSchema,
  updateProductSchema,
} from './admin.schema.js';
import * as adminService from './admin.service.js';

export const adminRoutes = Router();

adminRoutes.use(requireAdmin);

adminRoutes.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    res.json({ stats: await adminService.getDashboardStats() });
  }),
);

adminRoutes.get(
  '/products',
  validate(listAdminProductsSchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await adminService.listProducts(req.query as never));
  }),
);

adminRoutes.post(
  '/products',
  validate(createProductSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(adminService.createProduct(req.body));
  }),
);

adminRoutes.patch(
  '/products/:id',
  validateIdParam,
  validate(updateProductSchema),
  asyncHandler(async (req, res) => {
    res.json(adminService.updateProduct(Number(req.params.id), req.body));
  }),
);

adminRoutes.post(
  '/products/:id/delist',
  validateIdParam,
  asyncHandler(async (req, res) => {
    res.json(await adminService.delistProduct(Number(req.params.id)));
  }),
);

adminRoutes.post(
  '/products/:id/relist',
  validateIdParam,
  asyncHandler(async (req, res) => {
    res.json(await adminService.relistProduct(Number(req.params.id)));
  }),
);

adminRoutes.get(
  '/orders',
  validate(listOrdersSchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await ordersService.listAllOrders(req.query as never));
  }),
);

adminRoutes.patch(
  '/orders/:id/status',
  validateIdParam,
  validate(updateOrderStatusSchema),
  asyncHandler(async (req, res) => {
    res.json(ordersService.updateOrderStatus(Number(req.params.id), req.body.status));
  }),
);
