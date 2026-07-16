import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { orderItems, orders, reviews, users } from '../../db/schema.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableError,
} from '../../lib/errors.js';
import type { CreateReviewInput, ProductReviewsQuery } from './reviews.schema.js';

export async function createReview(userId: number, input: CreateReviewInput) {
  // The original trusted whatever itemId/orderId the form posted, so anyone
  // could review anything. A review must correspond to a line item the user
  // actually bought and received.
  const [line] = await db
    .select({
      productId: orderItems.productId,
      orderStatus: orders.status,
      orderUserId: orders.userId,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        eq(orderItems.orderId, input.orderId),
        eq(orderItems.variantId, input.variantId),
      ),
    )
    .limit(1);

  if (!line) throw new NotFoundError('That item is not part of this order');
  if (line.orderUserId !== userId) {
    throw new ForbiddenError('You can only review your own purchases');
  }
  if (!(['shipped', 'completed'] as const).includes(line.orderStatus as never)) {
    throw new UnprocessableError('You can review an item once it has shipped');
  }

  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(eq(reviews.orderId, input.orderId), eq(reviews.variantId, input.variantId)),
    )
    .limit(1);

  if (existing) throw new ConflictError('You have already reviewed this item');

  const [review] = await db
    .insert(reviews)
    .values({
      orderId: input.orderId,
      productId: line.productId,
      variantId: input.variantId,
      userId,
      rating: input.rating,
      body: input.body,
    })
    .returning();

  return review!;
}

export async function listProductReviews(
  productId: number,
  query: ProductReviewsQuery,
) {
  const where = eq(reviews.productId, productId);

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      authorName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(where)
    .orderBy(desc(reviews.id))
    .limit(query.perPage)
    .offset((query.page - 1) * query.perPage);

  const [totals] = await db.select({ total: count() }).from(reviews).where(where);
  const total = totals?.total ?? 0;

  return {
    // Only an initial plus a mask reaches the client — full names on a public
    // page are more personal data than a review needs.
    items: rows.map((row) => ({
      ...row,
      authorName: maskName(row.authorName),
    })),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}

export async function listMyReviews(userId: number) {
  return db
    .select({
      id: reviews.id,
      orderId: reviews.orderId,
      productId: reviews.productId,
      rating: reviews.rating,
      body: reviews.body,
      createdAt: reviews.createdAt,
      productName: orderItems.productName,
      variantName: orderItems.variantName,
    })
    .from(reviews)
    .innerJoin(
      orderItems,
      and(
        eq(orderItems.orderId, reviews.orderId),
        eq(orderItems.variantId, reviews.variantId),
      ),
    )
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.id));
}

export async function deleteReview(reviewId: number, userId: number) {
  const deleted = await db
    .delete(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
    .returning({ id: reviews.id });

  if (deleted.length === 0) throw new NotFoundError('Review not found');
}

function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
}
