# Marketplace Module - Corrections et Améliorations

## Problèmes Identifiés et Corrigés

### 1. **Incohérence de structure de données**
- **Problème**: Routes Next.js utilisaient `marketplace_services`/`marketplace_purchases` tandis que le module Hono utilisait `marketplace_packs`/`restaurant_pack_subscriptions`
- **Solution**: Aligné les routes Next.js pour utiliser la même structure que le module Hono

### 2. **Erreurs de requête Supabase**
- **Problème**: Double `.order()` dans `public.ts` ligne 21-22
- **Solution**: Consolidé en un seul appel `.order()` avec `is_featured` en priorité

### 3. **Champs manquants dans la création de pack**
- **Problème**: `POST /admin/marketplace/packs` ne gérait pas `limits`, `badge_color`, `image_url`, `is_featured`
- **Solution**: Ajouté support complet pour tous les champs de `MarketplacePack`

### 4. **Gestion des erreurs dans les webhooks**
- **Problème**: Cherchait un champ `marketplace_subscription_id` qui n'existe pas
- **Solution**: Remplacé par un appel RPC `marketplace_cancel_on_payment_failure`

### 5. **Typage et validation**
- **Problème**: Pas de validation des payloads
- **Solution**: Ajouté `validation.ts` avec fonctions de validation type-safe

### 6. **Erreurs dupliquées**
- **Problème**: Messages d'erreur et codes répétés dans chaque route
- **Solution**: Créé `errors.ts` avec classe `MarketplaceError` centralisée

### 7. **Middleware manquant**
- **Problème**: Duplication de logique d'authentification/autorisation
- **Solution**: Créé `middleware.ts` avec helpers pour `requireAuth()`, `requireAdmin()`, etc.

## Fichiers Modifiés

- `src/api/public.ts` - Correction du double `.order()`
- `src/api/merchant.ts` - Ajout validation et meilleur gestion d'erreurs
- `src/api/admin.ts` - Support complet des champs, validation type
- `src/api/webhooks.ts` - Utilisation RPC au lieu de requête directe
- `src/lib/index.ts` - Exports des validations et erreurs
- `apps/web-dashboard/src/app/api/marketplace/purchase/route.ts` - Alignement avec le module
- `apps/web-dashboard/src/app/api/marketplace/services/route.ts` - Correction table/champs

## Fichiers Ajoutés

- `src/lib/validation.ts` - Validations type-safe pour tous les payloads
- `src/lib/errors.ts` - Classe d'erreur centralisée et constantes
- `src/api/middleware.ts` - Helpers pour authentification/autorisation
- `FIXES.md` - Ce document

## Prochaines Étapes Recommandées

1. Tester toutes les routes avec des payloads valides/invalides
2. Vérifier que les stored procedures sont correctement implémentées en BD
3. Ajouter des tests unitaires pour les validations
4. Documenter les endpoints dans un fichier API.md
5. Refactoriser les routes pour utiliser le middleware (optionnel)
