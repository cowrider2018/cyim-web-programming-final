/**
 * The API, for the static demo.
 *
 * This is the one layer the demo genuinely reimplements. Express can't run in a
 * page, so its job — match a method and path, check the session, validate the
 * input, call a service, pick a status code — is done here instead, against the
 * same Zod schemas and the same services the real server uses. Everything below
 * this file is the production code path.
 *
 * The route table mirrors server/src/app.ts and the *.routes.ts files, mount
 * prefixes included. Order is load-bearing exactly as it is in Express: the
 * first match wins, so literal segments are declared ahead of the `:id` pattern
 * that would otherwise swallow them (/products/new-arrivals, /orders/reviewable).
 */
import { ZodError, type ZodTypeAny } from 'zod';
import { HttpError, NotFoundError, UnauthorizedError, ForbiddenError, BadRequestError } from '@server/lib/errors.js';
import { idParamSchema } from '@server/middleware/validate.js';
import * as adminService from '@server/modules/admin/admin.service.js';
import {
  createProductSchema,
  listAdminProductsSchema,
  updateProductSchema,
} from '@server/modules/admin/admin.schema.js';
import * as authService from '@server/modules/auth/auth.service.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '@server/modules/auth/auth.schema.js';
import * as cartService from '@server/modules/cart/cart.service.js';
import {
  addToCartSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from '@server/modules/cart/cart.schema.js';
import * as catalogService from '@server/modules/catalog/catalog.service.js';
import { listProductsSchema } from '@server/modules/catalog/catalog.schema.js';
import * as ordersService from '@server/modules/orders/orders.service.js';
import {
  checkoutSchema,
  listOrdersSchema,
  updateOrderStatusSchema,
} from '@server/modules/orders/orders.schema.js';
import * as reviewsService from '@server/modules/reviews/reviews.service.js';
import {
  createReviewSchema,
  productReviewsQuerySchema,
} from '@server/modules/reviews/reviews.schema.js';
import { persist } from './client';
import { clearSession, getSessionUser, setSession, type AuthUser } from './session';

export interface DemoResponse {
  status: number;
  body: unknown;
}

interface Context {
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  body: unknown;
  /** Present whenever `auth` is set — the route table guarantees it. */
  user: AuthUser;
}

interface Route {
  method: string;
  /** Express-style pattern, e.g. '/api/products/:id/related'. */
  path: string;
  auth?: 'user' | 'admin';
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
  /** Status for a successful response; 204 sends no body. */
  status?: number;
  handle: (ctx: Context) => unknown;
}

const routes: Route[] = [
  {
    method: 'GET',
    path: '/api/health',
    handle: () => ({ status: 'ok', mode: 'demo' }),
  },

  // --- auth ---------------------------------------------------------------
  {
    method: 'POST',
    path: '/api/auth/register',
    body: registerSchema,
    status: 201,
    handle: async ({ body }) => {
      const user = await authService.register(body as never);
      setSession(user.id);
      return { user };
    },
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    body: loginSchema,
    handle: async ({ body }) => {
      const user = await authService.login(body as never);
      setSession(user.id);
      return { user };
    },
  },
  {
    method: 'POST',
    path: '/api/auth/logout',
    status: 204,
    handle: () => {
      clearSession();
    },
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    auth: 'user',
    handle: async ({ user }) => ({ user: await authService.getById(user.id) }),
  },
  {
    method: 'PATCH',
    path: '/api/auth/me',
    auth: 'user',
    body: updateProfileSchema,
    handle: async ({ user, body }) => ({
      user: await authService.updateProfile(user.id, body as never),
    }),
  },
  {
    method: 'POST',
    path: '/api/auth/me/password',
    auth: 'user',
    body: changePasswordSchema,
    status: 204,
    handle: async ({ user, body }) => {
      await authService.changePassword(user.id, body as never);
    },
  },

  // --- catalog ------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/categories',
    handle: async () => ({ categories: await catalogService.listCategories() }),
  },
  {
    method: 'GET',
    path: '/api/products/new-arrivals',
    handle: async () => ({ products: await catalogService.getNewArrivals() }),
  },
  {
    method: 'GET',
    path: '/api/products',
    query: listProductsSchema,
    handle: ({ query }) => catalogService.listProducts(query as never),
  },
  {
    method: 'GET',
    path: '/api/products/:id/related',
    params: idParamSchema,
    handle: async ({ params }) => ({
      products: await catalogService.getRelatedProducts(params.id as number),
    }),
  },
  {
    method: 'GET',
    path: '/api/products/:id/reviews',
    params: idParamSchema,
    query: productReviewsQuerySchema,
    handle: ({ params, query }) =>
      reviewsService.listProductReviews(params.id as number, query as never),
  },
  {
    method: 'GET',
    path: '/api/products/:id',
    params: idParamSchema,
    handle: async ({ params }) => ({
      product: await catalogService.getProduct(params.id as number),
    }),
  },

  // --- cart ---------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/cart',
    auth: 'user',
    handle: async ({ user }) => ({ cart: await cartService.getCart(user.id) }),
  },
  {
    method: 'POST',
    path: '/api/cart/items',
    auth: 'user',
    body: addToCartSchema,
    status: 201,
    handle: async ({ user, body }) => {
      const { variantId, quantity } = body as { variantId: number; quantity: number };
      return { cart: await cartService.addItem(user.id, variantId, quantity) };
    },
  },
  {
    method: 'PATCH',
    path: '/api/cart/items/:variantId',
    auth: 'user',
    params: cartItemParamsSchema,
    body: updateCartItemSchema,
    handle: async ({ user, params, body }) => ({
      cart: await cartService.updateItem(
        user.id,
        params.variantId as number,
        (body as { quantity: number }).quantity,
      ),
    }),
  },
  {
    method: 'DELETE',
    path: '/api/cart/items/:variantId',
    auth: 'user',
    params: cartItemParamsSchema,
    handle: async ({ user, params }) => ({
      cart: await cartService.removeItem(user.id, params.variantId as number),
    }),
  },
  {
    method: 'DELETE',
    path: '/api/cart',
    auth: 'user',
    handle: async ({ user }) => ({ cart: await cartService.clearCart(user.id) }),
  },

  // --- orders -------------------------------------------------------------
  {
    method: 'POST',
    path: '/api/orders',
    auth: 'user',
    body: checkoutSchema,
    status: 201,
    handle: ({ user, body }) => ordersService.checkout(user.id, body as never),
  },
  {
    method: 'GET',
    path: '/api/orders/reviewable',
    auth: 'user',
    handle: async ({ user }) => ({
      items: await ordersService.getReviewableItems(user.id),
    }),
  },
  {
    method: 'GET',
    path: '/api/orders',
    auth: 'user',
    query: listOrdersSchema,
    handle: ({ user, query }) => ordersService.listOrders(user.id, query as never),
  },
  {
    method: 'GET',
    path: '/api/orders/:id',
    auth: 'user',
    params: idParamSchema,
    handle: async ({ user, params }) => ({
      order: await ordersService.getOrder(params.id as number, user),
    }),
  },
  {
    method: 'POST',
    path: '/api/orders/:id/cancel',
    auth: 'user',
    params: idParamSchema,
    handle: ({ user, params }) => ordersService.cancelOrder(params.id as number, user.id),
  },

  // --- reviews ------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/reviews/mine',
    auth: 'user',
    handle: async ({ user }) => ({ reviews: await reviewsService.listMyReviews(user.id) }),
  },
  {
    method: 'POST',
    path: '/api/reviews',
    auth: 'user',
    body: createReviewSchema,
    status: 201,
    handle: async ({ user, body }) => ({
      review: await reviewsService.createReview(user.id, body as never),
    }),
  },
  {
    method: 'DELETE',
    path: '/api/reviews/:id',
    auth: 'user',
    params: idParamSchema,
    status: 204,
    handle: async ({ user, params }) => {
      await reviewsService.deleteReview(params.id as number, user.id);
    },
  },

  // --- admin --------------------------------------------------------------
  {
    method: 'GET',
    path: '/api/admin/stats',
    auth: 'admin',
    handle: async () => ({ stats: await adminService.getDashboardStats() }),
  },
  {
    method: 'GET',
    path: '/api/admin/products',
    auth: 'admin',
    query: listAdminProductsSchema,
    handle: ({ query }) => adminService.listProducts(query as never),
  },
  {
    method: 'POST',
    path: '/api/admin/products',
    auth: 'admin',
    body: createProductSchema,
    status: 201,
    handle: ({ body }) => adminService.createProduct(body as never),
  },
  {
    method: 'PATCH',
    path: '/api/admin/products/:id',
    auth: 'admin',
    params: idParamSchema,
    body: updateProductSchema,
    handle: ({ params, body }) =>
      adminService.updateProduct(params.id as number, body as never),
  },
  {
    method: 'POST',
    path: '/api/admin/products/:id/delist',
    auth: 'admin',
    params: idParamSchema,
    handle: ({ params }) => adminService.delistProduct(params.id as number),
  },
  {
    method: 'POST',
    path: '/api/admin/products/:id/relist',
    auth: 'admin',
    params: idParamSchema,
    handle: ({ params }) => adminService.relistProduct(params.id as number),
  },
  {
    method: 'GET',
    path: '/api/admin/orders',
    auth: 'admin',
    query: listOrdersSchema,
    handle: ({ query }) => ordersService.listAllOrders(query as never),
  },
  {
    method: 'PATCH',
    path: '/api/admin/orders/:id/status',
    auth: 'admin',
    params: idParamSchema,
    body: updateOrderStatusSchema,
    handle: ({ params, body }) =>
      ordersService.updateOrderStatus(
        params.id as number,
        (body as { status: never }).status,
      ),
  },
];

/** Matches one path against one pattern, returning the raw param strings. */
function match(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (const [index, part] of patternParts.entries()) {
    const actual = pathParts[index] ?? '';
    if (part.startsWith(':')) {
      params[part.slice(1)] = decodeURIComponent(actual);
    } else if (part !== actual) {
      return null;
    }
  }
  return params;
}

/** Mirrors middleware/validate.ts: a Zod failure becomes a 400 with field paths. */
function parse(schema: ZodTypeAny, value: unknown): unknown {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestError(
        'Request validation failed',
        error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    throw error;
  }
}

/** Mirrors middleware/error.ts, so the client sees the shape it already parses. */
function toErrorResponse(error: unknown): DemoResponse {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
    };
  }

  console.error('Unhandled demo error:', error);
  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        ...(error instanceof Error ? { details: error.message } : {}),
      },
    },
  };
}

/**
 * Handles one request. `path` is the part after /api's mount, matching what
 * apiFetch builds — e.g. '/products/12?sort=newest'.
 */
export async function handleDemoRequest(
  method: string,
  url: string,
  body: unknown,
): Promise<DemoResponse> {
  try {
    const [rawPath = '', rawQuery = ''] = url.split('?');
    // Trailing slashes are the same route to Express; '/api/cart/' must not 404.
    const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath;

    for (const route of routes) {
      if (route.method !== method) continue;
      const rawParams = match(route.path, path);
      if (!rawParams) continue;

      const ctx: Context = {
        params: route.params ? (parse(route.params, rawParams) as never) : rawParams,
        query: route.query
          ? (parse(route.query, Object.fromEntries(new URLSearchParams(rawQuery))) as never)
          : {},
        body: route.body ? parse(route.body, body ?? {}) : body,
        user: undefined as never,
      };

      if (route.auth) {
        const user = getSessionUser();
        if (!user) throw new UnauthorizedError();
        if (route.auth === 'admin' && user.role !== 'admin') {
          throw new ForbiddenError('Admin access required');
        }
        ctx.user = user;
      }

      const result = await route.handle(ctx);

      // Every mutation reshapes the database, and sql.js only holds it in
      // memory — snapshot it so a reload doesn't lose the visitor's work.
      if (method !== 'GET') persist();

      const status = route.status ?? 200;
      return status === 204 ? { status, body: undefined } : { status, body: result };
    }

    throw new NotFoundError(`Cannot ${method} ${path}`);
  } catch (error) {
    return toErrorResponse(error);
  }
}
