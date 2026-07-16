import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core';

/**
 * Money is stored as an integer number of New Taiwan dollars. TWD is a
 * zero-decimal currency in practice, and integers keep arithmetic exact —
 * the original schema used DECIMAL and read it back through Java doubles.
 */

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
};

export const userRoles = ['customer', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    address: text('address'),
    birthDate: text('birth_date'),
    role: text('role', { enum: userRoles }).notNull().default('customer'),
    lastLoginAt: text('last_login_at'),
    ...timestamps,
  },
  (table) => ({
    emailUnique: unique('users_email_unique').on(table.email),
  }),
);

export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    nameEn: text('name_en').notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => ({
    slugUnique: unique('categories_slug_unique').on(table.slug),
  }),
);

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    price: integer('price').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    categoryIdx: index('products_category_idx').on(table.categoryId),
    activeIdx: index('products_active_idx').on(table.isActive),
  }),
);

/** A purchasable variant of a product — "金色" / "銀色" / "標準". */
export const variants = sqliteTable(
  'variants',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    stock: integer('stock').notNull().default(0),
    position: integer('position').notNull().default(0),
  },
  (table) => ({
    productIdx: index('variants_product_idx').on(table.productId),
    productPositionUnique: unique('variants_product_position_unique').on(
      table.productId,
      table.position,
    ),
  }),
);

export const productImages = sqliteTable(
  'product_images',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    position: integer('position').notNull().default(0),
  },
  (table) => ({
    productIdx: index('product_images_product_idx').on(table.productId),
  }),
);

export const cartItems = sqliteTable(
  'cart_items',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id')
      .notNull()
      .references(() => variants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull(),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.variantId] }),
  }),
);

export const orderStatuses = [
  'pending',
  'paid',
  'shipped',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentMethods = ['credit_card', 'cash_on_delivery'] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: text('status', { enum: orderStatuses }).notNull().default('pending'),
    paymentMethod: text('payment_method', { enum: paymentMethods }).notNull(),
    /** Only the last four digits are ever persisted. */
    cardLast4: text('card_last4'),
    /** Delivery details are snapshotted so later profile edits can't rewrite history. */
    recipientName: text('recipient_name').notNull(),
    recipientPhone: text('recipient_phone').notNull(),
    shippingAddress: text('shipping_address').notNull(),
    /** subtotal + shippingFee = totalPrice, all computed server-side. */
    subtotal: integer('subtotal').notNull(),
    shippingFee: integer('shipping_fee').notNull(),
    totalPrice: integer('total_price').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (table) => ({
    userIdx: index('orders_user_idx').on(table.userId),
    statusIdx: index('orders_status_idx').on(table.status),
  }),
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id')
      .notNull()
      .references(() => variants.id, { onDelete: 'restrict' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    /** Name and price snapshots keep old invoices readable after catalog edits. */
    productName: text('product_name').notNull(),
    variantName: text('variant_name').notNull(),
    unitPrice: integer('unit_price').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (table) => ({
    orderIdx: index('order_items_order_idx').on(table.orderId),
    orderVariantUnique: unique('order_items_order_variant_unique').on(
      table.orderId,
      table.variantId,
    ),
  }),
);

export const reviews = sqliteTable(
  'reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: integer('variant_id')
      .notNull()
      .references(() => variants.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    body: text('body').notNull().default(''),
    ...timestamps,
  },
  (table) => ({
    productIdx: index('reviews_product_idx').on(table.productId),
    /** One review per purchased line item. */
    orderVariantUnique: unique('reviews_order_variant_unique').on(
      table.orderId,
      table.variantId,
    ),
  }),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(variants),
  images: many(productImages),
  reviews: many(reviews),
}));

export const variantsRelations = relations(variants, ({ one }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  cartItems: many(cartItems),
  reviews: many(reviews),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  variant: one(variants, {
    fields: [cartItems.variantId],
    references: [variants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  variant: one(variants, {
    fields: [orderItems.variantId],
    references: [variants.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  variant: one(variants, {
    fields: [reviews.variantId],
    references: [variants.id],
  }),
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
}));
