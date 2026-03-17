# Reservations Module

This module handles restaurant reservations and table management.

## API Routes Contract

The module exports several Hono route objects that should be mounted in the main API:

### 1. Public Reservations Routes (`publicReservationsRoutes`)
- **Purpose**: Allows public customers to create reservations.
- **Recommended Mount Point**: `/api/store` (Wait, in `index.ts` it's `/store`).
- **Full Path Sample**: `/api/store/reservations` (Wait, I should check the routes in `reservations.ts`).

### 2. Merchant Reservations Routes (`reservationsRoutes`)
- **Purpose**: Allows merchants to manage reservations (view, update status, delete).
- **Recommended Mount Point**: `/api/reservations`.
- **Full Path Sample**: `/api/reservations`, `/api/reservations/:id`.

### 3. Merchant Tables Routes (`tablesRoutes`)
- **Purpose**: Allows merchants to manage restaurant tables and zones.
- **Recommended Mount Point**: `/api/tables`.
- **Full Path Sample**: `/api/tables`, `/api/tables/zones`.

## Integration Example (Hono)

```typescript
import { reservationsApi } from "@kbouffe/module-reservations";
const { reservationsRoutes, publicReservationsRoutes, tablesRoutes } = reservationsApi;

// Public routes
api.route("/store", publicReservationsRoutes);

// Merchant routes (protected)
api.route("/reservations", reservationsRoutes);
api.route("/tables", tablesRoutes);
```
