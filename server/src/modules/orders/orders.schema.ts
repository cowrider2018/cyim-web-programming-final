import { z } from 'zod';
import { orderStatuses, paymentMethods } from '../../db/schema.js';

const cardNumber = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^\d{13,19}$/, 'Card number must be 13-19 digits'));

export const checkoutSchema = z
  .object({
    paymentMethod: z.enum(paymentMethods),
    cardNumber: cardNumber.optional(),
    recipientName: z.string().min(1).max(50).trim(),
    recipientPhone: z
      .string()
      .regex(/^09\d{8}$/, 'Phone must be a Taiwanese mobile number'),
    shippingAddress: z.string().min(1).max(255).trim(),
    notes: z.string().max(500).trim().optional(),
  })
  .refine(
    (data) => data.paymentMethod !== 'credit_card' || Boolean(data.cardNumber),
    { message: 'Card number is required for credit card payment', path: ['cardNumber'] },
  );

export const listOrdersSchema = z.object({
  status: z.enum(orderStatuses).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(50).default(10),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersSchema>;
