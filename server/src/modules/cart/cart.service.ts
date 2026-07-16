import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  cartItems,
  productImages,
  products,
  variants,
} from '../../db/schema.js';
import { NotFoundError, UnprocessableError } from '../../lib/errors.js';
import {
  FREE_SHIPPING_THRESHOLD,
  calculateShipping,
} from '../orders/shipping.js';
import { MAX_QUANTITY_PER_LINE } from './cart.schema.js';

export interface CartLine {
  variantId: number;
  variantName: string;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
  imageUrl: string | null;
}

export interface Cart {
  items: CartLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  itemCount: number;
}

export async function getCart(userId: number): Promise<Cart> {
  const rows = await db
    .select({
      variantId: variants.id,
      variantName: variants.name,
      productId: products.id,
      productName: products.name,
      unitPrice: products.price,
      quantity: cartItems.quantity,
      stock: variants.stock,
      imageUrl: sql<string | null>`(
        select ${productImages.url}
        from ${productImages}
        where ${productImages.productId} = ${products.id}
        order by ${productImages.position}
        limit 1
      )`,
    })
    .from(cartItems)
    .innerJoin(variants, eq(cartItems.variantId, variants.id))
    .innerJoin(products, eq(variants.productId, products.id))
    .where(eq(cartItems.userId, userId))
    .orderBy(asc(cartItems.createdAt));

  const items = rows.map((row) => ({
    ...row,
    lineTotal: row.unitPrice * row.quantity,
  }));

  // The same helper checkout uses, so the quoted total and the charged total
  // can never drift apart.
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = calculateShipping(subtotal);

  return {
    items,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

async function requireVariant(variantId: number) {
  const [variant] = await db
    .select({
      id: variants.id,
      name: variants.name,
      stock: variants.stock,
      productName: products.name,
      isActive: products.isActive,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .where(eq(variants.id, variantId))
    .limit(1);

  if (!variant || !variant.isActive) {
    throw new NotFoundError('That product option is no longer available');
  }
  return variant;
}

export async function addItem(
  userId: number,
  variantId: number,
  quantity: number,
): Promise<Cart> {
  const variant = await requireVariant(variantId);

  const [existing] = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)))
    .limit(1);

  // Adding to an existing line tops it up, matching the old behaviour, but the
  // total is checked against stock rather than blindly written.
  const desired = (existing?.quantity ?? 0) + quantity;

  if (desired > variant.stock) {
    throw new UnprocessableError(
      variant.stock === 0
        ? `${variant.productName} (${variant.name}) is out of stock`
        : `Only ${variant.stock} left of ${variant.productName} (${variant.name})`,
      { variantId, availableStock: variant.stock },
    );
  }
  if (desired > MAX_QUANTITY_PER_LINE) {
    throw new UnprocessableError(`At most ${MAX_QUANTITY_PER_LINE} per item`);
  }

  await db
    .insert(cartItems)
    .values({ userId, variantId, quantity: desired })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.variantId],
      set: { quantity: desired, updatedAt: sql`(datetime('now'))` },
    });

  return getCart(userId);
}

export async function updateItem(
  userId: number,
  variantId: number,
  quantity: number,
): Promise<Cart> {
  if (quantity === 0) return removeItem(userId, variantId);

  const variant = await requireVariant(variantId);

  if (quantity > variant.stock) {
    throw new UnprocessableError(
      `Only ${variant.stock} left of ${variant.productName} (${variant.name})`,
      { variantId, availableStock: variant.stock },
    );
  }

  const updated = await db
    .update(cartItems)
    .set({ quantity, updatedAt: sql`(datetime('now'))` })
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)))
    .returning({ variantId: cartItems.variantId });

  if (updated.length === 0) throw new NotFoundError('That item is not in your cart');

  return getCart(userId);
}

export async function removeItem(userId: number, variantId: number): Promise<Cart> {
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.variantId, variantId)));
  return getCart(userId);
}

export async function clearCart(userId: number): Promise<Cart> {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  return getCart(userId);
}
