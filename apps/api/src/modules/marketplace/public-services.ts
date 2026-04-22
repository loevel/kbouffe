import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type { Env, Variables } from "../../types";

export const marketplacePublicServicesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /services — Get available marketplace services (public) */
marketplacePublicServicesRoutes.get("/services", async (c) => {
    const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY);

    const { data, error } = await supabase
        .from("marketplace_services")
        .select("id, name, description, price, category, duration_days, features, icon, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(200);

    if (error) {
        return c.json({ error: "Failed to fetch marketplace services" }, 500);
    }

    return c.json({ data: data || [] });
});
