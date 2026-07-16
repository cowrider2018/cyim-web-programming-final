import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate, validateIdParam } from '../../middleware/validate.js';
import {
  createReviewSchema,
  productReviewsQuerySchema,
} from './reviews.schema.js';
import * as reviewsService from './reviews.service.js';

export const reviewRoutes = Router();

/** Public: reviews shown on a product page. */
reviewRoutes.get(
  '/products/:id/reviews',
  validateIdParam,
  validate(productReviewsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    res.json(
      await reviewsService.listProductReviews(
        Number(req.params.id),
        req.query as never,
      ),
    );
  }),
);

reviewRoutes.get(
  '/reviews/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ reviews: await reviewsService.listMyReviews(req.user!.id) });
  }),
);

reviewRoutes.post(
  '/reviews',
  requireAuth,
  validate(createReviewSchema),
  asyncHandler(async (req, res) => {
    const review = await reviewsService.createReview(req.user!.id, req.body);
    res.status(201).json({ review });
  }),
);

reviewRoutes.delete(
  '/reviews/:id',
  requireAuth,
  validateIdParam,
  asyncHandler(async (req, res) => {
    await reviewsService.deleteReview(Number(req.params.id), req.user!.id);
    res.status(204).end();
  }),
);
