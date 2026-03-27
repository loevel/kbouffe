import { Hono } from "hono";
import { CoreEnv as Env, CoreVariables as Variables } from "@kbouffe/module-core";

export const zonesRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

/**
 * GET /zones
 * List all zones for the restaurant.
 */
zonesRoutes.get("/", async (c) => {
    try {
        const { data, error } = await c.var.supabase
            .from("table_zones")
            .select("*")
            .eq("restaurant_id", c.var.restaurantId)
            .order("sort_order", { ascending: true });

        if (error) {
            console.error("Zones query error:", error);
            return c.json({ error: "Erreur lors de la récupération des zones" }, 500);
        }

        return c.json({ zones: data ?? [] });
    } catch (error) {
        console.error("GET /zones error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * POST /zones
 * Create a new zone.
 */
zonesRoutes.post("/", async (c) => {
    try {
        const body = await c.req.json().catch(() => ({})) as any;

        if (!body.name) {
            return c.json({ error: "Le nom de la zone est requis" }, 400);
        }

        // Calculate next sort_order if not provided
        let sortOrder = body.sort_order;
        if (sortOrder === undefined) {
            const { data: maxZone } = await c.var.supabase
                .from("table_zones")
                .select("sort_order")
                .eq("restaurant_id", c.var.restaurantId)
                .order("sort_order", { ascending: false })
                .limit(1)
                .maybeSingle();
            sortOrder = maxZone ? maxZone.sort_order + 1 : 0;
        }

        const zoneData = {
            restaurant_id: c.var.restaurantId,
            name: body.name,
            type: body.type ?? "indoor",
            description: body.description ?? null,
            sort_order: sortOrder,
            is_active: true,
        };

        const { data, error } = await c.var.supabase
            .from("table_zones")
            .insert(zoneData)
            .select()
            .single();

        if (error) {
            console.error("Create zone error:", error);
            return c.json({ error: "Erreur lors de la création de la zone" }, 500);
        }

        return c.json({ success: true, zone: data }, 201);
    } catch (error) {
        console.error("POST /zones error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * PATCH /zones/:id
 * Update a zone.
 */
zonesRoutes.patch("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json().catch(() => ({})) as any;

        const updateData: Record<string, unknown> = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.type !== undefined) updateData.type = body.type;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
        if (body.is_active !== undefined) updateData.is_active = body.is_active;

        const { data, error } = await c.var.supabase
            .from("table_zones")
            .update(updateData)
            .eq("id", id)
            .eq("restaurant_id", c.var.restaurantId)
            .select()
            .single();

        if (error) {
            console.error("Update zone error:", error);
            return c.json({ error: "Erreur lors de la mise à jour" }, 500);
        }

        return c.json({ success: true, zone: data });
    } catch (error) {
        console.error("PATCH /zones/:id error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});

/**
 * DELETE /zones/:id
 * Delete a zone.
 */
zonesRoutes.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id");

        const { error } = await c.var.supabase
            .from("table_zones")
            .delete()
            .eq("id", id)
            .eq("restaurant_id", c.var.restaurantId);

        if (error) {
            console.error("Delete zone error:", error);
            return c.json({ error: "Erreur lors de la suppression" }, 500);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error("DELETE /zones/:id error:", error);
        return c.json({ error: "Erreur interne" }, 500);
    }
});
