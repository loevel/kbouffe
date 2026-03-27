/**
 * Coupons routes — migrated from web-dashboard/src/app/api/coupons/
 *
 * GET  /coupons           — List coupons
 * POST /coupons           — Create a coupon
 * GET  /coupons/validate  — Validate a coupon code (public)
 */
import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const couponsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/** GET /coupons */
couponsRoutes.get("/", async (c) => {
    const { data, error } = await c.var.supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Coupons query error:", error);
        return c.json({ error: "Erreur lors de la récupération des codes promo" }, 500);
    }

    return c.json({ coupons: data ?? [], total: data?.length ?? 0 });
});

/** POST /coupons */
couponsRoutes.post("/", async (c) => {
    const body = await c.req.json();

    if (!body.code?.trim()) return c.json({ error: "Le code est requis" }, 400);
    if (!body.name?.trim()) return c.json({ error: "Le nom interne est requis" }, 400);
    if (!["percent", "fixed"].includes(body.type)) return c.json({ error: "Type invalide" }, 400);
    if (typeof body.value !== "number" || body.value <= 0) return c.json({ error: "La valeur doit être positive" }, 400);
    if (body.type === "percent" && body.value > 100) return c.json({ error: "Le pourcentage ne peut dépasser 100%" }, 400);

    const { data, error } = await c.var.supabase
        .from("coupons")
        .insert({
            id: crypto.randomUUID(),
            restaurant_id: c.var.restaurantId,
            code: (body.code as string).toUpperCase().trim(),
            name: body.name.trim(),
            description: body.description ?? null,
            type: body.type,
            value: body.value,
            min_order: body.min_order ?? 0,
            max_discount: body.max_discount ?? null,
            max_uses: body.max_uses ?? null,
            max_uses_per_customer: body.max_uses_per_customer ?? 1,
            current_uses: 0,
            is_active: body.is_active ?? true,
            starts_at: body.starts_at ?? null,
            expires_at: body.expires_at ?? null,
            applies_to: body.applies_to ?? "all",
            created_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

    if (error) {
        if (error.code === "23505") return c.json({ error: "Ce code promo existe déjà" }, 409);
        console.error("Coupon create error:", error);
        return c.json({ error: "Erreur lors de la création du code promo" }, 500);
    }

    return c.json({ coupon: data }, 201);
});

/** PATCH /coupons/:id */
couponsRoutes.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    // Ensure ownership
    const { data: existing } = await c.var.supabase
        .from("coupons")
        .select("id")
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (!existing) return c.json({ error: "Code promo introuvable" }, 404);

    const allowed = [
        "name", "description", "type", "value", "min_order", "max_discount",
        "max_uses", "max_uses_per_customer", "is_active", "starts_at", "expires_at", "applies_to",
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
        if (key in body) updates[key] = body[key];
    }

    const { data, error } = await c.var.supabase
        .from("coupons")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Coupon update error:", error);
        return c.json({ error: "Erreur lors de la mise à jour du code promo" }, 500);
    }

    return c.json({ coupon: data });
});

/** DELETE /coupons/:id */
couponsRoutes.delete("/:id", async (c) => {
    const id = c.req.param("id");

    const { error } = await c.var.supabase
        .from("coupons")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId);

    if (error) {
        console.error("Coupon delete error:", error);
        return c.json({ error: "Erreur lors de la suppression du code promo" }, 500);
    }

    return c.json({ success: true });
});
