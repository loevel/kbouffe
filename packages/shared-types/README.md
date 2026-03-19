# Kbouffe Shared Types

Types TypeScript partagés entre toutes les applications et modules Kbouffe.

## Installation

Ce package est automatiquement disponible dans le monorepo via les workspaces npm.

```typescript
import type { User, Store, Order } from "@kbouffe/shared-types";
```

## Types Principaux

### Entités

```typescript
// Utilisateur
interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "customer" | "merchant" | "admin";
  created_at: string;
}

// Restaurant
interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  address: string;
  phone: string;
  owner_id: string;
  is_active: boolean;
  modules: string[];
  created_at: string;
}

// Produit
interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

// Commande
interface Order {
  id: string;
  store_id: string;
  customer_id?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address?: string;
  notes?: string;
  created_at: string;
}

type OrderStatus = 
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";
```

### API Responses

```typescript
// Réponse standard
interface ApiResponse<T> {
  data: T;
  error?: never;
}

interface ApiError {
  data?: never;
  error: string;
}

// Pagination
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## Usage

```typescript
import type { User, Store, Order, ApiResponse } from "@kbouffe/shared-types";

// Dans une fonction
async function getOrders(): Promise<ApiResponse<Order[]>> {
  const response = await fetch("/api/orders");
  return response.json();
}

// Dans un composant
interface Props {
  store: Store;
  orders: Order[];
}
```

## Génération depuis Supabase

Les types peuvent être générés depuis le schéma Supabase :

```bash
npx supabase gen types typescript --project-id xxx > src/database.types.ts
```
