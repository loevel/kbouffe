# UUID Harmonization Plan

Goal: ensure IDs across all databases and tenants are UUIDs (stable, unique) and avoid mixed id types.

Steps
1. Inventory current ID columns across `packages/db` migrations and tenant schemas.
   - Use `packages/db/migrations/global-index/meta/0000_snapshot.json` to get schema snapshot for the Global Index.
2. Ensure application code expects UUID strings (36 chars). Add runtime guards where necessary.
3. Backfill/convert legacy numeric/text ids (if any):
   - Add new UUID column (e.g. `new_id UUID`) to the table.
   - Populate `new_id` with generated UUIDs using `gen_random_uuid()` or `crypto.randomUUID()` during a controlled migration window.
   - Update all referencing tables to point to `new_id` (create new FK columns referencing `new_id`) and copy values.
   - Switch application to read/write the new UUID columns, then drop the old id columns.

Best practices
- Run these changes in a staging environment first.
- Always preserve audit logs and backups before mass updates.
- For distributed caches, invalidate keys referencing old ids.

Tools and scripts
- We can generate per-table migration templates. Ask me to scaffold these for specific tables (e.g. `users`, `restaurants`).
