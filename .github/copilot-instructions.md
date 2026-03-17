# KBouffe — Project Guidelines

## Overview

KBouffe is a food ordering platform for Cameroon. Monorepo (npm workspaces) with 3 apps + 2 shared packages deployed on Cloudflare + Supabase Auth.

Architecture doc: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)

## Monorepo Structure

| Path | Stack | Purpose |
|------|-------|---------|
| `apps/api` | Hono on Cloudflare Workers | REST API (public + merchant + admin) |
| `apps/web-dashboard` | Next.js 16 + React 19 + Tailwind 4 | Merchant dashboard + public storefront |
| `apps/mobile-client` | Expo 54 + React Native 0.81 | Customer mobile app |
| `packages/db` | Drizzle ORM + D1 | Shared schemas, migrations, DB clients |
| `packages/shared-types` | TypeScript | Shared interfaces & enums |
| `tools/mcp-cloudflare` | Node.js MCP server | Cloudflare management tooling |

## Tech Stack

- **Runtime**: Cloudflare Workers (D1, R2, Queues)
- **API framework**: Hono (apps/api)
- **Web framework**: Next.js 16 with OpenNext for Cloudflare
- **Mobile**: Expo Router (file-based routing)
- **ORM**: Drizzle ORM with SQLite/D1
- **Auth**: Supabase Auth (JWT tokens, phone + password)
- **State**: Zustand (web), React Context + AsyncStorage (mobile)
- **Styling**: Tailwind CSS 4 (web), React Native StyleSheet (mobile)
- **Payments**: MTN Mobile Money (Collection + Disbursement APIs)

## Language & Locale

- All UI text, error messages, and API responses are in **French**.
- Code (variables, functions, comments) is in **English**.
- Currency is **FCFA** (integer, no decimals).

## Code Style

- TypeScript strict mode across all apps.
- ESM (`"type": "module"`) in api and db packages.
- Functional components only (React). No class components.
- Named exports preferred over default exports (except Next.js pages).
- Use `interface` over `type` for object shapes when possible.

## Database Architecture

Two-tier D1 database design:
- **Global Index** (`packages/db/src/schemas/global-index/`): Platform-wide data — restaurants, users, drivers, reviews, payouts, audit logs, support tickets, platform settings.
- **Restaurant Tenant** (`packages/db/src/schemas/restaurant/`): Per-restaurant data — categories, products, orders, tables, reservations, coupons (currently in Supabase, migrating to D1).

All schemas use Drizzle `sqliteTable`. IDs are UUIDs (`crypto.randomUUID()`). Timestamps use `integer` with `mode: "timestamp"`.

## API Conventions (apps/api)

- All business routes under `/api/*` prefix.
- Public routes: no auth middleware.
- Merchant routes: `authMiddleware` — resolves `userId`, `restaurantId`, `supabase` from JWT.
- Admin routes: `adminMiddleware` — checks `role === "admin"`, exposes `adminRole` for RBAC.
- Admin RBAC: `requireDomain(c, domain)` from `lib/admin-rbac.ts`. Sub-roles: `super_admin`, `support`, `sales`, `moderator`.
- Restaurant team RBAC: `hasPermission(role, permission)` from `lib/permissions.ts`. Roles: `owner > manager > cashier | cook | viewer`.
- Audit logging for admin write operations via `logAdminAction()`.
- Error responses: `{ error: "message in French" }` with appropriate HTTP status.

## User Roles

| Role | Platform role | Description |
|------|--------------|-------------|
| Client | `client` | End-user ordering food (mobile + web) |
| Merchant | `merchant` | Restaurant owner/staff managing their establishment |
| Driver | `livreur` | Delivery driver |
| Admin | `admin` | Platform administrator (sub-roles: super_admin, support, sales, moderator) |

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

# Database (Drizzle)
cd packages/db && npm run generate        # Generate migrations
cd packages/db && npm run migrate:local   # Apply to local D1
cd packages/db && npm run migrate:global  # Apply to remote D1
```

## Conventions

- Supabase used **only for auth** (JWT tokens) and **tenant data storage** (orders, products, categories — migrating to D1). Never for platform-wide data.
- D1 Global Index is the source of truth for users, restaurants, reviews, and platform analytics.
- R2 for image storage (dishes, logos). Max 5MB, JPEG/PNG/WebP/AVIF only.
- Cloudflare Queues for async SMS processing.
- MTN MoMo secrets set via `wrangler secret put`, never hardcoded.
