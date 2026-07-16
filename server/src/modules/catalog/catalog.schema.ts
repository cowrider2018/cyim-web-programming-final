import { z } from 'zod';

export const listProductsSchema = z.object({
  category: z.string().min(1).max(50).optional(),
  q: z.string().min(1).max(100).trim().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(60).default(24),
});

export type ListProductsQuery = z.infer<typeof listProductsSchema>;
