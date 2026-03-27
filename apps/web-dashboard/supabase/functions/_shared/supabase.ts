import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Create a Supabase client for Edge Functions.
 * - Default: uses anon key + Authorization header from request (respects RLS)
 * - useServiceRole: bypasses RLS (for triggers, cron, admin tasks)
 */
export function createSupabaseClient(
  req?: Request,
  useServiceRole = false,
) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    useServiceRole
      ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      : Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers:
          useServiceRole || !req
            ? {}
            : { Authorization: req.headers.get("Authorization")! },
      },
    },
  );
}
