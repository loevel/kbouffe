Guide de migration vers Supabase
--------------------------------

Ce dossier contient des migrations SQL converties depuis `packages/db/migrations`.

Étapes recommandées pour migrer la base de données sur Supabase

1. Relecture
   - Ouvrir chaque fichier SQL et vérifier les types/contraintes (IDs, `created_at`, `updated_at`).
   - Les migrations converties remplacent les `unixepoch()` par `now()` (TIMESTAMPTZ) — valider la compatibilité avec vos données existantes.

2. Exécution (option A — Supabase SQL Editor)
   - Ouvrir le Supabase Dashboard → SQL Editor.
   - Créer un nouveau script et copier-coller le contenu de chaque fichier, ou utiliser l'option "Run SQL file" si disponible.

3. Exécution (option B — CLI / psql)
   - Vous pouvez exécuter les fichiers via `psql` contre l'URL Postgres fournie par Supabase (ou la CLI Supabase pour se connecter).
   - Exemple succinct :

```bash
# exporter la DATABASE_URL fournie par Supabase
export DATABASE_URL="postgresql://user:password@host:5432/postgres"
# exécuter un fichier SQL
psql "$DATABASE_URL" -f apps/web-dashboard/supabase/migrations/007_restaurant_members.sql
```

4. Vérifications post-migration
   - Vérifier les indexes et les policies RLS (certaines migrations ajoutent des colonnes qui nécessitent des policies supplémentaires).
   - Vérifier l'intégration avec `auth.users` (triggers dans `001_initial_schema.sql`).

5. Backups et rollback
   - Toujours faire un export SQL ou un backup avant d'exécuter des migrations en production.
   - Créer des scripts de rollback si nécessaire.

Notes
- Ces migrations ont été converties automatiquement et nécessitent une revue manuelle.
- Si vous voulez, je peux :
  - ajuster les IDs en UUID avec `uuid_generate_v4()` partout;
  - générer des scripts de backfill (ex : créer `restaurant_members` à partir de `users`);
  - exécuter une vérification plus approfondie des conflits entre les migrations existantes et celles ajoutées.

Modifications récentes
- Les migrations dupliquées liées à "dine-in" (`008_dine_in_tenant.sql` et `009_dine_in_global.sql`) ont été supprimées
   car leurs changements sont déjà présents dans `004_dine_in_features.sql`.

Prochaines étapes recommandées
- Revue manuelle pour :
   - harmoniser `BOOLEAN` vs `INTEGER` flags (préférer `BOOLEAN` dans Postgres public schema),
   - convertir les clés primaires en `UUID` si vous souhaitez normaliser (`uuid_generate_v4()`),
   - créer scripts de backfill/rollback avant exécution en production.
