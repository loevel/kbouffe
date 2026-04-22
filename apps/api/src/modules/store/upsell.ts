/**
 * Upsell rules routes
 *
 * GET    /upsell-rules      — List rules for the restaurant
 * POST   /upsell-rules      — Create a rule
 * PATCH  /upsell-rules/:id  — Update a rule
 * DELETE /upsell-rules/:id  — Delete a rule
 */
import { Hono } from "hono";
import type { Env, Variables } from "../../types";
import { parseBody } from "../../lib/body";

export const upsellRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const ALLOWED_UPDATE_FIELDS = new Set([
    "trigger_type", "trigger_product_id", "trigger_category_id", "trigger_min_cart",
    "suggested_product_id", "discount_percent", "custom_message",
    "position", "priority", "max_suggestions", "is_active",
]);

/** GET /upsell-rules */
upsellRoutes.get("/", async (c) => {
    const { restaurantId, supabase } = c.var;

    const { data, error } = await supabase
        .from("upsell_rules")
        .select("id, trigger_type, trigger_product_id, trigger_category_id, trigger_min_cart, suggested_product_id, discount_percent, custom_message, position, priority, max_suggestions, is_active, created_at")
        .eq("restaurant_id", restaurantId)
        .order("priority", { ascending: false });

    if (error) return c.json({ error: "Erreur lors du chargement des règles d'upsell" }, 500);
    return c.json({ rules: data ?? [] });
});

/** POST /upsell-rules */
upsellRoutes.post("/", async (c) => {
    const { restaurantId, supabase } = c.var;
    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);
    const {
        trigger_type = "global",
        trigger_product_id = null,
        trigger_category_id = null,
        trigger_min_cart = 0,
        suggested_product_id,
        discount_percent = 0,
        custom_message = null,
        position = "pre_checkout",
        priority = 0,
        max_suggestions = 3,
    } = body;

    if (!suggested_product_id) return c.json({ error: "suggested_product_id est requis" }, 400);

    const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("id", suggested_product_id)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

    if (!product) return c.json({ error: "Produit suggéré non trouvé dans votre restaurant" }, 400);

    const { data, error } = await supabase
        .from("upsell_rules")
        .insert({
            restaurant_id: restaurantId,
            trigger_type, trigger_product_id, trigger_category_id, trigger_min_cart,
            suggested_product_id, discount_percent, custom_message,
            position, priority, max_suggestions, is_active: true,
        } as any)
        .select()
        .single();

    if (error) return c.json({ error: "Erreur lors de la création de la règle" }, 500);
    return c.json({ rule: data }, 201);
});

/** PATCH /upsell-rules/:id */
upsellRoutes.patch("/:id", async (c) => {
    const { restaurantId, supabase } = c.var;
    const id = c.req.param("id");
    const body = await parseBody(c);
    if (!body) return c.json({ error: "Corps de la requête invalide" }, 400);

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
        if (ALLOWED_UPDATE_FIELDS.has(key)) updates[key] = value;
    }

    if (Object.keys(updates).length === 0) return c.json({ error: "Aucune modification fournie" }, 400);

    const { data, error } = await supabase
        .from("upsell_rules")
        .update(updates as any)
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .select()
        .single();

    if (error || !data) return c.json({ error: "Règle non trouvée" }, 404);
    return c.json({ rule: data });
});

/** DELETE /upsell-rules/:id */
upsellRoutes.delete("/:id", async (c) => {
    const { restaurantId, supabase } = c.var;
    const id = c.req.param("id");

    const { error } = await supabase
        .from("upsell_rules")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", restaurantId);

    if (error) return c.json({ error: "Erreur lors de la suppression" }, 500);
    return c.json({ success: true });
});
