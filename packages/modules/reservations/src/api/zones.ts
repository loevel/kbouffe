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
            image_url: body.image_url ?? null,
            image_urls: body.image_urls ?? [],
            color: body.color ?? "#6366f1",
            capacity: body.capacity ?? 0,
            min_party_size: body.min_party_size ?? 1,
            amenities: body.amenities ?? [],
            pricing_note: body.pricing_note ?? null,
        } as any)
        .select()
        .single();

    if (error) {
        console.error("Create zone error:", error);
        return c.json({ error: "Erreur lors de la création de la zone" }, 500);
    }

    return c.json({ success: true, zone: data }, 201);
});

// Update zone
zonesRoutes.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.image_urls !== undefined) updateData.image_urls = body.image_urls;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.min_party_size !== undefined) updateData.min_party_size = body.min_party_size;
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.pricing_note !== undefined) updateData.pricing_note = body.pricing_note;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;

    if (Object.keys(updateData).length === 0) {
        return c.json({ error: "Aucune donnée à mettre à jour" }, 400);
    }

    const { data, error } = await c.var.supabase
        .from("table_zones")
        .update(updateData as any)
        .eq("id", id)
        .eq("restaurant_id", c.var.restaurantId)
        .select()
        .single();

    if (error) {
        console.error("Update zone error:", error);
        return c.json({ error: "Erreur lors de la mise à jour de la zone" }, 500);
    }

    return c.json({ success: true, zone: data });
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
