import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { validate, validateIdParam } from '../../middleware/validate.js';
import { listProductsSchema } from './catalog.schema.js';
import * as catalogService from './catalog.service.js';

export const catalogRoutes = Router();

catalogRoutes.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json({ categories: await catalogService.listCategories() });
  }),
);

catalogRoutes.get(
  '/products',
  validate(listProductsSchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(await catalogService.listProducts(req.query as never));
  }),
);

catalogRoutes.get(
  '/products/new-arrivals',
  asyncHandler(async (_req, res) => {
    res.json({ products: await catalogService.getNewArrivals() });
  }),
);

catalogRoutes.get(
  '/products/:id',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    res.json({ product: await catalogService.getProduct(id) });
  }),
);

catalogRoutes.get(
  '/products/:id/related',
  validateIdParam,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    res.json({ products: await catalogService.getRelatedProducts(id) });
  }),
);
