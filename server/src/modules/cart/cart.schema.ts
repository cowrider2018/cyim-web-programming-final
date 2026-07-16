import { z } from 'zod';

export const MAX_QUANTITY_PER_LINE = 99;

export const addToCartSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive().max(MAX_QUANTITY_PER_LINE).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(MAX_QUANTITY_PER_LINE),
});

export const cartItemParamsSchema = z.object({
  variantId: z.coerce.number().int().positive(),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
