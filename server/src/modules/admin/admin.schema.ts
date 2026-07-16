import { z } from 'zod';

const variantInput = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(30).trim(),
  stock: z.number().int().min(0).max(100_000),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(60).trim(),
  description: z.string().max(2000).trim().default(''),
  price: z.number().int().positive().max(10_000_000),
  categoryId: z.number().int().positive(),
  isActive: z.boolean().default(true),
  variants: z.array(variantInput).min(1, 'A product needs at least one variant'),
  images: z.array(z.string().min(1).max(255)).default([]),
});

export const updateProductSchema = createProductSchema.partial().extend({
  variants: z.array(variantInput).min(1).optional(),
});

export const listAdminProductsSchema = z.object({
  q: z.string().min(1).max(100).trim().optional(),
  includeInactive: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListAdminProductsQuery = z.infer<typeof listAdminProductsSchema>;
