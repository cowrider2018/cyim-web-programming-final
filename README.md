# Maisie — 飾品電商 Storefront

A full-stack jewellery storefront: **React + TypeScript** on the front, **Express + SQLite (Drizzle ORM)** on the back, in a typed npm workspaces monorepo.

> This began as a university JSP/Servlet + MySQL final project and was rebuilt from the ground up. The product catalogue, imagery, and domain were kept; the architecture, data model, and security were not. See [What changed and why](#what-changed-and-why).

---

## Features

**Storefront**
- Category browsing, keyword search, sorting, and pagination — all filter state lives in the URL, so results are shareable and the back button works
- Product pages with variants (金色 / 銀色 / 標準), image gallery, live stock, and verified reviews
- Cart with per-variant stock enforcement
- Checkout with server-computed totals and shipping
- Order history, order detail, and self-service cancellation (which returns stock)

**Accounts**
- Register / login with bcrypt-hashed passwords and httpOnly JWT cookies
- Profile editing and password change (requires the current password)
- Reviews restricted to items the user actually bought and received — one review per purchased line item

**Admin** (`admin@maisie.tw`)
- Dashboard: revenue, order counts, low-stock alerts, best sellers
- Product CRUD with a variant editor; delisting is a soft delete so order history stays intact
- Order management with an enforced status state machine

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | Fast dev loop, strict typing end to end |
| Routing | React Router 6 | Nested layouts and route guards |
| Server state | TanStack Query | Caching and invalidation without hand-rolled state |
| Styling | Tailwind CSS 4 | Original design reproduced as shared tokens instead of per-page CSS |
| API | Express 4, TypeScript | Explicit, readable REST layer |
| Database | SQLite via better-sqlite3 | Zero-setup, synchronous, real transactions |
| ORM | Drizzle | Typed schema and SQL-first queries with generated migrations |
| Validation | Zod | One schema validates and types each request |
| Auth | JWT in an httpOnly cookie | Not reachable from JavaScript, so XSS can't lift the token |

---

## Getting started

Requires Node 20+.

```bash
git clone <repo-url>
cd cyim-web-programming-final
npm install

# Configure the server
cp .env.example server/.env
# Generate a signing secret and paste it into server/.env as JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Create and seed the database
npm run db:migrate
npm run db:seed

# Run the API (:4000) and the web app (:5173) together
npm run dev
```

Open **http://localhost:5173**.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `asd1234@gmail.com` | `password1234` |
| Admin | `admin@maisie.tw` | `admin1234` |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | API + web together |
| `npm run build` | Typecheck and build both workspaces |
| `npm run typecheck` | Typecheck without emitting |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Reset content and reseed the catalogue |
| `npm run db:reset` | Delete the SQLite file (then migrate + seed) |
| `npm run db:generate --workspace server` | Generate a migration from schema changes |

---

## Architecture

```
├── server/
│   └── src/
│       ├── app.ts              # Express app assembly
│       ├── env.ts              # Zod-validated environment (fails fast)
│       ├── db/
│       │   ├── schema.ts       # Drizzle schema — the single source of truth
│       │   ├── migrations/     # Generated SQL
│       │   └── seed.ts         # Catalogue seed, images resolved from disk
│       ├── lib/                # errors, password hashing, JWT
│       ├── middleware/         # auth, validation, error handling
│       └── modules/            # auth · catalog · cart · orders · reviews · admin
│           └── <module>/       #   .routes.ts → .service.ts → .schema.ts
└── web/
    └── src/
        ├── lib/                # typed fetch client, shared types, formatting
        ├── context/            # auth provider
        ├── hooks/              # one hook per API resource
        ├── components/         # layout and shared UI
        └── pages/              # route components
```

**Request flow:** `route → validate(zod) → service → drizzle → sqlite`

Routes stay thin: they validate input and shape responses. Services own business rules and are the only place that touches the database. Errors are thrown as typed `HttpError` subclasses and rendered by one error middleware, so no route hand-writes an error response.

### Data model

```
users ──< orders ──< order_items >── variants >── products >── categories
  │         │                            │            │
  │         └──< reviews >───────────────┘            └──< product_images
  └──< cart_items >──────────────────────┘
```

Notable decisions:

- **Money is stored as integer New Taiwan dollars.** TWD is zero-decimal in practice, and integers keep arithmetic exact. The original used `DECIMAL` read back through Java `double`.
- **Order lines snapshot name and price.** Editing a product later must not silently rewrite past invoices.
- **`order_items.variant_id` is `RESTRICT`.** A variant that has been sold can't be deleted, only zeroed out.
- **Foreign keys are switched on explicitly.** SQLite ignores them per-connection by default.

---

## What changed and why

The original was a working student project. It also had problems worth being explicit about, since fixing them is most of what this rewrite is:

| Original | Now |
|---|---|
| Passwords stored as plaintext `VARCHAR(16)` | bcrypt, cost 12 |
| Full credit card number written to the orders table | Only the last four digits are ever persisted |
| Admin was `if (userID != 10000000)` | A `role` column, checked by middleware on every admin route |
| DB credentials hardcoded in ~14 JSP files | One Zod-validated env module that fails fast on boot |
| Checkout ran 4 unguarded statements; stock could go negative and be oversold | One transaction with an atomic `stock >= quantity` guard |
| Anyone could POST a review for any product | Reviews require a matching shipped order line, enforced server-side |
| Delisting ran `DELETE FROM Item`, orphaning past orders | Soft delete via `is_active` |
| SQL, business logic, and HTML interleaved in JSP scriptlets | Routes → services → ORM, with a typed React client |
| Per-page CSS, fixed widths, no focus styles | The same look reconstructed as shared tokens — now responsive, with visible focus rings and reduced-motion support |

The visual design is deliberately kept faithful to the original: the italic *Maisie*
wordmark, the warm taupe/beige palette, the hero with the rotating "New!" showcase,
the outlined search box, the beige review board, and the grey member-area tabs are all
reproduced from the original JSP stylesheets. Only the implementation changed.

The stock bug is the one worth demoing: two people buying the last item concurrently both used to succeed. Now the second checkout matches zero rows on the guarded `UPDATE` and the whole transaction rolls back.

---

## Verification

The API and every page were exercised end to end during development — registration, the stock guard, the checkout transaction, the review gate, admin authorisation, and the order state machine. What the flow proves, concretely:

- Adding 2 of a 5-stock variant, then 5 more, is rejected with `422` and the remaining count
- Placing that order decrements stock 5 → 3, empties the cart, and stores only `cardLast4`
- Reviewing before the order ships is rejected; after it ships it succeeds, and a second attempt returns `409`
- A customer hitting `/api/admin/*` gets `403`; the SPA route guard also redirects
- `paid → completed` is rejected as an illegal transition; `paid → shipped → completed` is allowed

There is no automated test suite yet — that is the honest next step, and the service layer was structured to make it straightforward.

---

## Possible next steps

- Vitest + Supertest coverage for the service layer, starting with the checkout transaction
- Rate limiting on `/api/auth/*`
- Real payment integration (currently the card is validated and discarded by design)
- Product image upload rather than seeding from `web/public/images`
- Dockerfile and CI

---

## Licence

Educational project. Product imagery belongs to the original coursework; not a real shop.
