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

    // Always revalidate the admin role against the DB — no caching — so a revoked
    // admin loses access immediately on every request (reads and writes alike).
    const { data: dbUser, error: dbError } = await anonClient
        .from("users")
        .select("id, role, admin_role, restaurant_id")
        .eq("id", userId)
        .maybeSingle();

    if (dbError || !dbUser || dbUser.role !== "admin") {
        return c.json({ error: "Accès réservé aux administrateurs" }, 403);
    }

    c.set("userId", userId);
    c.set("userEmail", (claimsData?.claims?.email as string | undefined) ?? null);
    c.set("restaurantId", dbUser.restaurant_id ?? "");
    c.set("supabase", adminClient);
    c.set("adminRole", (dbUser.admin_role as AdminRole) ?? null);

    await next();
}
