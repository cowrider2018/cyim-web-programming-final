import { and, asc, count, desc, eq, like, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import {
  categories,
  productImages,
  products,
  reviews,
  variants,
} from '../../db/schema.js';
import { NotFoundError } from '../../lib/errors.js';
import type { ListProductsQuery } from './catalog.schema.js';

export async function listCategories() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      nameEn: categories.nameEn,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true)),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.position));
}

/** Rating stats per product, computed in SQL rather than by looping in JS. */
const ratingStats = db
  .select({
    productId: reviews.productId,
    averageRating: sql<number>`round(avg(${reviews.rating}), 1)`.as('average_rating'),
    reviewCount: count(reviews.id).as('review_count'),
  })
  .from(reviews)
  .groupBy(reviews.productId)
  .as('rating_stats');

/** The primary image only — enough for a product card, one row per product. */
const primaryImage = db
  .select({
    productId: productImages.productId,
    url: sql<string>`min(${productImages.url})`.as('primary_url'),
  })
  .from(productImages)
  .where(eq(productImages.position, 0))
  .groupBy(productImages.productId)
  .as('primary_image');

const stockTotals = db
  .select({
    productId: variants.productId,
    totalStock: sql<number>`sum(${variants.stock})`.as('total_stock'),
  })
  .from(variants)
  .groupBy(variants.productId)
  .as('stock_totals');

export async function listProducts(query: ListProductsQuery) {
  const filters = [eq(products.isActive, true)];

  if (query.category && query.category !== 'all') {
    filters.push(eq(categories.slug, query.category));
  }
  if (query.q) {
    // Escape the LIKE wildcards so a literal "%" searches for "%".
    const term = query.q.replace(/[%_\\]/g, (match) => `\\${match}`);
    filters.push(like(products.name, `%${term}%`));
  }

  const where = and(...filters);

  const orderBy = {
    newest: desc(products.id),
    price_asc: asc(products.price),
    price_desc: desc(products.price),
  }[query.sort];

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      description: products.description,
      category: {
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        nameEn: categories.nameEn,
      },
      imageUrl: primaryImage.url,
      totalStock: sql<number>`coalesce(${stockTotals.totalStock}, 0)`,
      averageRating: ratingStats.averageRating,
      reviewCount: sql<number>`coalesce(${ratingStats.reviewCount}, 0)`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(primaryImage, eq(primaryImage.productId, products.id))
    .leftJoin(stockTotals, eq(stockTotals.productId, products.id))
    .leftJoin(ratingStats, eq(ratingStats.productId, products.id))
    .where(where)
    .orderBy(orderBy)
    .limit(query.perPage)
    .offset((query.page - 1) * query.perPage);

  const [totals] = await db
    .select({ total: count() })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(where);

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

export async function getProduct(productId: number) {
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      isActive: products.isActive,
      category: {
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        nameEn: categories.nameEn,
      },
      averageRating: ratingStats.averageRating,
      reviewCount: sql<number>`coalesce(${ratingStats.reviewCount}, 0)`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(ratingStats, eq(ratingStats.productId, products.id))
    .where(and(eq(products.id, productId), eq(products.isActive, true)))
    .limit(1);

  if (!product) throw new NotFoundError('Product not found');

  const [productVariants, images] = await Promise.all([
    db
      .select({
        id: variants.id,
        name: variants.name,
        stock: variants.stock,
        position: variants.position,
      })
      .from(variants)
      .where(eq(variants.productId, productId))
      .orderBy(asc(variants.position)),
    db
      .select({ id: productImages.id, url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.position)),
  ]);

  return { ...product, variants: productVariants, images };
}

/** Products in the same category, used for the "you may also like" row. */
export async function getRelatedProducts(productId: number, limit = 4) {
  const [product] = await db
    .select({ categoryId: products.categoryId })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) throw new NotFoundError('Product not found');

  return db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: primaryImage.url,
    })
    .from(products)
    .leftJoin(primaryImage, eq(primaryImage.productId, products.id))
    .where(
      and(
        eq(products.categoryId, product.categoryId),
        eq(products.isActive, true),
        sql`${products.id} <> ${productId}`,
      ),
    )
    .orderBy(desc(products.id))
    .limit(limit);
}

export async function getNewArrivals(limit = 6) {
  return db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: primaryImage.url,
      category: { slug: categories.slug, name: categories.name },
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(primaryImage, eq(primaryImage.productId, products.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.id))
    .limit(limit);
}
