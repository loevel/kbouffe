# Kbouffe Modules

Modules métier partagés entre les applications Kbouffe. Chaque module expose une API (routes Hono) et des composants UI (React).

## Architecture

Chaque module suit la même structure :

```
module-name/
├── package.json
├── src/
│   ├── api/              # Routes Hono (backend)
│   │   └── index.ts      # Export des routes
│   └── ui/               # Composants React (frontend)
│       └── index.ts      # Export des composants
└── tsconfig.json
```

## Modules Disponibles

| Module | Description | Fonctionnalités |
|--------|-------------|-----------------|
| **core** | Fonctionnalités de base | Auth, Users, Stores, Upload, Security |
| **catalog** | Gestion du catalogue | Menu, Catégories, Produits |
| **orders** | Gestion des commandes | Commandes, Paiements, Zones de livraison |
| **reservations** | Réservations | Tables, Zones de salle, Créneaux |
| **crm** | Relation client | Customers, Historique |
| **marketing** | Marketing | Coupons, Ads, SMS, Campagnes |
| **hr** | Ressources humaines | Équipes, Payouts |
| **reports** | Rapports | Analytics, Exports |
| **chat** | Messagerie | Conversations, Messages |

## Utilisation

### Dans l'API (Backend)

```typescript
import { ordersApi } from "@kbouffe/module-orders";

const { ordersRoutes, paymentRoutes } = ordersApi;

// Monter les routes
app.route("/orders", ordersRoutes);
app.route("/payments", paymentRoutes);
```

### Dans le Dashboard (Frontend)

```typescript
import { OrderCard, OrdersTable } from "@kbouffe/module-orders/ui";

function OrdersPage() {
  return <OrdersTable orders={orders} />;
}
```

## Exports

Chaque module exporte via `package.json` :

```json
{
  "exports": {
    ".": "./src/api/index.ts",
    "./ui": "./src/ui/index.ts"
  }
}
```

- Import par défaut `@kbouffe/module-xxx` → API (routes Hono)
- Import UI `@kbouffe/module-xxx/ui` → Composants React

## Développement

### Créer un nouveau module

```bash
# Copier un module existant comme template
cp -r packages/modules/core packages/modules/new-module

# Mettre à jour package.json
# Nom: @kbouffe/module-new-module
```

### Structure d'un module

```typescript
// src/api/index.ts
import { Hono } from "hono";
import type { Env, Variables } from "api/src/types";

const routes = new Hono<{ Bindings: Env; Variables: Variables }>();

routes.get("/", async (c) => {
  // ...
});

export const myModuleApi = { routes };
```

```typescript
// src/ui/index.ts
export { MyComponent } from "./MyComponent";
export { MyOtherComponent } from "./MyOtherComponent";
```

## Dépendances Communes

Tous les modules partagent :

- **hono** — Framework web (API)
- **zod** — Validation de schémas
- **react** — UI (composants)
- **@supabase/supabase-js** — Client BDD

## Conventions

### Nommage
- Routes : `camelCase` (ex: `ordersRoutes`)
- Composants : `PascalCase` (ex: `OrderCard`)
- Types : `PascalCase` avec suffixe (ex: `OrderType`, `OrderInput`)

### Validation
Utiliser **Zod** pour valider les entrées :

```typescript
import { z } from "zod";

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })),
  deliveryAddress: z.string().optional(),
});
```

### Réponses API
Format standardisé :

```typescript
// Succès
c.json({ data: result });

// Erreur
c.json({ error: "Message d'erreur" }, 400);

// Liste paginée
c.json({
  data: items,
  pagination: { page, limit, total }
});
```
