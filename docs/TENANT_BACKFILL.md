# Tenant Backfill (Supabase → Global Index)

This document describes the backfill procedure to register restaurants hosted on Supabase into the Global Index `tenant_databases` table (Cloudflare D1).

Prerequisites
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available (service role key)
- `wrangler` configured and authenticated to your Cloudflare account
- The Global Index D1 database name (default: `kbouffe-global-index`)

Quick automated approach
1. Set environment variables:

```bash
export SUPABASE_URL="https://<project>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
export GLOBAL_D1_NAME="kbouffe-global-index"
```

2. Run the backfill script (executes `wrangler d1 execute` for each restaurant):

```bash
node tools/supabase/backfill_tenants.js
```

What the script does
- Queries `restaurants` from Supabase. For each row it inserts a tenant row in `tenant_databases` on the Global Index D1 if none exists.
- Inserted values: `db_name='supabase'`, `db_id='supabase:<slug>'`, `provider='supabase'`.

Safety notes
- The script issues one `wrangler d1 execute` per restaurant. If you prefer batching, modify the script to group inserts.
- Test on a staging Global Index before running in production.

Manual approach
- Open `packages/db/migrations/0002_restaurant_tenant.sql` and run it in Supabase SQL editor for the tenant schema.
- Insert tenant rows into the Global Index using the SQL shown in the MCP tool output.
