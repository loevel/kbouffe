# 🚀 Checklist de déploiement — KDS Optimization

## Phase 1: Infrastructure Supabase

### ✅ Migration Database

- [ ] Lire `KITCHEN_VIEW_OPTIMIZATION.md` pour comprendre l'architecture
- [ ] Exécuter la migration:
  ```bash
  npx supabase db push
  ```
  Ou copier le contenu de `supabase/migrations/015_kds_optimization.sql` dans le Dashboard Supabase
- [ ] Vérifier que les fonctions sont créées:
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_name LIKE 'order_%' OR routine_name LIKE '%kds%';
  ```
- [ ] Vérifier que les vues existent:
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_name IN ('vw_kds_orders', 'kds_active_orders', 'kds_notifications');
  ```

### ✅ Realtime sur kds_notifications

- [ ] Vérifier que `kds_notifications` est activée dans Realtime:
  ```sql
  SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  ```
- [ ] Si absent, activer:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE kds_notifications;
  ```

### ✅ Extension pg_cron (optionnel mais recommandé)

Pour la détection automatique d'urgence toutes les minutes:

- [ ] Vérifier si pg_cron est actif:
  ```sql
  SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';
  ```
- [ ] Activer si nécessaire:
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  ```
- [ ] Créer le job de vérification:
  ```sql
  SELECT cron.schedule(
    'check-urgent-orders',
    '*/1 * * * *',
    'SELECT check_and_notify_urgent_orders();'
  );
  ```
- [ ] Vérifier le job:
  ```sql
  SELECT * FROM cron.job;
  ```

---

## Phase 2: Edge Functions

### ✅ Déployer kds-notify

- [ ] Vérifier les fichiers partagés:
  ```bash
  ls -la supabase/functions/_shared/
  # Doit contenir: cors.ts, supabase.ts
  ```

- [ ] Déployer la fonction:
  ```bash
  npx supabase functions deploy kds-notify
  ```

- [ ] Tester localement:
  ```bash
  npx supabase functions serve
  curl http://localhost:54321/functions/v1/kds-notify \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"action":"check_urgent"}'
  ```

- [ ] Vérifier le déploiement:
  ```bash
  npx supabase functions list
  ```

### ✅ Configurer Database Webhook (optionnel)

Dans Supabase Dashboard → Database Webhooks:

1. [ ] Créer un nouveau webhook
2. [ ] **Configuration:**
   - Table: `kds_notifications`
   - Events: INSERT
   - HTTP Method: POST
   - URL: `https://<PROJECT>.supabase.co/functions/v1/kds-notify`
   - Headers:
     ```
     Authorization: Bearer <JWT_SECRET>
     Content-Type: application/json
     ```

3. [ ] Tester en créant une commande:
   ```sql
   INSERT INTO orders (restaurant_id, customer_name, status, items, ...)
   VALUES ('...', 'Test', 'pending', '[]', ...);
   ```
   Le webhook devrait être appelé immédiatement. Vérifier les logs dans Dashboard → Functions.

---

## Phase 3: Code Client

### ✅ KitchenBoard.tsx

- [ ] Vérifier que le fichier utilise `KdsOrder` interface:
  ```bash
  grep -n "interface KdsOrder" packages/modules/orders/src/ui/KitchenBoard.tsx
  ```

- [ ] Vérifier le fallback pour elapsed_minutes:
  ```bash
  grep -n "order.elapsed_minutes" packages/modules/orders/src/ui/KitchenBoard.tsx
  ```

- [ ] Vérifier le fallback pour is_urgent:
  ```bash
  grep -n "order.is_urgent" packages/modules/orders/src/ui/KitchenBoard.tsx
  ```

- [ ] S'abonner à kds_notifications pour les notifications bonus:
  ```bash
  grep -n "kds_notifications" packages/modules/orders/src/ui/KitchenBoard.tsx
  ```

### ✅ useOrders hook

- [ ] Vérifier que refreshInterval est configuré:
  ```bash
  grep -n "refreshInterval" packages/modules/orders/src/hooks/use-orders.ts
  ```
  Attendu: `refreshInterval: 30_000`

### ✅ NotificationsForm.tsx

- [ ] Vérifier que soundEnabled persiste en localStorage:
  ```bash
  grep -n "localStorage" apps/web-dashboard/src/components/dashboard/settings/NotificationsForm.tsx
  ```

---

## Phase 4: Tests

### ✅ Test local

```bash
npm run dev
```

1. [ ] Ouvrir `http://localhost:3000` (ou votre port)
2. [ ] Se connecter au dashboard
3. [ ] Ouvrir `/dashboard/kitchen` (KDS)

### ✅ Test 1: Réception de commande en temps réel

1. [ ] Ouvrir KDS sur un onglet
2. [ ] Créer une commande depuis le storefront (autre onglet)
3. [ ] Attendre <1 secondes
4. [ ] Vérifier:
   - [ ] Commande apparaît dans la colonne "Pending"
   - [ ] Minuteur affiche un nombre > 0
   - [ ] Son joue (si `kitchen_sound_enabled = true` en localStorage)
   - [ ] Notification navigateur s'affiche

### ✅ Test 2: Urgence (wait threshold)

1. [ ] Aller à Settings → Notifications
2. [ ] Changer "Seuil d'alerte" à 1 minute
3. [ ] Sauvegarder
4. [ ] Créer une commande
5. [ ] Attendre 1 minute (ou avancer l'horloge système)
6. [ ] Vérifier:
   - [ ] Carte affiche un ring orange autour
   - [ ] `is_urgent` est `true` dans vw_kds_orders
   - [ ] Notification "Commande en attente" est envoyée

### ✅ Test 3: Auto-refresh minuteur

1. [ ] Créer une commande
2. [ ] Observer le minuteur pendant 2-3 minutes
3. [ ] Vérifier:
   - [ ] Pas de refresh manuel nécessaire
   - [ ] Minuteur s'incrémente toutes les ~60 secondes
   - [ ] (Optionnel: vérifier dans le code que `tick` state force un re-render)

### ✅ Test 4: Fallback polling

1. [ ] Ouvrir DevTools → Network
2. [ ] Observer les requêtes `/api/orders`
3. [ ] Attendre 30 secondes
4. [ ] Vérifier:
   - [ ] Une requête automatique toutes les ~30 secondes
   - [ ] Réponse contient les données KDS

### ✅ Test 5: Changement de seuil appliqué

1. [ ] Settings → Notifications
2. [ ] Changer "Seuil d'alerte" à 20 minutes
3. [ ] Sauvegarder
4. [ ] KDS doit se rafraîchir et utiliser le nouveau seuil
5. [ ] Vérifier via SQL:
   ```sql
   SELECT wait_alert_threshold_minutes FROM restaurants WHERE id = '...' LIMIT 1;
   ```

---

## Phase 5: Production

### ✅ Préparation

- [ ] Merger la branche dans `main`
- [ ] Tag une version: `git tag v1.2.0`
- [ ] Pousser: `git push origin main --tags`

### ✅ Déploiement Infrastructure

Selon votre setup (vercel, railway, etc.):

- [ ] `npm run build` — aucune erreur
- [ ] Déployer le code
- [ ] Vérifier les logs

### ✅ Supabase Production

- [ ] Sauvegarder la migration (elle est déjà dans git)
- [ ] Appliquer la migration sur le projet prod:
  ```bash
  npx supabase db push --db-url $PROD_DB_URL
  ```
  Ou via Dashboard

- [ ] Déployer Edge Function prod:
  ```bash
  npx supabase functions deploy --project-id $PROD_PROJECT_ID kds-notify
  ```

- [ ] Configurer le webhook (Dashboard → Database Webhooks)

### ✅ Monitoring

Une fois en prod:

- [ ] Supabase Dashboard → Functions → Logs
- [ ] Vérifier les erreurs dans `kds-notify` logs
- [ ] Vérifier les stats de base de données (nombre de requêtes vw_kds_orders)
- [ ] Vérifier les stats de Realtime (nombre de connexions, messages/sec)

---

## Phase 6: Documentation & Handover

- [ ] [ ] Partager `KITCHEN_VIEW_OPTIMIZATION.md` avec l'équipe
- [ ] [ ] Mettre à jour la documentation API si applicable
- [ ] [ ] Documenter les changements de schéma DB (migrations)
- [ ] [ ] Documenter les variables d'environnement nouvelles (si applicable)

---

## Troubleshooting

### "kds_notifications table not found"
- [ ] La migration n'a pas été appliquée
- [ ] Relancer: `npx supabase db push`
- [ ] Vérifier: `SELECT * FROM kds_notifications LIMIT 1;`

### "Edge Function returns 500"
- [ ] Vérifier les logs: Dashboard → Functions → kds-notify → Logs
- [ ] Vérifier les variables d'env (JWT_SECRET, PROJECT_ID)
- [ ] Relancer le deploy: `npx supabase functions deploy kds-notify`

### "Realtime not working"
- [ ] Vérifier la table est dans la publication:
  ```sql
  SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  ```
- [ ] Si absent, ajouter: `ALTER PUBLICATION supabase_realtime ADD TABLE kds_notifications;`
- [ ] Redémarrer la connexion Realtime (F5 ou reconnect)

### "is_urgent toujours false"
- [ ] Vérifier le calcul du seuil en SQL:
  ```sql
  SELECT id, elapsed_minutes, is_urgent, threshold_minutes FROM vw_kds_orders LIMIT 1;
  ```
- [ ] Si `is_urgent = false` mais `elapsed > threshold`, il y a un bug
- [ ] Vérifier que `wait_alert_threshold_minutes` est bien défini:
  ```sql
  SELECT wait_alert_threshold_minutes FROM restaurants WHERE id = '...' LIMIT 1;
  ```

---

## ✨ Résumé du gain

Une fois déployé:

| Aspect | Avant | Après |
|--------|-------|-------|
| **Calcul côté client** | Tous les renders | Rarement (fallback uniquement) |
| **Appels API** | Taille full | 30% moins de données |
| **Fraîcheur données** | Realtime + 30s polling | Realtime + 60s refresh timer |
| **Urgence détectée** | Client (retard) | Serveur (immédiat) |
| **Notifications** | Client only | Client + serveur (SMS/email) |

**Résultat:** Vue cuisine plus rapide, plus précise, coûts réseau réduits.
