/**
 * Platform integrations helper.
 * Reads API keys from `platform_integrations` table (DB priority),
 * falls back to process.env if not set in DB.
 *
 * NEVER use on the client side — server only.
 */
import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS to read integration secrets
function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !key) throw new Error("Missing Supabase service role env vars");
    return createClient(url, key, { auth: { persistSession: false } });
}

type IntegrationRow = {
    key_name: string;
    key_value: string | null;
};

let _cache: Map<string, string | null> | null = null;
let _cacheAt = 0;
const CACHE_TTL = 60_000; // 1 minute

async function loadAll(): Promise<Map<string, string | null>> {
    const now = Date.now();
    if (_cache && now - _cacheAt < CACHE_TTL) return _cache;

    try {
        const db = getServiceClient();
        const { data } = await db
            .from("platform_integrations")
            .select("key_name, key_value") as { data: IntegrationRow[] | null };

        _cache = new Map((data ?? []).map((r) => [r.key_name, r.key_value]));
        _cacheAt = now;
    } catch {
        _cache = new Map();
    }

    return _cache;
}

/**
 * Get a single integration key.
 * DB value takes priority over process.env.
 */
export async function getIntegration(keyName: string): Promise<string | undefined> {
    const map = await loadAll();
    const dbVal = map.get(keyName);
    if (dbVal && dbVal.trim() !== "") return dbVal;
    return process.env[keyName];
}

/** Invalidate the in-memory cache (call after a PUT). */
export function invalidateIntegrationCache() {
    _cache = null;
}
