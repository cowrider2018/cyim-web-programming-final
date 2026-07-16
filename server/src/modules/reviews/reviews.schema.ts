import { z } from 'zod';

export const createReviewSchema = z.object({
  orderId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).trim().default(''),
});

export const productReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(50).default(10),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type ProductReviewsQuery = z.infer<typeof productReviewsQuerySchema>;
