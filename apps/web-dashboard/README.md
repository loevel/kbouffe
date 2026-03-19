# Kbouffe Web Dashboard

Dashboard web pour les restaurateurs, construit avec **Next.js 16** et déployé sur **Cloudflare Pages**.

## Stack

- **Next.js 16** — Framework React full-stack
- **React 19** — Avec React Compiler
- **Tailwind CSS 4** — Styling utilitaire
- **Zustand** — State management
- **SWR** — Data fetching
- **Framer Motion** — Animations
- **OpenNext.js** — Déploiement Cloudflare

## Structure

```
src/
├── app/
│   ├── (public)/         # Pages publiques
│   │   ├── page.tsx      # Landing page
│   │   ├── login/        # Connexion
│   │   ├── register/     # Inscription
│   │   └── pricing/      # Tarifs
│   ├── dashboard/        # Espace marchand
│   │   ├── page.tsx      # Vue d'ensemble
│   │   ├── orders/       # Commandes
│   │   ├── menu/         # Gestion menu
│   │   ├── reservations/ # Réservations
│   │   ├── customers/    # Clients
│   │   ├── marketing/    # Campagnes
│   │   ├── team/         # Équipe
│   │   └── settings/     # Paramètres
│   ├── admin/            # Administration plateforme
│   ├── api/              # API Routes
│   └── layout.tsx        # Layout racine
├── components/           # Composants React
├── lib/                  # Utilitaires
└── stores/               # Stores Zustand
```

## Installation

```bash
# Depuis la racine du monorepo
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés
```

## Développement

```bash
# Lancer le serveur de développement
npm run dev

# Le dashboard sera disponible sur http://localhost:3000
```

## Variables d'environnement

| Variable | Description | Côté |
|----------|-------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase | Serveur |
| `NEXT_PUBLIC_APP_URL` | URL de l'app | Client |

## Fonctionnalités

### Dashboard Marchand
- Vue d'ensemble (stats, graphiques)
- Gestion des commandes en temps réel
- Gestion du menu (catégories, produits)
- Gestion des réservations
- Gestion des clients (CRM)
- Campagnes marketing
- Gestion d'équipe
- Rapports et analytics
- Paramètres du restaurant

### Administration
- Gestion des restaurants
- Validation KYC
- Gestion des modules
- Statistiques globales

## Modules Utilisés

Le dashboard importe les composants UI des modules :

```typescript
import { OrdersTable } from "@kbouffe/module-orders/ui";
import { ProductForm } from "@kbouffe/module-catalog/ui";
import { ReservationCalendar } from "@kbouffe/module-reservations/ui";
```

## State Management

### Zustand Stores
```typescript
// stores/useOrderStore.ts
import { create } from 'zustand';

export const useOrderStore = create((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
}));
```

### SWR pour le data fetching
```typescript
import useSWR from 'swr';

function Orders() {
  const { data, error, isLoading } = useSWR('/api/orders');
  // ...
}
```

## Build & Déploiement

### Build local
```bash
npm run build
npm run start
```

### Déploiement Cloudflare
```bash
# Build pour Cloudflare Workers
npm run build:worker

# Preview locale
npm run preview

# Déployer
npm run deploy
```

## API Routes

Le dashboard expose des API Routes Next.js sous `/api/` :

| Route | Description |
|-------|-------------|
| `/api/auth/*` | Callbacks d'auth Supabase |
| `/api/upload` | Upload de fichiers |
| `/api/reports/*` | Génération de rapports |

## Composants UI

Le projet utilise des composants custom avec Tailwind :

```tsx
// Exemple de composant
import { cn } from "@/lib/utils";

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "px-4 py-2 bg-primary text-white rounded-lg",
        className
      )}
      {...props}
    />
  );
}
```

## Icons

Utilise **Lucide React** pour les icônes :

```tsx
import { ShoppingBag, Users, Settings } from "lucide-react";
```
