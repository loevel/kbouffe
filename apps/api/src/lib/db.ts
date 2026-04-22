/**
 * Database helpers for the API Worker.
 */
import { createClient } from "@supabase/supabase-js";
import type { Env } from "../types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Return a tenant data client based on the tenant registration record.
 * If the tenant is hosted on Supabase, returns a Supabase admin client.
 */
export function getTenantClientFromRecord(record: { provider?: string } & Record<string, any>, env: Env): SupabaseClient {
    const provider = record.provider ?? "supabase";
    
    if (provider === "supabase") {
        if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error("Supabase env not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
        }
        return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY as string, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }

    throw new Error(`Tenant provider '${provider}' is not supported.`);
}

/**
 * Returns a service-role Supabase client for admin operations (bypasses RLS).
 * Prefer using `c.var.supabase` in admin handlers (set by adminMiddleware).
 * Use this helper only when outside a Hono request context.
 */
export function getAdminClient(env: Env): SupabaseClient {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Admin Supabase client requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY as string, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
