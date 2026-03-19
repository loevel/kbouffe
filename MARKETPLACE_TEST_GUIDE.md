# 📋 Guide de Test Marketplace

## ✅ Éléments Implémentés

### 1. Base de Données
- ✅ Table `marketplace_services` créée avec 9 packs
- ✅ Table `marketplace_purchases` créée pour tracker les achats
- ✅ Migration 014 appliquée avec succès

### 2. APIs Créées

#### `GET /api/marketplace/services`
```bash
curl http://localhost:3000/api/marketplace/services
```
**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Pack Visibilité Top 3",
      "price": 15000,
      "duration_days": 7,
      "category": "visibility",
      "features": ["Position garantie dans le Top 3", ...],
      "is_active": true
    }
  ]
}
```

#### `POST /api/marketplace/purchase`
```bash
curl -X POST http://localhost:3000/api/marketplace/purchase \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth_cookie>" \
  -d '{
    "serviceId": "<service-id>",
    "restaurantId": "<restaurant-id>"
  }'
```

#### `GET /api/admin/marketplace/services`
Admin endpoint pour gérer les packs (RBAC requis)

#### `GET /api/admin/marketplace/purchases`
Admin endpoint pour voir les achats (RBAC requis)

---

## 🧪 Flux de Test Complets

### Test 1: Restaurateur Consulte les Packs
1. Aller à `/dashboard/marketplace`
2. ✅ Les 9 packs doivent charger
3. ✅ Voir les 3 sections (Essentiels, Premium, Engagement)
4. ✅ Voir la bannière de comparaison

### Test 2: Restaurateur Achète un Pack
1. Cliquer "Acheter ce pack" sur un pack
2. ✅ Modal de confirmation apparaît
3. ✅ Voir le résumé du pack et le prix
4. ✅ Cliquer "Confirmer l'achat"
5. ✅ Voir message de succès "Pack activé avec succès ✨"
6. ✅ Vérifier dans DB: nouvelle ligne dans `marketplace_purchases`

### Test 3: Admin Voit les Achats
1. Aller à `/admin/marketplace`
2. ✅ Voir l'onglet "Achats"
3. ✅ Afficher tous les achats effectués
4. ✅ Voir restaurant_id, service_id, status, date
5. ✅ Pouvoir annuler un achat actif

### Test 4: Admin Gère les Services
1. Aller à `/admin/marketplace`
2. ✅ Onglet "Catalogue" affiche les 9 packs
3. ✅ Pouvoir activer/désactiver un pack
4. ✅ Pouvoir modifier un pack (nom, prix, features)
5. ✅ Pouvoir créer un nouveau pack
6. ✅ Pouvoir supprimer un pack (sans achats actifs)

---

## 🔌 Connecteurs Vérifiés

- [x] Dashboard → API `/api/marketplace/services` ✅
- [x] Dashboard → Modal d'achat → API `/api/marketplace/purchase` ✅
- [x] Admin Marketplace → API `/api/admin/marketplace/services` ✅
- [x] Admin Marketplace → API `/api/admin/marketplace/purchases` ✅
- [x] Supabase RLS policies configurées ✅
- [x] Features en JSONB dans les services ✅

---

## 📊 Data Snapshot

**9 Packs en BD:**
```
1. Pack Visibilité Top 3 (15K FCFA, 7j) - Essentiels
2. Campagne Push SMS (25K FCFA, permanent) - Essentiels
3. Pack Boost Continu (50K FCFA, 30j) - Essentiels
4. Pack Premium Dominance (150K FCFA, 30j) - Premium
5. Pack Visibilité Weekend (20K FCFA, 2j) - Premium
6. Pack Gallery Boost (35K FCFA, 15j) - Premium
7. Pack Avis & Réputation (40K FCFA, 30j) - Engagement
8. Pack Fidélité+ (50K FCFA, 30j) - Engagement
9. Pack Social Amplifier (45K FCFA, 30j) - Engagement
```

---

## 🚨 Checklist Finale

- [ ] Tester chaque endpoint avec des données réelles
- [ ] Vérifier les notifications de succès/erreur
- [ ] Tester les cas limites (auth, permissions, données invalides)
- [ ] Vérifier les durées d'expiration des packs
- [ ] Tester les stats dashboard (revenue, achats actifs)
- [ ] Vérifier les logs audit dans admin

---

## 🎯 Prochaines Étapes Optionnelles

1. **Intégration Paiement** - Connecter à MTN, Orange Money, etc.
2. **Email de Confirmation** - Envoyer confirmation d'achat au restaurant
3. **Webhooks** - Notifier quand un pack expire
4. **Analytics** - Dashboard revenue par pack, conversion rates
5. **A/B Testing** - Tester différentes offres/prix par zone
