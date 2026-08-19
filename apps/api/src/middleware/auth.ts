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

    // Always resolve restaurant + role from the DB (no caching) so a removed or
    // downgraded team member loses access immediately on every request.
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

    // Dernier recours : la propriété du restaurant elle-même. L'inscription crée
    // le restaurant, puis met à jour users.restaurant_id, puis insère la ligne
    // d'équipe — sans transaction. Si l'une des deux dernières étapes échoue, le
    // restaurant existe et reste publié pendant que son propriétaire est renvoyé
    // en 404 sur toute l'API. La RLS « restaurants: propriétaire CRUD » autorise
    // déjà cette lecture, et un propriétaire ne doit jamais perdre l'accès à son
    // propre établissement pour une jointure manquante.
    if (!restaurantId) {
        const { data: owned } = await supabase
            .from("restaurants")
            .select("id")
            .eq("owner_id", userId)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

        if ((owned as any)?.id) {
            restaurantId = (owned as any).id;
            memberRole = "owner";
        }
    }

    if (!restaurantId) {
        return c.json({ error: "Restaurant non trouvé ou accès non autorisé" }, 404);
    }

    // Set context variables
    c.set("userId", userId);
    c.set("userEmail", userEmail);
    c.set("restaurantId", restaurantId);
    c.set("memberRole", memberRole);
    c.set("supabase", supabase);

    await next();
});
