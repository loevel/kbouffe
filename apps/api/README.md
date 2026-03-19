# Kbouffe API

API REST backend pour la plateforme Kbouffe, construite avec **Hono** et déployée sur **Cloudflare Workers**.

## Stack

- **Hono 4.7** — Framework web ultra-rapide
- **Cloudflare Workers** — Exécution serverless edge
- **Supabase** — Base de données PostgreSQL + Auth
- **TypeScript 5** — Typage statique

## Architecture

```
src/
├── index.ts              # Point d'entrée, routes principales
├── types.ts              # Types Env & Variables
├── lib/                  # Utilitaires (SMS queue, etc.)
├── middleware/           # Auth, Admin, Module guards
└── modules/              # Routes spécifiques à l'app
    ├── admin/            # Administration plateforme
    ├── core/             # Notifications
    └── store/            # Dashboard, Restaurant, Public
```

## Modules Importés

L'API utilise les modules partagés de `packages/modules/` :

| Module | Routes exposées |
|--------|-----------------|
| `@kbouffe/module-core` | `/stores`, `/auth`, `/upload`, `/account`, `/security` |
| `@kbouffe/module-catalog` | `/menu`, `/categories`, `/products` |
| `@kbouffe/module-orders` | `/orders`, `/payments`, `/orders/zones` |
| `@kbouffe/module-reservations` | `/reservations`, `/tables`, `/zones` |
| `@kbouffe/module-crm` | `/customers` |
| `@kbouffe/module-marketing` | `/marketing`, `/ads`, `/coupons`, `/sms` |
| `@kbouffe/module-hr` | `/team`, `/payouts` |
| `@kbouffe/module-chat` | `/chat` |

## Installation

```bash
# Depuis la racine du monorepo
npm install

# Configurer les variables d'environnement
cp .env.example .dev.vars
# Éditer .dev.vars avec vos clés Supabase
```

## Développement

```bash
# Lancer le serveur de développement
npm run dev

# L'API sera disponible sur http://localhost:8787
```

## Endpoints

### Health Check
```
GET /
→ { "name": "Kbouffe API", "version": "1.0.0", "status": "ok" }
```

### Routes Publiques (sans auth)
- `GET /api/stores` — Liste des restaurants
- `GET /api/menu` — Menu d'un restaurant
- `POST /api/auth/login` — Authentification
- `POST /api/coupons/validate` — Valider un coupon
- `POST /api/sms` — Webhooks SMS

### Routes Marchands (auth requise)
- `/api/orders/*` — Gestion des commandes
- `/api/products/*` — Gestion des produits
- `/api/categories/*` — Gestion des catégories
- `/api/reservations/*` — Réservations
- `/api/dashboard/*` — Données du dashboard
- `/api/team/*` — Gestion d'équipe (module HR requis)
- `/api/marketing/*` — Campagnes (module marketing requis)

### Routes Admin
- `/api/admin/*` — Administration (rôle admin requis)

## Middlewares

| Middleware | Description |
|------------|-------------|
| `authMiddleware` | Vérifie le token JWT Supabase |
| `adminMiddleware` | Vérifie le rôle admin |
| `requireModule(name)` | Vérifie l'activation d'un module |

## Déploiement

```bash
# Déployer sur Cloudflare Workers
npm run deploy
```

### Configuration Wrangler

Le fichier `wrangler.toml` (non versionné) doit contenir :

```toml
name = "kbouffe-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
# Variables publiques ici

# Secrets à configurer via wrangler secret put
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

## Queue SMS

L'API utilise une Cloudflare Queue pour l'envoi différé de SMS :

```typescript
// Exemple d'ajout à la queue
await env.SMS_QUEUE.send({
  to: "+123456789",
  message: "Votre commande est prête"
});
```
