# Migrations jamais appliquées à la production

Ces fichiers étaient numérotés `014_marketplace.sql` et
`017_create_marketplace_packs_table.sql` dans `supabase/migrations/`, en
conflit avec les vraies migrations `014` et `017` déjà appliquées
(`014_marketplace_services_and_purchases.sql`, qui utilise un schéma
différent : `marketplace_services` + `marketplace_purchases`).

## Pourquoi ils sont archivés ici (2026-08-05)

Vérification directe sur le projet Supabase `kbouffe`
(`wkuyuiypkbgsftgtstra`) :

- Aucune des tables `marketplace_packs`, `restaurant_pack_subscriptions`
  n'existe en production.
- Le type `marketplace_pack_type` n'existe pas non plus.
- Le vrai schéma marketplace en prod est `marketplace_services` (catalogue,
  slug unique) + `marketplace_purchases` (achats par restaurant), défini par
  `014_marketplace_services_and_purchases.sql`.

Ces fichiers décrivaient donc un schéma parallèle qui n'a jamais été exécuté
contre la base réelle. Les garder actifs dans `supabase/migrations/` est
dangereux :
- Numérotation dupliquée avec les vraies migrations `014`/`017`.
- `20260325_premium_storefront.sql` contenait `ALTER TYPE
  marketplace_pack_type ADD VALUE 'premium_storefront'` — qui échoue
  puisque ce type n'existe pas (corrigé, cf. ce fichier).
- Toute tentative de `supabase db reset` en local aurait pu créer des tables
  fantômes absentes de la prod, source de bugs difficiles à diagnostiquer.

## Que faire de ces fichiers

Aucun code applicatif (`src/`) ne référence `marketplace_packs`,
`restaurant_pack_subscriptions` ou `marketplace_pack_type` — ils sont donc
sans danger à conserver ici pour l'historique, ou à supprimer définitivement
si vous confirmez qu'ils ne correspondent à aucun besoin futur.
