/**
 * Payouts route
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const payoutsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /payouts */
payoutsRoutes.get("/", async (c) => {
    const { data, error } = await c.var.supabase
        .from("payouts")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Payouts query error:", error);
        return c.json({ error: "Erreur lors de la récupération des versements" }, 500);
    }

    return c.json({ payouts: data ?? [] });
});
