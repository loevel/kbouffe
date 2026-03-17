/**
 * Payouts route
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const payoutsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /payouts */
payoutsRoutes.get("/", async (c) => {
    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    const { data, count, error } = await c.var.supabase
        .from("payouts")
        .select("*", { count: "exact" })
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("Payouts query error:", error);
        return c.json({ error: "Erreur lors de la récupération des versements" }, 500);
    }

    return c.json({ 
        payouts: data ?? [],
        pagination: {
            page,
            limit,
            total: count ?? 0,
            totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
        }
    });
});
