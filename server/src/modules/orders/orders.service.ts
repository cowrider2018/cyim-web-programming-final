import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  cartItems,
  orderItems,
  orders,
  productImages,
  products,
  reviews,
  users,
  variants,
  type OrderStatus,
} from '../../db/schema.js';
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableError,
} from '../../lib/errors.js';
import type { CheckoutInput, ListOrdersQuery } from './orders.schema.js';
import { calculateShipping } from './shipping.js';

/**
 * Which status changes an admin may make. Terminal states accept nothing,
 * which is what stops a delivered order from silently going back to pending.
 */
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
};

/**
 * Places an order in a single transaction: read the cart, verify stock, write
 * the order, decrement stock, and empty the cart. better-sqlite3 runs
 * synchronously, so the callback stays sync and either all of it lands or none
 * of it does. The original JSP did these as four independent statements with no
 * transaction, so a mid-way failure left orphaned rows and stock could be sold
 * twice.
 */
export function checkout(userId: number, input: CheckoutInput) {
  return db.transaction((tx) => {
    const lines = tx
      .select({
        variantId: variants.id,
        variantName: variants.name,
        productId: products.id,
        productName: products.name,
        unitPrice: products.price,
        quantity: cartItems.quantity,
        stock: variants.stock,
        isActive: products.isActive,
      })
      .from(cartItems)
      .innerJoin(variants, eq(cartItems.variantId, variants.id))
      .innerJoin(products, eq(variants.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .all();

    if (lines.length === 0) {
      throw new UnprocessableError('Your cart is empty');
    }

    const unavailable = lines.filter(
      (line) => !line.isActive || line.quantity > line.stock,
    );
    if (unavailable.length > 0) {
      throw new UnprocessableError('Some items are no longer available in that quantity', {
        items: unavailable.map((line) => ({
          variantId: line.variantId,
          productName: line.productName,
          variantName: line.variantName,
          requested: line.quantity,
          availableStock: line.isActive ? line.stock : 0,
        })),
      });
    }

    const subtotal = lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );
    const shippingFee = calculateShipping(subtotal);
    const totalPrice = subtotal + shippingFee;

    const order = tx
      .insert(orders)
      .values({
        userId,
        status: input.paymentMethod === 'credit_card' ? 'paid' : 'pending',
        paymentMethod: input.paymentMethod,
        // Never store a full PAN. Only the last four digits are kept, which is
        // all that is needed to show "**** 1234" on the receipt.
        cardLast4: input.cardNumber ? input.cardNumber.slice(-4) : null,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        shippingAddress: input.shippingAddress,
        notes: input.notes ?? null,
        subtotal,
        shippingFee,
        totalPrice,
      })
      .returning({ id: orders.id })
      .get();

    if (!order) throw new Error('Failed to create order');

    tx.insert(orderItems)
      .values(
        lines.map((line) => ({
          orderId: order.id,
          variantId: line.variantId,
          productId: line.productId,
          productName: line.productName,
          variantName: line.variantName,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
      )
      .run();

    for (const line of lines) {
      // The stock >= quantity guard makes the decrement atomic: if a concurrent
      // checkout took the last unit, this matches zero rows and we roll back
      // instead of writing negative stock.
      const result = tx
        .update(variants)
        .set({ stock: sql`${variants.stock} - ${line.quantity}` })
        .where(
          and(
            eq(variants.id, line.variantId),
            sql`${variants.stock} >= ${line.quantity}`,
          ),
        )
        .run();

      if (result.changes === 0) {
        throw new UnprocessableError(
          `${line.productName} (${line.variantName}) sold out while you were checking out`,
          { variantId: line.variantId },
        );
      }
    }

    tx.delete(cartItems).where(eq(cartItems.userId, userId)).run();

    return { orderId: order.id, totalPrice };
  });
}

export async function listOrders(userId: number, query: ListOrdersQuery) {
  const filters = [eq(orders.userId, userId)];
  if (query.status) filters.push(eq(orders.status, query.status));
  const where = and(...filters);

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      paymentMethod: orders.paymentMethod,
      cardLast4: orders.cardLast4,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(
        select coalesce(sum(${orderItems.quantity}), 0)
        from ${orderItems}
        where ${orderItems.orderId} = ${orders.id}
      )`,
    })
    .from(orders)
    .where(where)
    .orderBy(desc(orders.id))
    .limit(query.perPage)
    .offset((query.page - 1) * query.perPage);

  const [totals] = await db.select({ total: count() }).from(orders).where(where);
  const total = totals?.total ?? 0;

  return {
    items: rows,
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}

export async function getOrder(orderId: number, requester: { id: number; role: string }) {
  const [order] = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      cardLast4: orders.cardLast4,
      recipientName: orders.recipientName,
      recipientPhone: orders.recipientPhone,
      shippingAddress: orders.shippingAddress,
      subtotal: orders.subtotal,
      shippingFee: orders.shippingFee,
      totalPrice: orders.totalPrice,
      notes: orders.notes,
      createdAt: orders.createdAt,
      customerEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) throw new NotFoundError('Order not found');

  // Ownership is checked after the lookup but the 404/403 split never leaks
  // more than "this id exists", which an authenticated customer cannot enumerate.
  if (order.userId !== requester.id && requester.role !== 'admin') {
    throw new ForbiddenError('This order belongs to another account');
  }

  const items = await db
    .select({
      id: orderItems.id,
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      imageUrl: sql<string | null>`(
        select ${productImages.url}
        from ${productImages}
        where ${productImages.productId} = ${orderItems.productId}
        order by ${productImages.position}
        limit 1
      )`,
      reviewId: reviews.id,
    })
    .from(orderItems)
    .leftJoin(
      reviews,
      and(
        eq(reviews.orderId, orderItems.orderId),
        eq(reviews.variantId, orderItems.variantId),
      ),
    )
    .where(eq(orderItems.orderId, orderId));

  return {
    ...order,
    items: items.map(({ reviewId, ...item }) => ({
      ...item,
      lineTotal: item.unitPrice * item.quantity,
      hasReview: reviewId !== null,
    })),
  };
}

export function cancelOrder(orderId: number, userId: number) {
  return db.transaction((tx) => {
    const order = tx
      .select({ id: orders.id, userId: orders.userId, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .get();

    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId) {
      throw new ForbiddenError('This order belongs to another account');
    }
    if (!allowedTransitions[order.status].includes('cancelled')) {
      throw new UnprocessableError(`A ${order.status} order can no longer be cancelled`);
    }

    // Cancelling returns the reserved units to the shelf.
    const items = tx
      .select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .all();

    for (const item of items) {
      tx.update(variants)
        .set({ stock: sql`${variants.stock} + ${item.quantity}` })
        .where(eq(variants.id, item.variantId))
        .run();
    }

    tx.update(orders)
      .set({ status: 'cancelled', updatedAt: sql`(datetime('now'))` })
      .where(eq(orders.id, orderId))
      .run();

    return { orderId, status: 'cancelled' as const };
  });
}

/** Admin view: every order, with the customer attached. */
export async function listAllOrders(query: ListOrdersQuery) {
  const where = query.status ? eq(orders.status, query.status) : undefined;

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      paymentMethod: orders.paymentMethod,
      recipientName: orders.recipientName,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
      customer: { id: users.id, name: users.name, email: users.email },
      itemCount: sql<number>`(
        select coalesce(sum(${orderItems.quantity}), 0)
        from ${orderItems}
        where ${orderItems.orderId} = ${orders.id}
      )`,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .where(where)
    .orderBy(desc(orders.id))
    .limit(query.perPage)
    .offset((query.page - 1) * query.perPage);

  const [totals] = await db.select({ total: count() }).from(orders).where(where);
  const total = totals?.total ?? 0;

  return {
    items: rows,
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}

export function updateOrderStatus(orderId: number, status: OrderStatus) {
  return db.transaction((tx) => {
    const order = tx
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .get();

    if (!order) throw new NotFoundError('Order not found');

    if (!allowedTransitions[order.status].includes(status)) {
      throw new UnprocessableError(
        `Cannot move an order from ${order.status} to ${status}`,
        { allowed: allowedTransitions[order.status] },
      );
    }

    if (status === 'cancelled') {
      const items = tx
        .select({ variantId: orderItems.variantId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))
        .all();

      for (const item of items) {
        tx.update(variants)
          .set({ stock: sql`${variants.stock} + ${item.quantity}` })
          .where(eq(variants.id, item.variantId))
          .run();
      }
    }

    tx.update(orders)
      .set({ status, updatedAt: sql`(datetime('now'))` })
      .where(eq(orders.id, orderId))
      .run();

    return { orderId, status };
  });
}

/** Variants the user has actually received and not yet reviewed. */
export async function getReviewableItems(userId: number) {
  return db
    .select({
      orderId: orders.id,
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
      orderedAt: orders.createdAt,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(
      reviews,
      and(
        eq(reviews.orderId, orderItems.orderId),
        eq(reviews.variantId, orderItems.variantId),
      ),
    )
    .where(
      and(
        eq(orders.userId, userId),
        inArray(orders.status, ['shipped', 'completed']),
        sql`${reviews.id} is null`,
      ),
    )
    .orderBy(desc(orders.id));
}
