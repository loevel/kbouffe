/**
 * userAuthMiddleware — Validates JWT and sets userId/supabase.
 * Unlike authMiddleware, does NOT require a restaurant (works for clients too).
 * Optionally resolves restaurantId if the user is a merchant.
 */
import { createMiddleware } from "hono/factory";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../types";

export const userAuthMiddleware = createMiddleware<{
    Bindings: Env;
    Variables: Variables;
}>(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ error: "Non authentifié" }, 401);
    }

    const token = authHeader.slice(7);

    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return c.json({ error: "Token invalide ou expiré" }, 401);
    }

    c.set("userId", user.id);
    c.set("supabase", supabase);

    // Optionally resolve restaurantId (merchant or staff) — null for pure clients
    const { data: ownedRestaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

    if (ownedRestaurant?.id) {
        c.set("restaurantId", ownedRestaurant.id);
    } else {
        const { data: memberData } = await supabase
            .from("restaurant_members")
            .select("restaurant_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

        if ((memberData as any)?.restaurant_id) {
            c.set("restaurantId", (memberData as any).restaurant_id);
        }
    }

    await next();
});
