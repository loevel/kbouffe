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

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
        return c.json({ error: "Token invalide ou expiré" }, 401);
    }

    // Resolve the merchant's restaurant from Supabase public.users
    const { data: dbUser, error: userError } = await supabase
        .from("users")
        .select("restaurant_id")
        .eq("id", user.id)
        .maybeSingle();

    let restaurantId = dbUser?.restaurant_id;

    // Fallback to restaurant_members if not in user profile
    if (!restaurantId) {
        const { data: memberData } = await supabase
            .from("restaurant_members")
            .select("restaurant_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();
        
        restaurantId = (memberData as any)?.restaurant_id;
    }

    if (!restaurantId) {
        return c.json({ error: "Restaurant non trouvé ou accès non autorisé" }, 404);
    }

    // Set context variables
    c.set("userId", user.id);
    c.set("restaurantId", restaurantId);
    c.set("supabase", supabase);

    await next();
});
