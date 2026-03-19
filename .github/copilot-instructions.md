# KBouffe — Project Guidelines

## Overview

KBouffe is a food ordering & restaurant management platform for Cameroon. Monorepo (npm workspaces) with 2 apps + 8 feature modules + 1 shared types package, deployed on Cloudflare Workers + Supabase.

## Monorepo Structure

| Path | Stack | Purpose |
|------|-------|---------|
| `apps/api` | Hono on Cloudflare Workers | REST API — orchestrates all modules, handles auth/CORS/middleware |
| `apps/web-dashboard` | Next.js 16 + React 19 + Tailwind 4 | Merchant dashboard + admin panel + public storefront |
| `apps/mobile-client` | Expo 54 + React Native 0.81 | Customer mobile app |
| `packages/modules/core` | Hono routes + React components | Auth, stores, users, upload, shared UI components, i18n, utilities |
| `packages/modules/catalog` | Hono routes + React components | Categories, products, menu |
| `packages/modules/orders` | Hono routes + React components | Orders, payments (MTN MoMo), delivery zones |
| `packages/modules/reservations` | Hono routes + React components | Reservations, tables, zones |
| `packages/modules/crm` | Hono routes + React components | Customer aggregation & analytics |
| `packages/modules/hr` | Hono routes + React components | Team management (RBAC), payouts |
| `packages/modules/marketing` | Hono routes + React components | Campaigns, coupons, ads (MTN), SMS |
| `packages/modules/chat` | Hono routes | Order-linked messaging, real-time via Supabase |
| `packages/shared-types` | TypeScript | Shared interfaces & enums |
| `tools/mcp-cloudflare` | Node.js MCP server | Cloudflare management tooling |

### Module Architecture

Each module under `packages/modules/` follows a consistent structure:

```
packages/modules/<name>/
├── src/
│   ├── api/          # Hono route handlers (business logic)
│   ├── ui/           # React components (dashboard UI)
│   │   └── components/  # Sub-components
│   ├── hooks/        # React hooks (data fetching with authFetch)
│   └── lib/          # Types, utilities
├── package.json      # Exports as @kbouffe/module-<name>
└── index.ts          # Public API barrel
```

- **`api/`**: Exports Hono route instances. Mounted by `apps/api/src/index.ts`.
- **`ui/`**: Exports React components. Consumed by `apps/web-dashboard`.
- **Core module** also exports shared UI primitives (`Button`, `Card`, `Modal`, `Table`, `Input`, etc.), `authFetch`, `format` utilities, i18n strings, and Supabase types.

## Tech Stack

- **Runtime**: Cloudflare Workers (R2, Queues)
- **Database**: Supabase PostgreSQL (sole database — all data)
- **API framework**: Hono (apps/api)
- **Web framework**: Next.js 16 with OpenNext for Cloudflare
- **Mobile**: Expo Router (file-based routing)
- **Auth**: Supabase Auth (JWT tokens, phone + password)
- **State**: Zustand (web), React Context + AsyncStorage (mobile)
- **Styling**: Tailwind CSS 4 (web), React Native StyleSheet (mobile)
- **Payments**: MTN Mobile Money (Collection + Disbursement APIs)
- **Image storage**: Cloudflare R2 (`kbouffe-images` bucket)
- **SMS**: Cloudflare Queues → MTN SMS API
- **Real-time**: Supabase Realtime (chat, notifications)

## Language & Locale

- All UI text, error messages, and API responses are in **French**.
- Code (variables, functions, comments) is in **English**.
- Currency is **FCFA / XAF** (integer, no decimals).
- i18n strings in `packages/modules/core/src/ui/i18n/{fr,en}.ts`.

## Code Style

- TypeScript strict mode across all apps.
- ESM (`"type": "module"`) in api and module packages.
- Functional components only (React). No class components.
- Named exports preferred over default exports (except Next.js pages).
- Use `interface` over `type` for object shapes when possible.
- Shared UI components live in `@kbouffe/module-core` (not in `apps/web-dashboard`).
- Data fetching in hooks uses `authFetch` from `@kbouffe/module-core`.

## Database Architecture


**Single database: Supabase PostgreSQL.** All data resides in Supabase:

### Performance Best Practices (Supabase/Postgres)

- **Index all foreign keys**: Every foreign key column must have a dedicated index to ensure optimal query performance, especially on large tables. Review linter/advisor output regularly and add missing indexes as needed.
	- Example: `CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);`
- **Monitor slow queries**: Use Supabase query analysis tools to identify and optimize slow queries.
- **Review query plans**: For complex queries, always check the execution plan (`EXPLAIN`) to avoid sequential scans on large tables.
- **Apply Supabase/Postgres best practices**: Follow the [Supabase Postgres Best Practices](https://supabase.com/docs/guides/database/database-linter) for schema design, indexing, and performance.

> **Note:** The project must regularly run the Supabase advisor/linter and apply all recommended performance optimizations, especially regarding foreign key indexes.

- `restaurants` — Restaurant profiles, settings, config
- `users` — User accounts, wallet, preferences
- `categories`, `products` — Menu catalog
- `orders`, `order_items`, `order_item_options` — Order management
- `payment_transactions` — MTN MoMo payment tracking
- `reservations`, `restaurant_tables`, `table_zones` — Reservation system
- `restaurant_members` — Team RBAC
- `coupons`, `coupon_uses`, `ad_campaigns` — Marketing
- `conversations`, `messages` — Chat system
- `reviews`, `support_tickets`, `payouts` — CRM & operations
- `wallet_movements`, `restaurant_favorites`, `product_favorites` — User engagement
- `addresses` — Delivery addresses
- `store_modules` — Feature toggles per restaurant
- `drivers` — Delivery drivers

IDs are UUIDs (`crypto.randomUUID()`). Timestamps are ISO strings.

## API Conventions (apps/api)

- All business routes under `/api/*` prefix.
- `apps/api` is the **orchestrator** — it imports route handlers from modules and applies middleware.
- Module `api/` directories contain **business logic only** (no auth, no CORS).
- Public routes: no auth middleware.
- Merchant routes: `authMiddleware` — resolves `userId`, `restaurantId`, `supabase` from JWT.
- Module-gated routes: `requireModule(moduleName)` — checks `store_modules` table.
- Admin routes: `adminMiddleware` — checks `role === "admin"`, exposes `adminRole` for RBAC.
- Admin RBAC: `requireDomain(c, domain)` from `lib/admin-rbac.ts`. Sub-roles: `super_admin`, `support`, `sales`, `moderator`.
- Restaurant team RBAC: `hasPermission(role, permission)` from module-hr `permissions.ts`. Roles: `owner > manager > cashier | cook | driver | viewer`.
- Error responses: `{ error: "message in French" }` with appropriate HTTP status.
- Success responses: `{ success: true, ...data }`.

## User Roles

| Role | Platform role | Description |
|------|--------------|-------------|
| Client | `client` | End-user ordering food (mobile + web) |
| Merchant | `merchant` | Restaurant owner/staff managing their establishment |
| Driver | `livreur` | Delivery driver |
| Admin | `admin` | Platform administrator (sub-roles: super_admin, support, sales, moderator) |

## Restaurant Team Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full access |
| `manager` | Orders, menu, team invites, reservations, marketing |
| `cashier` | Orders (view/update), payments |
| `cook` | Orders (view only, kitchen board) |
| `driver` | Deliveries assigned to them |
| `viewer` | Read-only access |

## Build & Dev Commands

```bash
# API (Cloudflare Worker)
cd apps/api && npm run dev        # wrangler dev
cd apps/api && npm run deploy     # wrangler deploy
cd apps/api && npm run lint       # tsc --noEmit

# Web Dashboard (Next.js)
cd apps/web-dashboard && npm run dev
cd apps/web-dashboard && npm run build:worker   # OpenNext Cloudflare build
cd apps/web-dashboard && npm run deploy

# Mobile Client (Expo)
cd apps/mobile-client && npm start
```

## Key Conventions

- **Supabase** is the sole database. All data lives in Supabase PostgreSQL.
- **R2** for image storage (dishes, logos, chat). Max 5MB, JPEG/PNG/WebP/AVIF only. Deduplication via SHA-256.
- **Cloudflare Queues** for async SMS processing (`kbouffe-sms-queue`).
- **MTN MoMo** secrets set via `wrangler secret put`, never hardcoded.
- **Supabase keys** (URL, anon key, service role key) set as Cloudflare Worker secrets.
- **Module gating**: Restaurants can enable/disable modules (reservations, marketing, hr) via `store_modules` table.
- **Shared UI**: All reusable components (`Button`, `Modal`, `Table`, etc.) live in `@kbouffe/module-core`, not duplicated across apps.
- **authFetch**: Centralized authenticated fetch utility in `@kbouffe/module-core/ui/lib/auth-fetch.ts`.

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| API | Cloudflare Workers | `https://kbouffe-api.davechendjou.workers.dev` |
| Dashboard | Cloudflare (OpenNext) | `https://kbouffe.com` |
| Images | Cloudflare R2 | `https://images.kbouffe.com` |
| Database | Supabase | PostgreSQL |
| Auth | Supabase | JWT-based |
