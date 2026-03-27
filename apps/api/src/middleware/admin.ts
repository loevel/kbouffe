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

    const token = authHeader.slice(7);
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return c.json({ error: "Token invalide" }, 401);
    }

    // Look up user in Supabase public.users and check admin role
    const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("id, role, admin_role, restaurant_id")
        .eq("id", user.id)
        .maybeSingle();

    if (dbError || !dbUser || dbUser.role !== "admin") {
        return c.json({ error: "Accès réservé aux administrateurs" }, 403);
    }

    c.set("userId", user.id);
    c.set("restaurantId", dbUser.restaurant_id ?? "");
    c.set("supabase", supabase);
    c.set("adminRole", (dbUser.admin_role as AdminRole) ?? null);

    await next();
}
