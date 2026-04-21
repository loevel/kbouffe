/**
 * Marketplace public routes — services available to all users
 *
 * GET /marketplace/services — Get active marketplace services
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";

export const marketplacePublicServicesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /services — Get available marketplace services (public) */
marketplacePublicServicesRoutes.get("/services", async (c) => {
    const supabase = c.var.supabase;

    const { data, error } = await supabase
        .from("marketplace_services")
        .select("id, name, description, price, category, duration_days, features, icon, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (error) {
        return c.json({ error: "Failed to fetch marketplace services" }, 500);
    }

    return c.json({ data: data || [] });
});
