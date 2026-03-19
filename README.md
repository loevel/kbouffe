# Kbouffe Platform

Plateforme SaaS de gestion pour restaurants avec application mobile client et dashboard web marchand.

## Architecture

```
kbouffe.com/
├── apps/
│   ├── api/                 # API Hono (Cloudflare Workers)
│   ├── mobile-client/       # App mobile Expo (React Native)
│   └── web-dashboard/       # Dashboard Next.js
├── packages/
│   ├── shared-types/        # Types TypeScript partagés
│   └── modules/             # Modules métier réutilisables
│       ├── core/            # Auth, Users, Stores, Upload
│       ├── catalog/         # Menu, Catégories, Produits
│       ├── orders/          # Commandes, Paiements, Livraison
│       ├── reservations/    # Réservations, Tables, Zones
│       ├── crm/             # Gestion clients
│       ├── marketing/       # Coupons, Ads, SMS, Campagnes
│       ├── hr/              # Équipes, Payouts
│       ├── reports/         # Rapports et analytics
│       └── chat/            # Messagerie
└── tools/                   # Outils de développement
```

## Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Mobile** | Expo 54, React Native 0.81, React 19 |
| **Web** | Next.js 16, React 19, Tailwind CSS 4 |
| **API** | Hono 4.7 (Cloudflare Workers) |
| **Base de données** | Supabase (PostgreSQL) |
| **Déploiement** | Cloudflare Workers, OpenNext.js |
| **Monorepo** | Turborepo + npm workspaces |
| **Langage** | TypeScript 5 |

## Prérequis

- **Node.js** >= 20.x
- **npm** >= 10.x
- Compte **Supabase** (pour la BDD)
- Compte **Cloudflare** (pour le déploiement)

## Installation

```bash
# Cloner le projet
git clone https://github.com/your-org/kbouffe.com.git
cd kbouffe.com

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp apps/api/.env.example apps/api/.dev.vars
cp apps/mobile-client/.env.example apps/mobile-client/.env
cp apps/web-dashboard/.env.example apps/web-dashboard/.env.local
```

## Développement

```bash
# Lancer toutes les apps en parallèle
npm run dev

# Ou individuellement :
cd apps/api && npm run dev           # API sur http://localhost:8787
cd apps/mobile-client && npm start   # App Expo
cd apps/web-dashboard && npm run dev # Dashboard sur http://localhost:3000
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance toutes les apps en mode dev |
| `npm run build` | Build de production de toutes les apps |
| `npm run lint` | Lint de tout le monorepo |
| `npm run test` | Lance les tests |

## Structure des Modules

Chaque module dans `packages/modules/` expose :
- `./src/api/` — Routes Hono (backend)
- `./src/ui/` — Composants React (frontend)

### Exemple d'import

```typescript
// API
import { ordersApi } from "@kbouffe/module-orders";
const { ordersRoutes, paymentRoutes } = ordersApi;

// UI
import { OrderCard } from "@kbouffe/module-orders/ui";
```

## API Endpoints

L'API est accessible sur `/api/*`. Principales routes :

### Routes Publiques
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stores` | Liste des restaurants |
| GET | `/api/menu` | Menu d'un restaurant |
| POST | `/api/auth/login` | Authentification |
| POST | `/api/coupons/validate` | Valider un coupon |

### Routes Authentifiées (Marchand)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | `/api/orders` | Gestion des commandes |
| GET/POST | `/api/products` | Gestion des produits |
| GET/POST | `/api/reservations` | Gestion des réservations |
| GET | `/api/dashboard` | Données du tableau de bord |
| POST | `/api/upload` | Upload de fichiers |

### Routes Admin
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| * | `/api/admin/*` | Administration plateforme |

## Variables d'environnement

### API (`apps/api/.dev.vars`)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Mobile (`apps/mobile-client/.env`)
```env
EXPO_PUBLIC_API_URL=http://localhost:8787
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Dashboard (`apps/web-dashboard/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Déploiement

### API (Cloudflare Workers)
```bash
cd apps/api
npm run deploy
```

### Dashboard (Cloudflare Pages via OpenNext)
```bash
cd apps/web-dashboard
npm run build:worker
npm run deploy
```

### Mobile (Expo)
```bash
cd apps/mobile-client
eas build --platform all
eas submit
```

## Conventions

### Commits
Utiliser les [Conventional Commits](https://www.conventionalcommits.org/) :
```
feat(orders): add delivery tracking
fix(auth): resolve token refresh issue
docs: update README
```

### Branches
- `main` — Production
- `develop` — Développement
- `feature/*` — Nouvelles fonctionnalités
- `fix/*` — Corrections de bugs

## Licence

Propriétaire - Tous droits réservés.
