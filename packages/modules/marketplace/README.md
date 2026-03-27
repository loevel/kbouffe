# @kbouffe/module-marketplace

Module Marketplace pour KBouffe. Permet aux restaurants d'acheter des packs de services (visibilité, publicité, SMS blast, etc.) créés et gérés par les administrateurs.

## Features

- **Catalogue de packs** : Packs de visibilité, publicité, SMS blast, analytics avancés, etc.
- **Souscriptions** : Restaurants peuvent acheter des packs avec paiement MTN MoMo
- **Gestion admin** : Création, modification et désactivation des packs par les admins
- **Webhooks** : Intégration avec MTN MoMo pour confirmer les paiements
- **Bénéfices automatiques** : Application/révocation auto des avantages (sponsorisation, budget ads, SMS, etc.)
- **Fonctions SQL** : Stored procedures pour l'entièreté de la logique métier

## Structures & Routes

### Routes Publiques (`/api/marketplace`)

- `GET /packs` — Liste des packs actifs
- `GET /packs/:id` — Détail d'un pack

### Routes Merchant (`/api/marketplace`)

Réservées aux propriétaires de restaurants authentifiés.

- `GET /my-packs` — Souscriptions actives du restaurant
- `GET /subscriptions` — Toutes les souscriptions du restaurant
- `POST /purchase` — Initier l'achat d'un pack (crée sub + transaction)
- `POST /cancel/:subscriptionId` — Annuler une souscription en attente

### Routes Admin (`/api/admin/marketplace`)

Réservées aux utilisateurs avec le rôle `admin`.

- `GET /packs` — Tous les packs (actifs et inactifs)
- `POST /packs` — Créer un pack
- `PUT /packs/:id` — Modifier un pack
- `DELETE /packs/:id` — Désactiver un pack
- `GET /subscriptions` — Toutes les souscriptions (filtrable par status)
- `POST /subscriptions/:id/refund` — Rembourser une souscription

### Webhooks (`/api/marketplace/webhook`)

- `POST /mtn` — Callback MTN MoMo pour confirmation de paiement

## Types

```typescript
interface MarketplacePack {
  id: string;
  name: string;
  slug: string;
  type: 'visibility' | 'advertising' | 'boost_menu' | 'sms_blast' | 'premium_analytics' | 'priority_support' | 'featured_banner' | 'extra_storage';
  price: number; // FCFA
  duration_days: number;
  is_active: boolean;
  features: Array<{ key: string; label: string; value: string | number }>;
  limits: Record<string, any>;
  // ... autres champs
}

interface RestaurantPackSubscription {
  id: string;
  restaurant_id: string;
  pack_id: string;
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled' | 'refunded';
  price_paid: number;
  currency: string;
  starts_at: string | null;
  expires_at: string | null;
  // ... autres champs
}
```

## Stored Procedures (Supabase)

1. **`marketplace_initiate_purchase`** — Crée une souscription + transaction paiement
2. **`marketplace_confirm_payment`** — Confirme le paiement et active le pack
3. **`marketplace_apply_pack_benefits`** — Applique les bénéfices du pack
4. **`marketplace_revoke_pack_benefits`** — Révoque les bénéfices
5. **`marketplace_expire_packs`** — Expire les packs (appelée par cron job)
6. **`get_active_packs_for_restaurant`** — Récupère les packs actifs d'un restaurant

## Seed Data

10 packs de seed sont inclus dans la migration :

| Slug | Type | Nom | Prix | Durée |
|------|------|-----|------|-------|
| `visibility-starter` | visibility | Pack Visibilité Starter | 5 000 FCFA | 7j |
| `visibility-pro` | visibility | Pack Visibilité Pro | 15 000 FCFA | 30j |
| `visibility-premium` | visibility | Pack Visibilité Premium | 25 000 FCFA | 30j |
| `ads-starter` | advertising | Pack Pub Starter | 10 000 FCFA | 30j |
| ... | ... | ... | ... | ... |

## Configuration

Aucune configuration spéciale nécessaire. Le module Marketplace est automatiquement montée dans `apps/api/src/index.ts`.

## Intégration avec MTN MoMo

1. Le merchant clique sur "Acheter" pour un pack
2. L'API initie une souscription + transaction paiement
3. Le client reçoit une demande MTN MoMo
4. Une fois payé, MTN envoie un webhook POST à `/api/marketplace/webhook/mtn`
5. La stored procedure `marketplace_confirm_payment` confirme et active le pack
6. Les bénéfices sont appliqués automatiquement

### Clé du webhook

Définie via Cloudflare Worker secret : `MARKETPLACE_WEBHOOK_SECRET`

```bash
wrangler secret put MARKETPLACE_WEBHOOK_SECRET
# Entrer la clé secrète
```

## Notes

- Toutes les durées de pack sont en jours
- Les prix sont en FCFA (entier, pas de décimales)
- Les souscriptions expirent automatiquement via cron job `marketplace-expire-packs` (toutes les heures)
- Les packs abandonns (pending_payment >48h) sont annulés automatiquement
- Les bénéfices appliqués dépendent du type de pack (ex: `visibility` → sponsorisation)
