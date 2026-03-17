/**
 * Module verification middleware for Hono.
 *
 * Verifies if a specific module is activated for the current restaurant
 * in the public store_modules table.
 * Must be used AFTER authMiddleware (which sets c.var.restaurantId).
 */
import { createMiddleware } from "hono/factory";
import type { Env, Variables } from "../types";

/**
 * Middleware to check if a specific module is active for the current restaurant.
 * 
 * @param moduleId The ID of the module to require (e.g., "reservations", "marketing")
 */
export const requireModule = (moduleId: string) => {
    return createMiddleware<{
        Bindings: Env;
        Variables: Variables;
    }>(async (c, next) => {
        const restaurantId = c.var.restaurantId;

        // Ensure we have a restaurant context (from authMiddleware)
        if (!restaurantId) {
            return c.json({ error: "Contexte du restaurant introuvable" }, 403);
        }

        // Check if the module is active for this restaurant in Supabase
        const { data: activeModule, error } = await c.var.supabase
            .from("store_modules")
            .select("*")
            .eq("restaurant_id", restaurantId)
            .eq("module_id", moduleId)
            .eq("is_active", true)
            .maybeSingle();

        if (error || !activeModule) {
            return c.json({ error: `Le module '${moduleId}' n'est pas activé pour ce restaurant` }, 403);
        }

        await next();
    });
};
