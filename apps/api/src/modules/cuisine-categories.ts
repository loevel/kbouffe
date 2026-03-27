import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../types";

/**
 * Public route: GET /api/cuisine-categories
 * Returns active cuisine categories ordered by sort_order.
 * No auth required — used by the client discovery component.
 */
export const cuisineCategoriesPublicRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

cuisineCategoriesPublicRoutes.get("/", async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
        .from("cuisine_categories")
        .select("id, label, value, icon, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) return c.json({ error: error.message }, 500);

    return c.json({ data: data ?? [] });
});
