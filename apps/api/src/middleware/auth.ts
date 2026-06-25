/**
 * Supabase auth middleware for Hono.
 *
 * Extracts the Bearer token from the Authorization header,
 * validates it with Supabase, and resolves the merchant's restaurant.
 *
 * Sets c.var.userId, c.var.restaurantId, and c.var.supabase on success.
 */
import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../types";
import type { TeamRole } from "../lib/permissions";
import { LRUCache } from "../lib/lru-cache";

// Per-isolate cache: userId → { restaurantId, memberRole }
// TTL of 5 minutes; max 500 entries (well within Cloudflare memory limits)
const restaurantCache = new LRUCache<string, { restaurantId: string; memberRole: TeamRole }>(500, 5 * 60 * 1000);

/**
 * Merchant auth middleware.
 * Requires a valid Supabase JWT and resolves the user's restaurant.
 */
export const authMiddleware = createMiddleware<{
    Bindings: Env;
    Variables: Variables;
}>(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        console.warn("[Auth Middleware] 401: No Bearer token found in Authorization header");
        return c.json({ error: "Non authentifié" }, 401);
    }

    const token = authHeader.slice(7);

    // Create a Supabase client with the user's JWT
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verify the JWT locally via JWKS (asymmetric ES256). No network round-trip
    // after the first JWKS fetch per isolate; falls back to a network getUser()
    // automatically for legacy HS256 tokens.
    const { data: claimsData, error } = await supabase.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;

    if (error || !userId) {
        return c.json({ error: "Token invalide ou expiré" }, 401);
    }
    const userEmail = (claimsData?.claims?.email as string | undefined) ?? null;

    // Check per-isolate LRU cache before hitting Supabase
    const cached = restaurantCache.get(userId);
    if (cached) {
        c.set("userId", userId);
        c.set("userEmail", userEmail);
        c.set("restaurantId", cached.restaurantId);
        c.set("memberRole", cached.memberRole);
        c.set("supabase", supabase);
        return next();
    }

    // Resolve the merchant's restaurant + role from Supabase public.users
    const { data: dbUser } = await supabase
        .from("users")
        .select("restaurant_id")
        .eq("id", userId)
        .maybeSingle();

    let restaurantId = dbUser?.restaurant_id;
    let memberRole: TeamRole | null = restaurantId ? "owner" : null;

    // Fallback to restaurant_members (team members invited by an owner)
    if (!restaurantId) {
        const { data: memberData } = await supabase
            .from("restaurant_members")
            .select("restaurant_id, role")
            .eq("user_id", userId)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

        restaurantId = (memberData as any)?.restaurant_id;
        memberRole = ((memberData as any)?.role as TeamRole) ?? null;
    }

    if (!restaurantId) {
        return c.json({ error: "Restaurant non trouvé ou accès non autorisé" }, 404);
    }

    // Populate cache
    restaurantCache.set(userId, { restaurantId, memberRole: memberRole as TeamRole });

    // Set context variables
    c.set("userId", userId);
    c.set("userEmail", userEmail);
    c.set("restaurantId", restaurantId);
    c.set("memberRole", memberRole);
    c.set("supabase", supabase);

    await next();
});
