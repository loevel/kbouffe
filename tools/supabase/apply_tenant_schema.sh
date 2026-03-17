#!/usr/bin/env bash
# Apply the restaurant tenant SQL to a Supabase Postgres database.
#
# Usage:
# 1) Using a direct Postgres connection (recommended):
#    SUPABASE_DB_URL="postgres://user:pass@db.host:5432/postgres" ./tools/supabase/apply_tenant_schema.sh
#
# 2) Using psql installed locally (same as above). The script will detect `psql`.
#
# 3) Manual: open `packages/db/migrations/0002_restaurant_tenant.sql` and paste
#    into Supabase SQL editor (Dashboard → SQL Editor → New query) and run.

set -euo pipefail

SQL_FILE="packages/db/migrations/0002_restaurant_tenant.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "SQL file not found: $SQL_FILE"
  exit 1
fi

if [ -n "${SUPABASE_DB_URL:-}" ]; then
  if command -v psql >/dev/null 2>&1; then
    echo "Applying tenant schema to SUPABASE_DB_URL using psql..."
    psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
    echo "Done."
    exit 0
  else
    echo "psql not found. Install psql or run the SQL manually in Supabase SQL editor." >&2
    exit 2
  fi
else
  echo "No SUPABASE_DB_URL set.\nOptions:\n - Set SUPABASE_DB_URL and run this script (requires psql).\n - Open $SQL_FILE and run it in the Supabase SQL Editor (Dashboard → SQL Editor)."
  exit 3
fi
