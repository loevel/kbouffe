/**
 * Admin auth middleware for Hono.
 *
 * Extends the standard auth middleware by checking that the user
 * has role "admin" in the database.
 * Exposes adminRole in context for per-route RBAC.
 */
import type { Context, Next } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { AdminRole, Env, Variables } from "../types";
import { LRUCache } from "../lib/lru-cache";

// Per-isolate cache: userId → admin row. Short TTL (60s) bounds the window during
// which a revoked admin keeps access, while removing a DB round-trip on /admin/*.
interface AdminContext { restaurantId: string; adminRole: AdminRole | null; email: string | null }
const adminCache = new LRUCache<string, AdminContext>(200, 60 * 1000);

export async function adminMiddleware(
    c: Context<{ Bindings: Env; Variables: Variables }>,
    next: Next,
) {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ error: "Token manquant" }, 401);
    }

    // Service-role client is required for all admin operations
    if (!c.env.SUPABASE_SERVICE_ROLE_KEY) {
        return c.json({ error: "Service non configuré" }, 500);
    }

    const token = authHeader.slice(7);
    const anonClient = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify the JWT locally via JWKS (asymmetric ES256) — no network round-trip
    // after the first JWKS fetch per isolate (falls back to getUser() for HS256).
    const { data: claimsData, error } = await anonClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;
    if (error || !userId) {
        return c.json({ error: "Token invalide" }, 401);
    }

    const adminClient = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Bypass the cache on mutations (POST/PUT/PATCH/DELETE) so a revoked admin
    // loses write access immediately; reads tolerate the 60s cache window.
    const isWrite = c.req.method !== "GET" && c.req.method !== "HEAD";
    let ctx = isWrite ? undefined : adminCache.get(userId);
    if (!ctx) {
        // Look up user in Supabase public.users and check admin role
        const { data: dbUser, error: dbError } = await anonClient
            .from("users")
            .select("id, role, admin_role, restaurant_id")
            .eq("id", userId)
            .maybeSingle();

        if (dbError || !dbUser || dbUser.role !== "admin") {
            return c.json({ error: "Accès réservé aux administrateurs" }, 403);
        }

        ctx = {
            restaurantId: dbUser.restaurant_id ?? "",
            adminRole: (dbUser.admin_role as AdminRole) ?? null,
            email: (claimsData?.claims?.email as string | undefined) ?? null,
        };
        adminCache.set(userId, ctx);
    }

    c.set("userId", userId);
    c.set("userEmail", ctx.email);
    c.set("restaurantId", ctx.restaurantId);
    c.set("supabase", adminClient);
    c.set("adminRole", ctx.adminRole);

    await next();
}
