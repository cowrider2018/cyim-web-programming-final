import { and, count, desc, eq, inArray, like, notInArray, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  categories,
  orderItems,
  orders,
  productImages,
  products,
  users,
  variants,
} from '../../db/schema.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import type {
  CreateProductInput,
  ListAdminProductsQuery,
  UpdateProductInput,
} from './admin.schema.js';

export async function listProducts(query: ListAdminProductsQuery) {
  const filters = [];
  if (!query.includeInactive) filters.push(eq(products.isActive, true));
  if (query.q) {
    const term = query.q.replace(/[%_\\]/g, (match) => `\\${match}`);
    filters.push(like(products.name, `%${term}%`));
  }
  const where = filters.length > 0 ? and(...filters) : undefined;

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      isActive: products.isActive,
      categoryId: products.categoryId,
      categoryName: categories.name,
      totalStock: sql<number>`(
        select coalesce(sum(${variants.stock}), 0)
        from ${variants}
        where ${variants.productId} = ${products.id}
      )`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(where)
    .orderBy(desc(products.id))
    .limit(query.perPage)
    .offset((query.page - 1) * query.perPage);

  const productIds = rows.map((row) => row.id);
  const allVariants =
    productIds.length > 0
      ? await db
          .select({
            id: variants.id,
            productId: variants.productId,
            name: variants.name,
            stock: variants.stock,
            position: variants.position,
          })
          .from(variants)
          .where(inArray(variants.productId, productIds))
      : [];

  const [totals] = await db.select({ total: count() }).from(products).where(where);
  const total = totals?.total ?? 0;

  return {
    items: rows.map((row) => ({
      ...row,
      variants: allVariants
        .filter((variant) => variant.productId === row.id)
        .sort((a, b) => a.position - b.position),
    })),
    pagination: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}

export function createProduct(input: CreateProductInput) {
  return db.transaction((tx) => {
    const category = tx
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, input.categoryId))
      .get();
    if (!category) throw new NotFoundError('Category not found');

    const product = tx
      .insert(products)
      .values({
        name: input.name,
        description: input.description,
        price: input.price,
        categoryId: input.categoryId,
        isActive: input.isActive,
      })
      .returning({ id: products.id })
      .get();

    if (!product) throw new Error('Failed to create product');

    tx.insert(variants)
      .values(
        input.variants.map((variant, index) => ({
          productId: product.id,
          name: variant.name,
          stock: variant.stock,
          position: index,
        })),
      )
      .run();

    if (input.images.length > 0) {
      tx.insert(productImages)
        .values(
          input.images.map((url, index) => ({
            productId: product.id,
            url,
            position: index,
          })),
        )
        .run();
    }

    return { id: product.id };
  });
}

export function updateProduct(productId: number, input: UpdateProductInput) {
  return db.transaction((tx) => {
    const existing = tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .get();
    if (!existing) throw new NotFoundError('Product not found');

    const productFields = {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    };

    if (Object.keys(productFields).length > 0) {
      tx.update(products)
        .set({ ...productFields, updatedAt: sql`(datetime('now'))` })
        .where(eq(products.id, productId))
        .run();
    }

    if (input.variants) {
      const keptIds = input.variants
        .map((variant) => variant.id)
        .filter((id): id is number => typeof id === 'number');

      // A variant referenced by an order can never be deleted — the FK on
      // order_items is RESTRICT precisely so history cannot be rewritten.
      const removable = tx
        .select({ id: variants.id })
        .from(variants)
        .where(
          keptIds.length > 0
            ? and(eq(variants.productId, productId), notInArray(variants.id, keptIds))
            : eq(variants.productId, productId),
        )
        .all();

      for (const variant of removable) {
        const used = tx
          .select({ id: orderItems.id })
          .from(orderItems)
          .where(eq(orderItems.variantId, variant.id))
          .limit(1)
          .get();

        if (used) {
          throw new ConflictError(
            'That option has already been ordered and cannot be deleted. Set its stock to 0 instead.',
          );
        }
        tx.delete(variants).where(eq(variants.id, variant.id)).run();
      }

      // Position doubles as the display order and has a unique constraint, so
      // rows are pushed out of the way before being renumbered.
      tx.update(variants)
        .set({ position: sql`${variants.position} + 1000` })
        .where(eq(variants.productId, productId))
        .run();

      input.variants.forEach((variant, index) => {
        if (variant.id) {
          tx.update(variants)
            .set({ name: variant.name, stock: variant.stock, position: index })
            .where(and(eq(variants.id, variant.id), eq(variants.productId, productId)))
            .run();
        } else {
          tx.insert(variants)
            .values({
              productId,
              name: variant.name,
              stock: variant.stock,
              position: index,
            })
            .run();
        }
      });
    }

    if (input.images) {
      tx.delete(productImages).where(eq(productImages.productId, productId)).run();
      if (input.images.length > 0) {
        tx.insert(productImages)
          .values(
            input.images.map((url, index) => ({ productId, url, position: index })),
          )
          .run();
      }
    }

    return { id: productId };
  });
}

/**
 * Delisting is a soft delete. The original ran DELETE FROM Item, which broke
 * every historical order that referenced the row.
 */
export async function delistProduct(productId: number) {
  const updated = await db
    .update(products)
    .set({ isActive: false, updatedAt: sql`(datetime('now'))` })
    .where(eq(products.id, productId))
    .returning({ id: products.id });

  if (updated.length === 0) throw new NotFoundError('Product not found');
  return { id: productId, isActive: false };
}

export async function relistProduct(productId: number) {
  const updated = await db
    .update(products)
    .set({ isActive: true, updatedAt: sql`(datetime('now'))` })
    .where(eq(products.id, productId))
    .returning({ id: products.id });

  if (updated.length === 0) throw new NotFoundError('Product not found');
  return { id: productId, isActive: true };
}

export async function getDashboardStats() {
  const [revenue] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${orders.totalPrice}), 0)`,
      orderCount: count(orders.id),
    })
    .from(orders)
    .where(notInArray(orders.status, ['cancelled']));

  const [customers] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.role, 'customer'));

  const [activeProducts] = await db
    .select({ total: count() })
    .from(products)
    .where(eq(products.isActive, true));

  const ordersByStatus = await db
    .select({ status: orders.status, total: count() })
    .from(orders)
    .groupBy(orders.status);

  const lowStock = await db
    .select({
      variantId: variants.id,
      productId: products.id,
      productName: products.name,
      variantName: variants.name,
      stock: variants.stock,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .where(and(eq(products.isActive, true), sql`${variants.stock} <= 2`))
    .orderBy(variants.stock)
    .limit(10);

  const topProducts = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      unitsSold: sql<number>`sum(${orderItems.quantity})`,
      revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPrice})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(notInArray(orders.status, ['cancelled']))
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  return {
    totalRevenue: revenue?.totalRevenue ?? 0,
    orderCount: revenue?.orderCount ?? 0,
    customerCount: customers?.total ?? 0,
    activeProductCount: activeProducts?.total ?? 0,
    ordersByStatus,
    lowStock,
    topProducts,
  };
}
