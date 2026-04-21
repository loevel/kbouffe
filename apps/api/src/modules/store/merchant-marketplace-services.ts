import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const merchantMarketplaceServicesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

merchantMarketplaceServicesRoutes.get("/services", async (c) => {
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("marketplace_services")
        .select("id, name, description, price, category, duration_days, features, icon")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) return c.json({ error: "Erreur lors du chargement des services" }, 500);
    return c.json({ services: data || [] });
});
