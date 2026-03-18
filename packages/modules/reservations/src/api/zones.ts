import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const zonesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Create zone
zonesRoutes.post("/", async (c) => {
    const body = await c.req.json();
    const name = body.name?.trim();
    const type = body.type ?? "indoor";

    if (!name) return c.json({ error: "Le nom de la zone est requis" }, 400);

    // Determine next sort order
    const { data: lastZone } = await c.var.supabase
        .from("table_zones")
        .select("sort_order")
        .eq("restaurant_id", c.var.restaurantId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextSort = (lastZone?.sort_order ?? 0) + 1;

    const { data, error } = await c.var.supabase
        .from("table_zones")
        .insert({
            restaurant_id: c.var.restaurantId,
            name,
            type,
            sort_order: nextSort,
            is_active: true,
            description: body.description ?? null,
        } as any)
        .select()
        .single();

    if (error) {
        console.error("Create zone error:", error);
        return c.json({ error: "Erreur lors de la création de la zone" }, 500);
    }

    return c.json({ success: true, zone: data }, 201);
});

// Delete zone
zonesRoutes.delete("/:id", async (c) => {
    const id = c.req.param("id");

    // Detach tables from this zone before deleting
    await c.var.supabase
        .from("restaurant_tables")
        .update({ zone_id: null } as any)
        .eq("zone_id", id)
        .eq("restaurant_id", c.var.restaurantId);

    const { error } = await c.var.supabase
        .from("table_zones")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId);

    if (error) {
        console.error("Delete zone error:", error);
        return c.json({ error: "Erreur lors de la suppression de la zone" }, 500);
    }

    return c.json({ success: true });
});
